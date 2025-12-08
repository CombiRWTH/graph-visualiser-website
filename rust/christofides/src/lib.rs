#![warn(rust_2018_idioms, unreachable_pub)]
#![forbid(elided_lifetimes_in_paths, unsafe_code)]

#[cfg(test)]
mod tests;

// TODO:
// - Improvement: We use naive search for the minimum weighted perfect matching instead of the blossom algorithm (or any polynomial algorithm for that matter)
// - Chore: First two examples are not metric. Please add some metric examples.
// - Requirement: Implement a property metric for graphs (that would be in graph/src/properties).
use algorithm::{
	abuse::{StateMachine, States},
	export_algorithm_to_wasm, Algorithm, ExampleGraph, Pseudocode, VisualisationState
};
use graph::{Graph, Link, Property};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use wasm_bindgen::prelude::*;

/// initialise panic handler
#[wasm_bindgen(start)]
pub fn init_panic_handler() {
	console_error_panic_hook::set_once();
}

type ChristofidesConfiguration = (usize,);

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChristofidesVisualisationState {
	pub graph: Graph<ChristofidesConfiguration>,
	pub start_node: usize,
	pub minimal_spanning_tree: Vec<(usize, usize)>,
	pub vertices_odd: Vec<usize>,
	pub minimal_matching: Vec<(usize, usize)>,
	pub introduced_edges: Vec<(usize, usize)>,
	pub euler_tour: Vec<usize>,
	pub hamilton_cycle: Vec<usize>,
	pub helptext: String
}

impl VisualisationState for ChristofidesVisualisationState {
	type Configuration = ChristofidesConfiguration;
	fn new(graph: Graph<ChristofidesConfiguration>, start_node: usize) -> Self {
		Self {
			graph: graph.preprocess_links_as_undirected(),
			start_node,
			minimal_spanning_tree: Vec::new(),
			vertices_odd: Vec::new(),
			minimal_matching: Vec::new(),
			introduced_edges: Vec::new(),
			euler_tour: Vec::new(),
			hamilton_cycle: Vec::new(),
			helptext: "Initialized".to_string()
		}
	}
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Pseudocode)]
enum ChristofidesPseudocode {
	/// Compute a minimal spanning Tree $T \subseteq G$
	Line1,

	/// Compute a minimal perfect matching $M$ on $V_o \subseteq V$. The set $V_o$ contains all vertices in $T$ with odd degree $d_T(v)$.
	Line2,

	/// Add $M$ to $T$ and compute an Euler-Tour $Eu$
	Line3,

	/// Skip over previously visited cities to obtain a Hamilton cycle $H$ from $Eu$
	Line4,

	/// Return H
	Line5
}

async fn christofides(
	mut state: ChristofidesVisualisationState,
	out: States<ChristofidesPseudocode, ChristofidesVisualisationState>
) {
	// Compute minimal spanning tree via Kruskal
	state.graph.links.sort_by_key(|link| link.weight);
	for link in state.graph.links.iter() {
		if !creates_cycle(&state.minimal_spanning_tree, (link.source, link.target)) {
			state.minimal_spanning_tree.push((link.source, link.target));
		}
	}

	state.helptext = "A minimal spanning tree connects all vertices using edges that keep the cost minimal".to_string();
	out.yield_state(ChristofidesPseudocode::Line1, state.clone()).await;

	// Determine vertices with odd degrees using minimal spanning tree as reference
	let mut vertex_degrees = HashMap::new();
	for node in state.graph.nodes.iter() {
		vertex_degrees.insert(node.id, 0);
	}
	// Count neighbors to determine degrees
	for (source, target) in &state.minimal_spanning_tree {
		*vertex_degrees.get_mut(source).unwrap() += 1;
		*vertex_degrees.get_mut(target).unwrap() += 1;
	}
	for node in state.graph.nodes.iter() {
		if *vertex_degrees.get_mut(&node.id).unwrap() % 2 == 1 {
			state.vertices_odd.push(node.id);
		}
	}

	// Compute minimal weighted perfect matching
	// This naive approach is sufficient for our examples; use the blossom algorithm when implementing an algorithm dedicated to this step.
	state.minimal_matching = find_minimal_weighted_perfect_matching(&mut state.graph, &mut state.vertices_odd);
	for &(source, target) in state.minimal_matching.iter() {
		// Determine link
		if let Some(link_index) = state
			.graph
			.links
			.iter()
			.position(|link| link.source == source && link.target == target)
		{
			// Matching edge is also minimal spanning tree edge, introduce new edge
			if state.minimal_spanning_tree.contains(&(source, target)) {
				state.graph.links.push(Link {
					source: target,
					target: source,
					weight: state.graph.links[link_index].weight
				});
				state.introduced_edges.push((target, source));
			}
		}
	}

	state.helptext =
		"Determine vertices with odd degree in the tree\nand compute a minimal matching on those using edges of the whole graph".to_string();
	out.yield_state(ChristofidesPseudocode::Line2, state.clone()).await;

	// Annotate vertices with euler tour
	// Construct (not necessarily symmetric) adjacency matrix. Graph is maybe a multi-graph with at most 2 parallel edges
	let mut graph_only_euler_edges = Graph::new();
	for &(source, target) in state.minimal_spanning_tree.iter() {
		graph_only_euler_edges.add_edge(source, target, 1);
	}
	for &(source, target) in state.minimal_matching.iter() {
		if state.minimal_spanning_tree.contains(&(source, target)) {
			graph_only_euler_edges.add_edge(target, source, 1);
		} else {
			graph_only_euler_edges.add_edge(source, target, 1);
		}
	}
	// Compute Euler tour
	state.euler_tour = euler_tour(&graph_only_euler_edges);

	state.helptext = "Combine matching edges and tree edges disjointly and compute an euler tour".to_string();
	out.yield_state(ChristofidesPseudocode::Line3, state.clone()).await;

	// Compute Hamilton Cycle by removing duplicates from Euler Tour
	for vertex in &state.euler_tour {
		if !state.hamilton_cycle.contains(vertex) {
			state.hamilton_cycle.push(*vertex);
		}
	}

	state.helptext = "Skip over previously visited city and take the next unvisited city instead. If an edge was not drawn, we add it, taking the weight of the shortest path between its endpoints as its weight. (Graph is euclidean)".to_string();
	out.yield_state(ChristofidesPseudocode::Line4, state.clone()).await;

	state.helptext = "We are finished".to_string();
	out.yield_state(ChristofidesPseudocode::Line5, state.clone()).await;
}

struct Christofides;

impl Algorithm for Christofides {
	type VisualisationState = ChristofidesVisualisationState;
	type Pseudocode = ChristofidesPseudocode;

	// All examples (except for the example from the lecture) are complete.
	// This is important, as one cannot generally assume that an Euler tour will exist for an incomplete graph.
	const EXAMPLES: &'static [ExampleGraph<'static>] = &[
		ExampleGraph {
			description: "",
			adj: &[&[0, 1, 2, 3], &[0, 0, 1, 2], &[0, 0, 0, 1], &[0, 0, 0, 0]]
		},
		ExampleGraph {
			description: "",
			adj: &[
				&[0, 1, 2, 3, 4],
				&[0, 0, 1, 2, 3],
				&[0, 0, 0, 1, 2],
				&[0, 0, 0, 0, 1],
				&[0, 0, 0, 0, 0]
			]
		},
		ExampleGraph {
			description: "",
			adj: &[
				&[0, 1, 1, 1, 2],
				&[0, 0, 2, 2, 1],
				&[0, 0, 0, 2, 2],
				&[0, 0, 0, 0, 2],
				&[0, 0, 0, 0, 0]
			]
		},
		ExampleGraph {
			description: "",
			adj: &[
				&[0, 2, 5, 6, 4, 7],
				&[0, 0, 3, 5, 2, 6],
				&[0, 0, 0, 2, 3, 5],
				&[0, 0, 0, 0, 3, 4],
				&[0, 0, 0, 0, 0, 3],
				&[0, 0, 0, 0, 0, 0]
			]
		},
		ExampleGraph {
			description: "",
			adj: &[
				&[0, 7, 3, 8, 9, 10, 12], // A
				&[0, 0, 6, 11, 5, 6, 9],  // B
				&[0, 0, 0, 7, 13, 9, 8],  // C
				&[0, 0, 0, 0, 3, 7, 4],   // D
				&[0, 0, 0, 0, 0, 2, 5],   // E
				&[0, 0, 0, 0, 0, 0, 2],   // F
				&[0, 0, 0, 0, 0, 0, 0]    // G
			]
		},
		ExampleGraph {
			description: "",
			adj: &[
				&[0, 8, 3, 9, 10, 11, 12, 14], // A
				&[0, 0, 7, 12, 6, 5, 9, 10],   // B
				&[0, 0, 0, 8, 14, 10, 8, 13],  // C
				&[0, 0, 0, 0, 4, 7, 3, 6],     // D
				&[0, 0, 0, 0, 0, 3, 8, 4],     // E
				&[0, 0, 0, 0, 0, 0, 1, 2],     // F
				&[0, 0, 0, 0, 0, 0, 0, 3],     // G
				&[0, 0, 0, 0, 0, 0, 0, 0]      // H
			]
		},
		ExampleGraph {
			// This example is taken directly from the lecture.
			// While its layout gets rather ugly, we still observe the following:
			// 1. The output per step as well as the result is correct
			// 2. The algorithm is (despite the brute-force approach) efficient while working with 10 nodes and 22 edges
			description: "Lecture notes Fig. 11.8",
			adj: &[
				//a  b  c  d  e  f  g  h  i   j
				&[0, 9, 9, 0, 0, 8, 0, 0, 0, 18], // a
				&[0, 0, 3, 0, 6, 0, 0, 0, 0, 0],  // b
				&[0, 0, 0, 2, 4, 9, 0, 0, 0, 0],  // c
				&[0, 0, 0, 0, 2, 8, 9, 0, 0, 0],  // d
				&[0, 0, 0, 0, 0, 0, 9, 0, 0, 0],  // e
				&[0, 0, 0, 0, 0, 0, 7, 0, 9, 10], // f
				&[0, 0, 0, 0, 0, 0, 0, 4, 5, 0],  // g
				&[0, 0, 0, 0, 0, 0, 0, 0, 1, 4],  // h
				&[0, 0, 0, 0, 0, 0, 0, 0, 0, 3],  // i
				&[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]   // j
			]
		}
	];

	const REQUIRED_PROPERTIES: &'static [Property] = &[Property::WeightedLinks, Property::Complete];
	const INCOMPATIBLE_PROPERTIES: &'static [Property] = &[Property::Empty];

	fn new(state: Self::VisualisationState) -> StateMachine<Self::Pseudocode, Self::VisualisationState> {
		StateMachine::new(|out| christofides(state, out))
	}
}

export_algorithm_to_wasm!(Christofides);

/// Helper functions
/// Cycle check for the Christofides algorithm
///
/// # Arguments
///
/// * `tree_edges` - Edges that we have put into T.
/// * `node_pair` - Describes an edge. We check if a cycle is created if that edge is added to T.
fn creates_cycle(tree_edges: &[(usize, usize)], node_pair: (usize, usize)) -> bool {
	// Initialize data
	let mut edges: HashSet<(usize, usize)> = HashSet::new();
	let mut nodes: HashSet<usize> = HashSet::new();
	nodes.insert(node_pair.0);
	nodes.insert(node_pair.1);
	edges.insert(node_pair);
	for tree_edge in tree_edges.iter() {
		edges.insert((tree_edge.0, tree_edge.1));
		if !nodes.contains(&tree_edge.0) {
			nodes.insert(tree_edge.0);
		}
		if !nodes.contains(&tree_edge.1) {
			nodes.insert(tree_edge.1);
		}
	}

	// Check
	let mut visited: HashSet<usize> = HashSet::new();

	for n in nodes.iter() {
		if visited.contains(n) {
			continue;
		} else if dfs(*n, &mut visited, None, &nodes, &edges) {
			return true;
		}
	}
	false
}

/// Recursive DFS for the Cycle check
///
/// # Arguments
///
/// * `current` - The current node. From there, we will consider its neighbors for the search.
/// * `visited` - A collection of nodes that we have already visited. A cycle occurs if we visit those again.
/// * `parent` - The node that was previously the current. Prevents that we simply traverse back to where we came from.
/// * `nodes`- Set of nodes.
/// * `edges` - Set of edges.
fn dfs(
	current: usize,
	visited: &mut HashSet<usize>,
	parent: Option<usize>,
	nodes: &HashSet<usize>,
	edges: &HashSet<(usize, usize)>
) -> bool {
	visited.insert(current);
	for n in nodes {
		if !&edges.contains(&(current, *n)) && !&edges.contains(&(*n, current)) {
			continue;
		}
		// If n is a parent then we cannot take that edge as we would walk backwards
		if let Some(p) = parent {
			if *n == p {
				continue;
			}
		}
		// We found a node that we already visited => Cycle
		if visited.contains(n) || dfs(*n, visited, Some(current), nodes, edges) {
			return true;
		}
	}
	false
}

/// Brute force attempt. Computation is inexpensive on examples with up to 10 nodes.
fn find_minimal_weighted_perfect_matching(
	graph: &mut Graph<ChristofidesConfiguration>,
	vertices: &mut Vec<usize>
) -> Vec<(usize, usize)> {
	// Gather permutations
	let permutations = permutations(vertices);

	// Helper to keep track of weigths
	let mut adj_matrix = graph.preprocess_links_as_undirected().generate_adj_matrix();
	let n = adj_matrix.len();
	for i in 0 .. n {
		for j in i + 1 .. n {
			if adj_matrix[i][j] > 0 {
				adj_matrix[j][i] = adj_matrix[i][j];
			}
		}
	}

	// Initialize
	let mut minimal_matching: Vec<usize> = Vec::new();
	let mut minimal_weight = usize::MAX;

	// Brute force every combination
	for perm in permutations {
		let mut weight = 0;
		for i in (0 .. perm.len()).step_by(2) {
			weight += adj_matrix[i][i + 1];
		}

		if weight < minimal_weight {
			minimal_matching = perm.clone();
			minimal_weight = weight;
		}
	}

	// Transform resulting matching (permutation) into links for easier computation
	// (each link source value will be smaller than the link target value)
	let mut minimal_matching_edges: Vec<(usize, usize)> = Vec::new();
	for i in (0 .. minimal_matching.len()).step_by(2) {
		let source = minimal_matching[i];
		let target = minimal_matching[i + 1];
		if source > target {
			minimal_matching_edges.push((target, source));
		} else {
			minimal_matching_edges.push((source, target));
		}
	}

	minimal_matching_edges
}

/// Helper function for brute force minimal weighted matching
fn permutations(elements: &mut Vec<usize>) -> Vec<Vec<usize>> {
	let n = elements.len();
	let mut perms: Vec<Vec<usize>> = Vec::new();
	let mut cycles: Vec<usize> = vec![0; n];

	perms.push(elements.clone());
	let mut i = 0;
	while i < n {
		if cycles[i] < i {
			if i % 2 == 0 {
				elements.swap(0, i);
			} else {
				elements.swap(cycles[i], i);
			}
			perms.push(elements.clone());
			cycles[i] += 1;
			i = 0;
		} else {
			cycles[i] = 0;
			i += 1;
		}
	}
	perms
}

/// Asserts that a euler tour exists! AKA does not check even degrees of all vertices
/// At the beginning, this function takes any starting vertex.
/// From there, it traverses edges and removes them until it encounters a vertix with degree 0.
/// This will be a (not necessarily complete) euler tour. If there are remaining edges
/// the subgraph will also have an euler tour. We simply do that procedure again
/// and insert it to our original tour at the correct index.
fn euler_tour(graph: &Graph<ChristofidesConfiguration>) -> Vec<usize> {
	// Gather links without weights
	let mut edges: Vec<(usize, usize)> = Vec::new();
	for link in graph.links.iter() {
		edges.push((link.source, link.target));
	}

	// Initialization
	let mut tour: Vec<usize> = Vec::new();
	let mut insert_at_index: usize = 0;
	let mut starting_vertex: usize = 0;
	let mut stack: Vec<usize> = Vec::new();
	while !edges.is_empty() {
		// Pick a starting vertex from the tour if possible
		if !tour.is_empty() {
			'outer: for (i, vertex) in tour.iter().enumerate() {
				for (source, target) in edges.iter() {
					if source == vertex {
						starting_vertex = *source;
						insert_at_index = i;
						break 'outer;
					}
					if target == vertex {
						starting_vertex = *target;
						insert_at_index = i;
						break 'outer;
					}
				}
			}
		} else {
			starting_vertex = edges[0].0;
			insert_at_index = 0;
		}
		// If we are in a secondary cycle, we want to avoid a double entry of the entry + exit point,
		// and therefore delete its occurence in the first cycle
		// X -> node -> Y  =>  X -> node -> second_cycle -> node -> Y, and not
		// X -> node -> Y  =>  X -> node -> second_cycle -> node -> node -> Y
		if insert_at_index < tour.len() {
			tour.remove(insert_at_index);
		}
		// Find an euler (sub)tour
		stack.push(starting_vertex);
		while let Some(current_vertex) = stack.pop() {
			tour.insert(insert_at_index, current_vertex);
			insert_at_index += 1;
			let wrapped_edge = edges
				.iter()
				.find(|(source, target)| (*source == current_vertex || *target == current_vertex));
			if let Some((edge_source, edge_target)) = wrapped_edge {
				let neighbor = if *edge_source == current_vertex {
					edge_target
				} else {
					edge_source
				};

				stack.push(*neighbor);
				let index: usize = if edges.contains(&(current_vertex, *neighbor)) {
					edges
						.iter()
						.position(|&(source, target)| source == current_vertex && target == *neighbor)
						.unwrap()
				} else {
					edges
						.iter()
						.position(|&(source, target)| source == *neighbor && target == current_vertex)
						.unwrap()
				};
				edges.remove(index);
			}
		}
	}
	tour
}
