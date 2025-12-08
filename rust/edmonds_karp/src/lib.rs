#![warn(rust_2018_idioms, unreachable_pub)]
#![forbid(elided_lifetimes_in_paths, unsafe_code)]

#[cfg(test)]
mod tests;

mod serialize_tuple;

use algorithm::{
	abuse::{StateMachine, States},
	export_algorithm_to_wasm, Algorithm, ExampleGraph, Pseudocode, VisualisationState
};
use graph::{Graph, Property};
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DisplayFromStr};
use serialize_tuple::KeyLink;
use std::{
	cmp,
	collections::{HashMap, VecDeque},
	option::Option
};
use wasm_bindgen::prelude::*;

/// initialise panic handler
#[wasm_bindgen(start)]
pub fn init_panic_handler() {
	console_error_panic_hook::set_once();
}

// Syntactically no change, semantically consider capacities instead of weights
type EdmondsKarpConfiguration = (usize,);

#[serde_as]
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EdmondsKarpVisualisationState {
	pub graph: Graph<EdmondsKarpConfiguration>,
	pub start_node: usize,
	pub source_node: usize,
	pub target_node: usize,
	#[serde_as(as = "HashMap<DisplayFromStr, _>")]
	pub flow: HashMap<KeyLink, usize>, // Assign an edge a flow value
	pub residual_graph: Graph<EdmondsKarpConfiguration>,
	pub augmented_path: Vec<usize>,
	pub gamma_value: usize,
	pub helptext: String
}

impl VisualisationState for EdmondsKarpVisualisationState {
	type Configuration = EdmondsKarpConfiguration;
	fn new(graph: Graph<EdmondsKarpConfiguration>, start_node: usize) -> Self {
		// Initialize flow and residual graph
		let mut flow: HashMap<KeyLink, usize> = HashMap::new();
		let mut residual_graph = Graph::new();

		for node in graph.nodes.iter() {
			residual_graph.add_node(node.id);
		}

		for link in graph.links.iter() {
			flow.insert(KeyLink((link.source, link.target)), 0);
			residual_graph.add_edge(link.source, link.target, link.weight);
		}

		let target_node = graph.nodes.len() - 1; // empty graphs do not occur

		EdmondsKarpVisualisationState {
			graph,
			start_node,
			source_node: 0,
			target_node,
			flow,
			residual_graph,
			augmented_path: Vec::new(),
			gamma_value: 0,
			helptext: "Initialized".to_string()
		}
	}
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Pseudocode)]
enum EdmondsKarpPseudocode {
	/// Set $f(a) := 0$ for all $a \in A(G)$
	Line1,

	/// While there is an $f$-augmenting $(s,t)$-path do
	Line2,

	///   Determine a $\textbf{{shortest}}$ $f$-augmenting path $p$
	Line3,

	///   Set $\gamma := \min\{{ u_f(a) \mid 	a \in A(G)$ is on $p \}}$
	Line4,

	///   Augment $f$ along $p$ by $\gamma$
	Line5,

	/// Return $f$
	Line6
}

async fn edmonds_karp(
	mut state: EdmondsKarpVisualisationState,
	out: States<EdmondsKarpPseudocode, EdmondsKarpVisualisationState>
) {
	// Initially the flow is already 0 everywhere so we do not have to anything right now
	state.helptext = "Set flow to 0".to_string();
	out.yield_state(EdmondsKarpPseudocode::Line1, state.clone()).await;

	// Check if there is an augmenting path (we do the check and determination of it simultaneously)
	state.helptext = "Check for the shortest augmenting path".to_string();
	out.yield_state(EdmondsKarpPseudocode::Line2, state.clone()).await;

	// Compute Residual graph
	state.residual_graph = get_residual_graph(&state.graph, &state.flow);

	while let Some(augmented_path) = get_augmenting_path(&state.residual_graph, state.source_node, state.target_node) {
		// Determine augmented path (which we already did)
		state.augmented_path = augmented_path;

		state.helptext = "Determine augmented path".to_string();
		out.yield_state(EdmondsKarpPseudocode::Line3, state.clone()).await;

		// Determine gamma value
		state.gamma_value = get_gamma_value(&state.residual_graph, &state.augmented_path);
		state.helptext = "Determine gamma value".to_string();
		out.yield_state(EdmondsKarpPseudocode::Line4, state.clone()).await;

		// Augment flow
		augment_flow(&mut state.flow, &state.augmented_path, state.gamma_value);
		state.helptext = "Augment".to_string();
		out.yield_state(EdmondsKarpPseudocode::Line5, state.clone()).await;

		// Reset augmented path
		state.augmented_path = Vec::new();

		// Check if there is an augmenting path
		state.residual_graph = get_residual_graph(&state.graph, &state.flow);

		state.helptext = "Check for an augmented path".to_string();
		out.yield_state(EdmondsKarpPseudocode::Line2, state.clone()).await;
	}

	// Return
	out.yield_state(EdmondsKarpPseudocode::Line6, state.clone()).await;
}

struct EdmondsKarp;

impl Algorithm for EdmondsKarp {
	type VisualisationState = EdmondsKarpVisualisationState;
	type Pseudocode = EdmondsKarpPseudocode;

	const EXAMPLES: &'static [ExampleGraph<'static>] = &[
		ExampleGraph {
			description: "Lecture Notes Fig. 5.9",
			adj: &[
				&[0, 4, 3, 0, 0, 3, 0],
				&[0, 0, 1, 2, 0, 0, 0],
				&[0, 0, 0, 0, 1, 0, 0],
				&[0, 0, 0, 0, 2, 0, 1],
				&[0, 0, 0, 0, 0, 0, 2],
				&[0, 0, 0, 0, 0, 0, 2]
			]
		},
		ExampleGraph {
			description: "",
			adj: &[&[0, 5, 0], &[0, 0, 5], &[0, 0, 0]]
		},
		ExampleGraph {
			description: "",
			adj: &[&[0, 5, 5, 0], &[0, 0, 1, 5], &[0, 0, 0, 5], &[0, 0, 0, 0]]
		},
		ExampleGraph {
			description: "",
			adj: &[&[0, 5, 2, 0], &[0, 0, 0, 5], &[0, 0, 0, 2], &[0, 0, 0, 0]]
		},
		ExampleGraph {
			description: "",
			adj: &[&[0, 5, 2, 0], &[0, 0, 0, 3], &[0, 0, 0, 10], &[0, 0, 0, 0]]
		},
		ExampleGraph {
			description: "",
			adj: &[&[0, 5, 2, 0], &[4, 0, 0, 5], &[3, 0, 0, 2], &[6, 5, 3, 0]]
		},
		ExampleGraph {
			description: "",
			adj: &[
				&[0, 16, 13, 0, 0, 0],
				&[0, 0, 10, 12, 0, 0],
				&[0, 4, 0, 0, 14, 0],
				&[0, 0, 9, 0, 0, 20],
				&[0, 0, 0, 7, 0, 4],
				&[0, 0, 0, 0, 0, 0]
			]
		},
		ExampleGraph {
			description: "",
			adj: &[
				&[0, 9, 11, 0, 0, 7],
				&[0, 0, 10, 12, 0, 4],
				&[0, 4, 0, 14, 5, 0],
				&[0, 0, 6, 0, 0, 21],
				&[0, 4, 0, 8, 0, 5],
				&[0, 0, 0, 0, 0, 0]
			]
		},
		ExampleGraph {
			description: "",
			adj: &[
				&[0, 8, 10, 0, 0, 0],
				&[0, 0, 0, 2, 7, 0],
				&[0, 3, 0, 0, 12, 0],
				&[0, 0, 0, 0, 0, 10],
				&[0, 0, 0, 4, 0, 8],
				&[0, 0, 0, 0, 0, 0]
			]
		}
	];

	const REQUIRED_PROPERTIES: &'static [Property] = &[Property::WeightedLinks];
	const INCOMPATIBLE_PROPERTIES: &'static [Property] = &[Property::Empty];

	fn new(state: Self::VisualisationState) -> StateMachine<Self::Pseudocode, Self::VisualisationState> {
		StateMachine::new(|out| edmonds_karp(state, out))
	}
}

export_algorithm_to_wasm!(EdmondsKarp);

/// Helper functions for the algorithm
fn get_residual_graph(
	graph: &Graph<EdmondsKarpConfiguration>,
	flow: &HashMap<KeyLink, usize>
) -> Graph<EdmondsKarpConfiguration> {
	let mut residual_graph = Graph::new();

	for link in graph.links.iter() {
		let Some(flow_value) = flow.get(&KeyLink((link.source, link.target))) else {
			panic!("No flow value for the link ({}, {})", link.source, link.target);
		};

		// Forward arc
		if link.weight - *flow_value > 0 {
			// Check if there already exists an edge
			if let Some(index) = residual_graph.get_edge(link.source, link.target) {
				// Modify this edge
				residual_graph.links.get_mut(index).unwrap().weight += link.weight - *flow_value;
			} else {
				residual_graph.add_edge(link.source, link.target, link.weight - *flow_value);
			}
		}

		// Reverse arc
		if *flow_value > 0 {
			if let Some(index) = residual_graph.get_edge(link.target, link.source) {
				// Modify this edge
				residual_graph.links.get_mut(index).unwrap().weight += *flow_value;
			} else {
				residual_graph.add_edge(link.target, link.source, *flow_value);
			}
		}
	}

	residual_graph
}

fn get_augmenting_path(
	residual_graph: &Graph<EdmondsKarpConfiguration>,
	source: usize,
	target: usize
) -> Option<Vec<usize>> {
	let adj_matrix = residual_graph.generate_adj_matrix();

	let mut visited = vec![false; adj_matrix.len()];
	let mut parent = vec![None; adj_matrix.len()]; // To reconstruct the path
	let mut queue = VecDeque::new();

	visited[source] = true;
	queue.push_back(source);

	while let Some(current) = queue.pop_front() {
		// weight in residual graph is the remaining capacity
		for (node_id, capacity) in adj_matrix[current].iter().enumerate() {
			if *capacity == 0 {
				continue;
			}

			if !visited[node_id] {
				visited[node_id] = true;
				parent[node_id] = Some(current);
				queue.push_back(node_id);

				if node_id == target {
					// Reconstruct path from target to source using `parent`
					let mut path = vec![target];
					let mut u = target;

					while let Some(p) = parent[u] {
						path.push(p);
						u = p;
					}

					path.reverse();
					return Some(path);
				}
			}
		}
	}

	None
}

fn get_gamma_value(residual_graph: &Graph<EdmondsKarpConfiguration>, augmented_path: &Vec<usize>) -> usize {
	// Minimum capacity in the residual graph along the augmented path

	// augmented path must have at least two elements
	if augmented_path.len() < 2 {
		panic!("Augmenting path contains less than 2 elements! Cannot compute gamma value");
	}

	// Initialize
	let mut current = augmented_path[0];
	let mut next = augmented_path[1];
	let initial_link = residual_graph
		.links
		.iter()
		.find(|&link| link.source == current && link.target == next)
		.expect("augmenting path does not exist in residual graph!");

	let mut gamma_value = initial_link.weight;

	for node in augmented_path.iter().skip(2) {
		current = next;
		next = *node;
		let next_link = residual_graph
			.links
			.iter()
			.find(|&link| link.source == current && link.target == next)
			.expect("augmenting path does not exist in residual graph!");

		gamma_value = cmp::min(gamma_value, next_link.weight);
	}

	gamma_value
}

fn augment_flow(flow: &mut HashMap<KeyLink, usize>, path: &Vec<usize>, value: usize) {
	// Check if path is actually a path
	if path.len() < 2 {
		panic!("Path has a length less than 2. That is not a path!");
	}

	// Another helper function
	let is_a_forward_arc = |source: usize, target: usize| -> bool {
		// Return none if specified arc is neither forwards nor backwards
		if flow.contains_key(&KeyLink((source, target))) {
			true
		} else if flow.contains_key(&KeyLink((target, source))) {
			false
		} else {
			panic!("augmenting path is neither a forward nor backward arc!");
		}
	};

	let mut add_value: Vec<(usize, usize)> = Vec::new();
	let mut sub_value: Vec<(usize, usize)> = Vec::new();

	// Augment
	let mut current = path[0];
	for next in path.iter().copied().skip(1) {
		if is_a_forward_arc(current, next) {
			add_value.push((current, next));
		} else {
			sub_value.push((next, current));
		}

		current = next;
	}

	for (source, target) in add_value.iter().copied() {
		let new_flow_value = flow.get(&KeyLink((source, target))).unwrap() + value;
		flow.insert(KeyLink((source, target)), new_flow_value);
	}

	for (source, target) in sub_value.iter().copied() {
		let new_flow_value = flow.get(&KeyLink((source, target))).unwrap() - value;
		flow.insert(KeyLink((source, target)), new_flow_value);
	}
}
