#![warn(rust_2018_idioms, unreachable_pub)]
#![forbid(elided_lifetimes_in_paths, unsafe_code)]

#[cfg(test)]
mod tests;

use algorithm::{
	abuse::{StateMachine, States},
	export_algorithm_to_wasm, Algorithm, ExampleGraph, Pseudocode, VisualisationState
};
use graph::{Graph, Property};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, option::Option};
use wasm_bindgen::prelude::*;

/// initialise panic handler
#[wasm_bindgen(start)]
pub fn init_panic_handler() {
	console_error_panic_hook::set_once();
}

type KruskalConfiguration = (i64,);

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KruskalVisualisationState {
	pub graph: Graph<KruskalConfiguration>,
	pub start_node: usize,
	pub index_variable: usize,
	pub tree_edges: HashSet<(usize, usize)>,
	pub dismissed_edges: HashSet<(usize, usize)>,
	pub active_edge: Option<(usize, usize)>,
	pub helptext: String
}

impl VisualisationState for KruskalVisualisationState {
	type Configuration = KruskalConfiguration;

	fn new(graph: Graph<KruskalConfiguration>, start_node: usize) -> Self {
		Self {
			graph: graph.preprocess_links_as_undirected(),
			start_node,
			index_variable: 1,
			tree_edges: HashSet::new(),
			dismissed_edges: HashSet::new(),
			active_edge: None,
			helptext: "Initialized".to_string()
		}
	}
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Pseudocode)]
enum KruskalPseudocode {
	/// Set $T = \empty$ and sort all edges by their cost in non-decreasing order, i.e. $c(e_1) \leq c(e_2) \leq \ldots \leq c(e_m)$
	Line1,

	/// Set $i = 1$
	Line2,

	/// While $|T| \neq n - 1$ do
	Line3,

	///   If $e_i$ does not close a cycle in $T$ do
	Line4,

	///     Add $e_i$ to $T$
	Line5,

	///   Set $i = i + 1$
	Line6,

	/// Return $T$
	Line7
}

async fn kruskal(mut state: KruskalVisualisationState, out: States<KruskalPseudocode, KruskalVisualisationState>) {
	// Start of algorithm - Assume that adjacency matrix is an upper triangle matrix
	state.graph.links.sort_by_key(|link| link.weight);

	state.helptext = "Initialize empty tree edge set T. Sort edges by their cost.".to_string();
	out.yield_state(KruskalPseudocode::Line1, state.clone()).await;

	let mut i = 0;
	let mut current_link_source: usize;
	let mut current_link_target: usize;

	state.helptext = "Set counter variable i to 1.".to_string();
	out.yield_state(KruskalPseudocode::Line2, state.clone()).await;

	state.helptext = "Iterate until T is a spanning tree.".to_string();
	out.yield_state(KruskalPseudocode::Line3, state.clone()).await;

	let n = state.graph.nodes.len(); // number of nodes
	let m = state.graph.links.len(); // number of edges
	while state.tree_edges.len() != n - 1 && i < m {
		current_link_source = state.graph.links[i].source;
		current_link_target = state.graph.links[i].target;

		state.active_edge = Some((current_link_source, current_link_target));
		state.helptext = "If edge with index i does create a cycle in T then it can be added.".to_string();
		out.yield_state(KruskalPseudocode::Line4, state.clone()).await;

		if !creates_cycle(&state.tree_edges, (current_link_source, current_link_target)) {
			state.tree_edges.insert((current_link_source, current_link_target));
			state.helptext = "Add it to T.".to_string();
			out.yield_state(KruskalPseudocode::Line5, state.clone()).await;
		} else {
			state.dismissed_edges.insert((current_link_source, current_link_target));
		}
		state.active_edge = None;

		i += 1;
		state.index_variable += 1;

		state.helptext = "Increment counter variable.".to_string();
		out.yield_state(KruskalPseudocode::Line6, state.clone()).await;

		// For the while loop
		state.helptext = "Iterate until T is a spanning tree.".to_string();
		out.yield_state(KruskalPseudocode::Line3, state.clone()).await;
	}

	state.helptext = "T is a spanning tree. Return it now.".to_string();
	out.yield_state(KruskalPseudocode::Line7, state.clone()).await;
}

/// Cycle check for the Kruskal algorithm
///
/// # Arguments
///
/// * `tree_edges` - Edges that we have put into T.
/// * `node_pair` - Describes an edge. We check if a cycle is created if that edge is added to T.
fn creates_cycle(tree_edges: &HashSet<(usize, usize)>, node_pair: (usize, usize)) -> bool {
	// Initialize data
	let mut edges: Vec<(usize, usize)> = Vec::new();
	let mut nodes: Vec<usize> = Vec::new();
	nodes.push(node_pair.0);
	nodes.push(node_pair.1);
	edges.push(node_pair);
	for tree_edge in tree_edges.iter() {
		edges.push((tree_edge.0, tree_edge.1));
		if !nodes.contains(&tree_edge.0) {
			nodes.push(tree_edge.0);
		}
		if !nodes.contains(&tree_edge.1) {
			nodes.push(tree_edge.1);
		}
	}

	// Check
	let mut visited: Vec<usize> = Vec::new();

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
	visited: &mut Vec<usize>,
	parent: Option<usize>,
	nodes: &Vec<usize>,
	edges: &Vec<(usize, usize)>
) -> bool {
	visited.push(current);
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

struct Kruskal;

impl Algorithm for Kruskal {
	type VisualisationState = KruskalVisualisationState;
	type Pseudocode = KruskalPseudocode;
	// `description` is a prop that shows up in the UI `GraphCard` to give users more details about the Graph.
	const EXAMPLES: &'static [ExampleGraph<'static>] = &[
		ExampleGraph {
			description: "Lecture notes Fig. 2.14",
			adj: &[
				&[0, 2, 4, 0, 0, 0, 0],
				&[0, 0, 0, 1, 3, 0, 0],
				&[0, 0, 0, 8, 0, 0, 1],
				&[0, 0, 0, 0, 2, 0, 3],
				&[0, 0, 0, 0, 0, 4, 0],
				&[0, 0, 0, 0, 0, 0, 5],
				&[0, 0, 0, 0, 0, 0, 0]
			]
		},
		ExampleGraph {
			description: "Lecture notes Fig. 2.1",
			adj: &[
				&[0, 6, 1, 3, 0, 0, 0],
				&[0, 0, 8, 0, 0, 10, 0],
				&[0, 0, 0, 0, 4, 7, 0],
				&[0, 0, 0, 0, 12, 0, 2],
				&[0, 0, 0, 0, 0, 3, 5],
				&[0, 0, 0, 0, 0, 0, 0],
				&[0, 0, 0, 0, 0, 0, 0]
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
		StateMachine::new(|out| kruskal(state, out))
	}
}

export_algorithm_to_wasm!(Kruskal);
