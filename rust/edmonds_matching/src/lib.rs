#![warn(rust_2018_idioms, unreachable_pub)]
#![forbid(elided_lifetimes_in_paths, unsafe_code)]

#[cfg(test)]
mod tests;

use algorithm::{
	abuse::{StateMachine, States},
	export_algorithm_to_wasm, Algorithm, ExampleGraph, Pseudocode, VisualisationState
};
use graph::{Graph, Link, Node, Property};
use serde::{Deserialize, Serialize};
use std::{
	collections::{HashMap, HashSet},
	hash::RandomState,
	option::Option
};
use wasm_bindgen::prelude::*;

/// initialise panic handler
#[wasm_bindgen(start)]
pub fn init_panic_handler() {
	console_error_panic_hook::set_once();
}

type EdmondsConfiguration = (i64,);

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EdmondsVisualisationState {
	pub graph: Graph<EdmondsConfiguration>,
	pub original_graph: Graph<EdmondsConfiguration>,
	pub index_variable: usize,
	pub blossom_nodes: Vec<usize>,
	pub tree_edges: HashSet<(usize, usize)>,
	pub tree_root: usize,
	pub augmenting_path: Vec<usize>,
	pub matching: HashSet<(usize, usize)>,
	pub aux_matching: HashSet<(usize, usize)>,
	pub helptext: String
}

impl VisualisationState for EdmondsVisualisationState {
	type Configuration = EdmondsConfiguration;

	fn new(graph: Graph<EdmondsConfiguration>, _start_node: usize) -> Self {
		Self {
			graph: graph.preprocess_links_as_undirected(),
			original_graph: graph.preprocess_links_as_undirected(),
			index_variable: 1,
			blossom_nodes: [].into(),
			tree_edges: HashSet::new(),
			tree_root: 0,
			augmenting_path: [].into(),
			matching: HashSet::new(),
			aux_matching: HashSet::new(),
			helptext: "Initialized".to_string()
		}
	}
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Pseudocode)]
enum EdmondsPseudocode {
	/// Set $G' = G$, $M = \emptyset$ and $M' = \emptyset$
	Line1,

	/// While $G' \ne \emptyset$ and an exposed node exists do
	Line2,

	///   Construct a maximal $M'$ -alternating tree $T$ in $G'$ starting in any exposed node (e.g. Breath-First-Search)
	Line3,

	///   Case 1: $T$ contains $M'$ -augmenting path
	Line4,

	///       Construct corresponding $M$-augmenting path $W$ in $G$
	Line5,

	///       Augment $M$ along $W$
	Line6,

	///       Set $G' \coloneqq G$ and $M' \coloneqq M$     // restart in $G$ with bigger matching
	Line7,

	///   Case 2: $T$ contains blossom $B$ with base $v_0$
	Line8,

	///       Shrink $B$ to a vertex $v_B$
	Line9,

	///       If $xv_0 \in E(T) \cap M'$, set $M' = M' - E(B) + xv_B$
	Line10,

	///       Else set $M' = M' - E(B)$
	Line11,

	///       Set $G' \coloneqq G'^c [V (B)]$               // restart in smaller graph
	Line12,

	///   Case 3: $T$ is Hungarian
	Line13,

	///       Set $G' \coloneqq G' - V (T )$                       // restart in smaller graph
	Line14,

	/// Return $M$
	Line15
}

/// Returns any exposed (unmatched) vertex in G'.
/// An exposed vertex is one that does not appear in any matching edge in `aux_matching`.
fn find_exposed(g: &Graph<EdmondsConfiguration>, aux_matching: &HashSet<(usize, usize)>) -> Option<usize> {
	// Build a set of all matched nodes
	let mut matched = HashSet::new();
	for &(u, v) in aux_matching {
		matched.insert(u);
		matched.insert(v);
	}

	// Find the first unmatched (exposed) vertex
	for node in &g.nodes {
		if !matched.contains(&node.id) {
			return Some(node.id);
		}
	}
	None
}
async fn edmonds_matching(
	mut state: EdmondsVisualisationState,
	out: States<EdmondsPseudocode, EdmondsVisualisationState>
) {
	use EdmondsPseudocode::*;
	let mut blossoms = HashMap::new();

	loop {
		if state.graph.nodes.is_empty() {
			state.graph = state.original_graph.clone();
			state.blossom_nodes = [].into();
			state.aux_matching = [].into();
			break;
		}
		let exposed = find_exposed(&state.graph, &state.aux_matching);

		state.helptext = "Check exposed vertex in G'".to_string();
		out.yield_state(Line2, state.clone()).await;

		if exposed.is_none() {
			state.graph = state.original_graph.clone();
			state.blossom_nodes = [].into();
			state.aux_matching = [].into();
			break;
		}

		let root = exposed.unwrap();
		state.tree_root = root;

		let mut tree = AlternatingTree::new(root);
		state.helptext = "Construct maximal M'-alternating tree T".to_string();

		let tree_result = grow_tree(&state.graph, &state.aux_matching, &mut tree, &mut state.tree_edges);

		match tree_result {
			TreeEvent::AugmentingPath(path) => {
				out.yield_state(Line3, state.clone()).await;

				// Line 4: augmenting path found
				state.helptext = "Augmenting path found in T".to_string();
				out.yield_state(Line4, state.clone()).await;

				// Line 5: translate to M-augmenting path W
				state.graph = state.original_graph.clone(); // reset to full graph
				state.blossom_nodes = [].into();
				let w = lift_path(&state.graph, &path, &blossoms, &state.matching);
				state.augmenting_path = w.clone();

				state.helptext = "Construct M-augmenting path W".to_string();
				out.yield_state(Line5, state.clone()).await;

				// Line 6: augment M along W
				augment(&mut state.matching, &w);
				state.helptext = "Augment M".to_string();
				out.yield_state(Line6, state.clone()).await;

				// Line 7: restart with M' = M and G' = G
				state.aux_matching = state.matching.clone();

				state.helptext = "Restart in G with updated matching".to_string();
				out.yield_state(Line7, state.clone()).await;
				state.tree_edges = [].into();
			},

			TreeEvent::BlossomFound(blossom) => {
				out.yield_state(Line3, state.clone()).await;

				// Line 8: Blossom found
				state.helptext = "Blossom detected".to_string();
				out.yield_state(Line8, state.clone()).await;

				// Line 9: Shrink blossom
				let shrunk = shrink_blossom(&state.graph, &state.aux_matching, &blossom);
				blossoms.insert(blossom.base, blossom.cycle.clone());
				state.graph = shrunk.graph;
				state.blossom_nodes.push(blossom.base);
				// Save mapping for path lifting
				state.helptext = "Shrink blossom to vertex v_B".to_string();
				out.yield_state(Line9, state.clone()).await;

				// Line 10, 11: Update M'
				state.aux_matching = shrunk.new_matching;
				state.helptext = "Update M' after shrinking".to_string();
				out.yield_state(Line10, state.clone()).await;
				out.yield_state(Line11, state.clone()).await;

				// Line 12: Restart in G'^c[V(B)]
				state.helptext = "Restart in contracted graph".to_string();
				out.yield_state(Line12, state.clone()).await;
				state.tree_edges = [].into();
			},

			TreeEvent::Hungarian => {
				out.yield_state(Line3, state.clone()).await;

				// Line 13: T is Hungarian
				state.helptext = "T is Hungarian".to_string();
				out.yield_state(Line13, state.clone()).await;

				// Line 14: Remove vertices of T from G'
				state.graph = remove_vertices(&state.graph, &tree.vertices);
				state.helptext = "Restart in smaller graph".to_string();
				out.yield_state(Line14, state.clone()).await;
				state.tree_edges = [].into();
			}
		}
	}

	// Line 15: Return M
	state.helptext = "Return maximum matching".to_string();
	out.yield_state(Line15, state.clone()).await;
}
/// Removes all vertices in `to_remove` from graph `g`.
/// Returns a new graph with:
///   - only the remaining vertices
///   - edges only between remaining vertices
///   - nodes reindexed contiguously (0..new_n-1)
fn remove_vertices(g: &Graph<EdmondsConfiguration>, to_remove: &HashSet<usize>) -> Graph<EdmondsConfiguration> {
	use std::collections::HashMap;
	let mut new_graph = g.clone(); // Start from a copy and prune

	// 1. Determine mapping old_index → new_index
	let mut map_old_to_new = HashMap::new();
	let mut next_index = 0;

	for old in 0 .. g.nodes.len() {
		if !to_remove.contains(&old) {
			map_old_to_new.insert(old, next_index);
			next_index += 1;
		}
	}

	// 2. Build new node list
	new_graph.nodes.retain(|node| map_old_to_new.contains_key(&node.id));

	for node in new_graph.nodes.iter_mut() {
		node.id = map_old_to_new[&node.id];
	}

	// 3. Build new edge list
	new_graph
		.links
		.retain(|e| map_old_to_new.contains_key(&e.source) && map_old_to_new.contains_key(&e.target));

	for link in new_graph.links.iter_mut() {
		link.source = map_old_to_new[&link.source];
		link.target = map_old_to_new[&link.target];
	}

	new_graph
}
struct AlternatingTree {
	root: usize,
	pub vertices: HashSet<usize>,
	pub parent: HashMap<usize, usize>,
	pub level: HashMap<usize, usize> // even = free, odd = matched
}

impl AlternatingTree {
	fn new(root: usize) -> Self {
		let mut t = Self {
			root,
			vertices: HashSet::new(),
			parent: HashMap::new(),
			level: HashMap::new()
		};
		t.vertices.insert(root);
		t.level.insert(root, 0);
		t
	}

	fn add_edge(&mut self, u: usize, v: usize) {
		self.vertices.insert(u);
		self.vertices.insert(v);
		self.parent.insert(v, u);
		self.level.insert(v, self.level[&u] + 1);
	}
}

enum TreeEvent {
	AugmentingPath(Vec<usize>),
	BlossomFound(Blossom),
	Hungarian
}
/// Proper BFS that grows an M-alternating tree.
/// Even levels: free nodes, reached via unmatched edges.
/// Odd  levels: matched nodes, reached via matched edges.
fn grow_tree(
	g: &Graph<EdmondsConfiguration>,
	m: &HashSet<(usize, usize)>,
	tree: &mut AlternatingTree,
	state_tree_edges: &mut HashSet<(usize, usize)>
) -> TreeEvent {
	use std::collections::{HashSet, VecDeque};

	let mut queue = VecDeque::new();
	queue.push_back(tree.root);

	let mut visited = HashSet::new();
	visited.insert(tree.root);

	// Remember first (shortest) augmenting path found during BFS
	let mut found_augmenting_path: Option<Vec<usize>> = None;

	// helper: check if {u,v} is in M
	let is_matched = |u: usize, v: usize| m.contains(&(u, v)) || m.contains(&(v, u));

	// helper: check if v is exposed
	let is_exposed = |v: usize| !m.iter().any(|&(a, b)| a == v || b == v);

	while let Some(u) = queue.pop_front() {
		let level_u = tree.level[&u];
		let u_is_even = level_u % 2 == 0;

		for link in &g.links {
			let v = if link.source == u {
				link.target
			} else if link.target == u {
				link.source
			} else {
				continue;
			};

			let edge_is_matched = is_matched(u, v);

			// BLOSSOM DETECTION:
			// v already in tree and same parity ⇒ blossom
			if tree.vertices.contains(&v)
				&& tree.level[&v] % 2 == level_u % 2
				&& ((level_u % 2 == 1 && edge_is_matched) || (level_u % 2 == 0 && !edge_is_matched))
			{
				// Step 1: collect ancestors of u
				let mut ancestors_u = HashSet::new();
				let mut x = u;
				ancestors_u.insert(x);
				while let Some(&p) = tree.parent.get(&x) {
					x = p;
					ancestors_u.insert(x);
				}

				// Step 2: walk v upward to LCA
				let mut y = v;
				while !ancestors_u.contains(&y) {
					y = tree.parent[&y];
				}
				let base = y;

				// Step 3: path u → base
				let mut path_u = vec![u];
				let mut t = u;
				while t != base {
					t = tree.parent[&t];
					path_u.push(t);
				}

				// Step 4: path v → base
				let mut path_v = vec![v];
				let mut t = v;
				while t != base {
					t = tree.parent[&t];
					path_v.push(t);
				}

				// Step 5: form cycle
				path_v.pop(); // remove base duplication
				path_v.reverse(); // base → ... → v

				let mut cycle = path_u;
				cycle.extend(path_v);

				return TreeEvent::BlossomFound(Blossom { cycle, base });
			}

			// EXTENSION RULES
			// Root: all edges allowed
			// EVEN (≠ root): unmatched edges
			// ODD: matched edges
			let allowed = if u == tree.root {
				true
			} else if u_is_even {
				!edge_is_matched
			} else {
				edge_is_matched
			};

			if !allowed {
				continue;
			}

			if !visited.contains(&v) {
				tree.add_edge(u, v); // sets parent + level
				state_tree_edges.insert((u, v));

				visited.insert(v);
				queue.push_back(v);

				let level_v = tree.level[&v];

				// AUGMENTING PATH (record only, do not return)
				if is_exposed(v) && level_v % 2 == 1 {
					let mut path = vec![v];
					let mut curr = v;
					while let Some(&p) = tree.parent.get(&curr) {
						path.push(p);
						curr = p;
					}
					path.reverse();

					// BFS ⇒ first one is shortest
					if found_augmenting_path.is_none() {
						found_augmenting_path = Some(path);
					}
				}
			}
		}
	}

	// BFS exhausted → decide result
	if let Some(path) = found_augmenting_path {
		return TreeEvent::AugmentingPath(path);
	}
	TreeEvent::Hungarian
}

struct Blossom {
	cycle: Vec<usize>,
	base: usize
}

struct ShrinkResult {
	pub graph: Graph<EdmondsConfiguration>,
	pub new_matching: HashSet<(usize, usize)>
}
/// Shrink a blossom by collapsing all cycle nodes into the base node.
/// No reindexing of IDs except: all blossom nodes -> base.
/// All other nodes keep their original IDs.
fn shrink_blossom(g: &Graph<EdmondsConfiguration>, m: &HashSet<(usize, usize)>, b: &Blossom) -> ShrinkResult {
	let blossom_nodes: HashSet<usize> = b.cycle.iter().cloned().collect();
	let base = b.base;

	// 1. New node list:
	//    Keep all nodes NOT in the blossom.
	//    Add exactly one node with id=base.
	let mut new_nodes = Vec::new();
	let mut added_base = false;

	for node in g.nodes.iter() {
		let id = node.id;
		if blossom_nodes.contains(&id) {
			if !added_base {
				new_nodes.push(Node::new(base, format!("B({})", base)));
				added_base = true;
			}
		} else {
			new_nodes.push(node.clone()); // keep original
		}
	}

	// 2. New edges:
	let mut new_links = Vec::new();
	let mut seen = HashSet::new();

	for link in g.links.iter() {
		let mut u = link.source;
		let mut v = link.target;

		// Rewrite blossom nodes → base
		if blossom_nodes.contains(&u) {
			u = base;
		}
		if blossom_nodes.contains(&v) {
			v = base;
		}

		// Skip internal blossom edges (base -> base)
		if u == v {
			continue;
		}

		// Avoid duplicates (undirected graph)
		let (a, b) = if u < v { (u, v) } else { (v, u) };
		if seen.insert((a, b)) {
			new_links.push(Link::new(a, b, link.weight));
		}
	}

	// 3. Update matching:
	let mut new_matching = HashSet::new();
	let mut base_match: Option<usize> = None;

	for &(u0, v0) in m {
		let mut u = u0;
		let mut v = v0;

		let u_in = blossom_nodes.contains(&u);
		let v_in = blossom_nodes.contains(&v);

		// Skip internal blossom edges
		if u_in && v_in {
			continue;
		}

		// If exactly one endpoint is the base, record the external mate
		if u == base && !v_in {
			base_match = Some(v);
			continue;
		}
		if v == base && !u_in {
			base_match = Some(u);
			continue;
		}

		// Rewrite blossom nodes → base
		if u_in {
			u = base;
		}
		if v_in {
			v = base;
		}

		new_matching.insert((u, v));
	}

	if let Some(x) = base_match {
		new_matching.insert((base, x));
	}

	// 4. Build new graph
	let new_graph = Graph::<EdmondsConfiguration>::from_nodes_and_links(new_nodes, new_links);

	ShrinkResult {
		graph: new_graph,
		new_matching
	}
}

/// Lift a path from a contracted graph to the original graph.
///
/// # Arguments
/// * `g` - Original graph
/// * `p` - Path in the contracted graph (possibly using supernodes)
/// * `blossoms` - Map from supernode ID to original cycle nodes
pub fn lift_path(
	g: &Graph<EdmondsConfiguration>,
	p: &Vec<usize>,
	blossoms: &HashMap<usize, Vec<usize>>,
	matching: &HashSet<(usize, usize), RandomState>
) -> Vec<usize> {
	let mut result = Vec::new();

	for i in 0 .. p.len() {
		let node = p[i];

		if let Some(cycle) = blossoms.get(&node) {
			// Path enters a contracted blossom
			let connector = if i > 0 {
				Some(p[i - 1])
			} else {
				if i + 1 < p.len() {
					Some(p[i + 1])
				} else {
					None
				}
			};

			// Expand the cycle (base first, then walk in correct order)
			let mut expanded = expand_cycle(cycle, connector, matching, g, node);
			if i == 0 {
				expanded.reverse();
			}
			result.extend(expanded);
		} else {
			// Normal node
			result.push(node);
		}
	}

	result
}
fn expand_cycle(
	cycle: &Vec<usize>,
	prev: Option<usize>,
	m: &HashSet<(usize, usize)>,
	g: &Graph<EdmondsConfiguration>,
	base: usize
) -> Vec<usize> {
	if cycle.is_empty() {
		return vec![];
	}

	// Find the connection node in the cycle adjacent to prev
	let connection = if let Some(prev_node) = prev {
		// Find the node in cycle connected to prev_node in g.links
		g.links.iter().find_map(|link| {
			if link.source == prev_node && cycle.contains(&link.target) {
				Some(link.target)
			} else if link.target == prev_node && cycle.contains(&link.source) {
				Some(link.source)
			} else {
				None
			}
		})
	} else {
		None
	};

	if connection.is_none() {
		// No connection found, just return the base as fallback
		return vec![base];
	}

	let connection = connection.unwrap();

	// Helper to check if edge is matched
	let is_matched = |u: usize, v: usize| m.contains(&(u, v)) || m.contains(&(v, u));

	// Check if entry edge (prev - connection) is matched
	let entry_edge_matched = if let Some(prev_node) = prev {
		is_matched(prev_node, connection)
	} else {
		false // no prev, treat as unmatched
	};

	// The cycle is a circular list: cycle[0] == base, cycle[1..] other nodes

	// We'll walk the cycle starting at `connection` **towards the base** in one of two directions.
	// The direction chosen must create an alternating path starting with:
	// - a non-matching edge if entry edge is matched,
	// - a matching edge if entry edge is unmatched.

	// Find the index of `connection` in cycle
	let conn_idx = cycle.iter().position(|&x| x == connection).unwrap();

	// Function to check if edge between consecutive cycle nodes is matched
	let edge_matched = |a: usize, b: usize| is_matched(a, b);

	// Define a helper to build path from connection to base in forward direction along cycle
	fn walk_forward(cycle: &Vec<usize>, start: usize, base: usize) -> Vec<usize> {
		let mut path = Vec::new();
		let n = cycle.len();

		let mut i = start;
		loop {
			path.push(cycle[i]);
			if cycle[i] == base {
				break;
			}
			i = (i + 1) % n;
		}

		path
	}

	//TODO This here is buggy
	// Now, determine which direction starts with the correct edge type:
	// For both directions, check the first edge after connection node,
	// then compare its matchedness to entry_edge_matched to decide.

	// Forward direction:

	let mut forward_path = walk_forward(cycle, conn_idx, base);

	let forward_edge_1 = if forward_path.len() > 1 {
		edge_matched(forward_path[0], forward_path[1])
	} else {
		false
	};

	// Backward direction:
	// We want direction where first edge matchedness != entry_edge_matched
	let walk_forward_direction = forward_edge_1 != entry_edge_matched;

	if walk_forward_direction {
		forward_path
	} else {
		forward_path.reverse();
		forward_path
	}
}

fn augment(m: &mut HashSet<(usize, usize)>, path: &Vec<usize>) {
	for i in 0 .. path.len() - 1 {
		let e = (path[i], path[i + 1]);
		if m.contains(&e) {
			m.remove(&e);
		} else {
			m.insert(e);
		}
	}
}

struct Edmonds;

impl Algorithm for Edmonds {
	type VisualisationState = EdmondsVisualisationState;
	type Pseudocode = EdmondsPseudocode;
	// `description` is a prop that shows up in the UI `GraphCard` to give users more details about the Graph.
	const EXAMPLES: &'static [ExampleGraph<'static>] = &[
		ExampleGraph {
			description: "Lecture Example",
			adj: &[
				// 1  2  3  4  5  6  7  8  9 10 11
				&[0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 1 → 2
				&[0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], // 2 → 4
				&[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 3 → 1
				&[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], // 4 → 5
				&[0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0], // 5 → 3, 5 → 8
				&[0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0], // 6 → 4, 6 → 7
				&[0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // 7 → 8
				&[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], // 8 → 10, 8 → 11
				&[0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], // 9 → 6
				&[0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0], // 10 → 9
				&[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // 11
			]
		},
		ExampleGraph {
			description: "How to MaxMatching",
			adj: &[
				// 1  2  3  4  5  6  7  8  9 10 11
				&[0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0], // 1
				&[0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0], // 2
				&[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], // 3
				&[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], // 4
				&[0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0], // 5
				&[0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // 6
				&[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 7
				&[0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1], // 8
				&[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], // 9
				&[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 10
				&[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // 11
			]
		},
		ExampleGraph {
			description: "",
			adj: &[
				&[0, 0, 0, 2, 1],
				&[0, 0, 5, 1, 0],
				&[0, 0, 0, 4, 0],
				&[0, 0, 0, 0, 3],
				&[0, 0, 0, 0, 0]
			]
		},
		ExampleGraph {
			description: "",
			adj: &[
				&[0, 5, 0, 0, 0, 3],
				&[0, 0, 1, 0, 2, 4],
				&[0, 0, 0, 3, 3, 0],
				&[0, 0, 0, 0, 1, 0],
				&[0, 0, 0, 0, 0, 0],
				&[0, 0, 0, 0, 0, 0]
			]
		},
		ExampleGraph {
			description: "",
			adj: &[&[0, 1, 1, 4], &[0, 0, 2, 0], &[0, 0, 0, 3], &[0, 0, 0, 0]]
		},
		ExampleGraph {
			description: "",
			adj: &[
				&[0, 3, 2, 1, 2],
				&[0, 0, 4, 0, 0],
				&[0, 0, 0, 1, 0],
				&[0, 0, 0, 0, 1],
				&[0, 0, 0, 0, 0]
			]
		}
	];

	const REQUIRED_PROPERTIES: &'static [Property] = &[Property::Connected, Property::WeightedLinks];
	const INCOMPATIBLE_PROPERTIES: &'static [Property] = &[Property::Empty];

	fn new(state: Self::VisualisationState) -> StateMachine<Self::Pseudocode, Self::VisualisationState> {
		StateMachine::new(|out| edmonds_matching(state, out))
	}
}

export_algorithm_to_wasm!(Edmonds);
