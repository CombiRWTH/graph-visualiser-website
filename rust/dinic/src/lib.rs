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
	collections::{HashMap, HashSet, VecDeque},
	option::Option
};
use wasm_bindgen::prelude::*;
/// initialise panic handler
#[wasm_bindgen(start)]
pub fn init_panic_handler() {
	console_error_panic_hook::set_once();
}

// Syntactically no change, semantically consider capacities instead of weights
type DinicConfiguration = (usize,);

#[serde_as]
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DinicVisualisationState {
	pub graph: Graph<DinicConfiguration>,
	pub start_node: usize,
	pub source_node: usize,
	pub target_node: usize,
	#[serde_as(as = "HashMap<DisplayFromStr, _>")]
	pub flow: HashMap<KeyLink, usize>, // Assign an edge a flow value
	#[serde_as(as = "HashMap<DisplayFromStr, _>")]
	pub blocking_flow: HashMap<KeyLink, usize>,
	pub residual_graph: Graph<DinicConfiguration>,
	pub gamma_value: usize,
	pub helptext: String
}

impl VisualisationState for DinicVisualisationState {
	type Configuration = DinicConfiguration;
	fn new(graph: Graph<DinicConfiguration>, start_node: usize) -> Self {
		// Initialize flow and residual graph
		let mut flow: HashMap<KeyLink, usize> = HashMap::new();
		let mut blocking_flow: HashMap<KeyLink, usize> = HashMap::new();
		let mut residual_graph = Graph::new();

		for node in graph.nodes.iter() {
			residual_graph.add_node(node.id);
		}

		for link in graph.links.iter() {
			flow.insert(KeyLink((link.source, link.target)), 0);
			blocking_flow.insert(KeyLink((link.source, link.target)), 0);
			residual_graph.add_edge(link.source, link.target, link.weight);
		}

		let target_node = graph.nodes.len() - 1; // empty graphs do not occur

		DinicVisualisationState {
			graph,
			start_node,
			source_node: 0,
			target_node,
			flow,
			blocking_flow,
			residual_graph,
			gamma_value: 0,
			helptext: "Initialized".to_string()
		}
	}
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Pseudocode)]
enum DinicPseudocode {
	/// Set $f(a) := 0$ for all $a \in A(G)$
	Line1,

	/// While there is an $f$-augmenting $(s,t)$-path do
	Line2,

	///   Construct level graph $G_f^L$
	Line3,

	///   Construct blocking flow $f_R$ in $G_f^L$
	Line4,

	///   Augment $f$ along $f_R$
	Line5,

	/// Return $f$
	Line6
}

async fn dinic(mut state: DinicVisualisationState, out: States<DinicPseudocode, DinicVisualisationState>) {
	// Initially the flow is already 0 everywhere so we do not have to anything right now
	state.helptext = "Set flow to 0".to_string();
	out.yield_state(DinicPseudocode::Line1, state.clone()).await;

	// Check if there is an augmenting path (we do the check and determination of it simultaneously)
	state.helptext = "Check for an augmenting path".to_string();
	out.yield_state(DinicPseudocode::Line2, state.clone()).await;

	// Compute Level graph
	state.residual_graph = get_level_graph(&state.graph, &state.flow, state.source_node, state.target_node);

	while let Some(_) = get_augmenting_path(
		&get_residual_graph(&state.graph, &state.flow),
		state.source_node,
		state.target_node
	) {
		// Determine augmented path (which we already did)
		state.helptext = "The level graph is a subgraph of the residual graph that only includes edges lying on the shortest (s,t)-paths according to the number of arcs.".to_string();
		state.residual_graph = get_level_graph(&state.graph, &state.flow, state.source_node, state.target_node);
		out.yield_state(DinicPseudocode::Line3, state.clone()).await;

		// get blocking flow
		let mut temp_level_graph: Graph<DinicConfiguration> =
			get_level_graph(&state.graph, &state.flow, state.source_node, state.target_node);
		while let Some(augmenting_flow) = get_augmenting_path(&temp_level_graph, state.source_node, state.target_node) {
			let gamma = get_gamma_value(&temp_level_graph, &augmenting_flow);
			augment_flow(&mut state.blocking_flow, &augmenting_flow, gamma);
			temp_level_graph = get_level_graph(
				&temp_level_graph,
				&state.blocking_flow,
				state.source_node,
				state.target_node
			);
		}
		state.helptext =
			"A blocking flow is an (s, t)-flow f which saturates an arc on each path between s and t".to_string();

		out.yield_state(DinicPseudocode::Line4, state.clone()).await;
		augment_flow_with_flow(&mut state.flow, &state.blocking_flow);

		// Augment flow
		state.helptext = "Augment".to_string();
		out.yield_state(DinicPseudocode::Line5, state.clone()).await;

		// Reset blocking flow
		for value in state.blocking_flow.values_mut() {
			*value = 0;
		}
		// Check if there is an augmenting path

		state.helptext = "Check for an augmented path".to_string();
		out.yield_state(DinicPseudocode::Line2, state.clone()).await;
	}

	// Return
	out.yield_state(DinicPseudocode::Line6, state.clone()).await;
}

struct Dinic;

impl Algorithm for Dinic {
	type VisualisationState = DinicVisualisationState;
	type Pseudocode = DinicPseudocode;

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
		StateMachine::new(|out| dinic(state, out))
	}
}

export_algorithm_to_wasm!(Dinic);
fn get_residual_graph(graph: &Graph<DinicConfiguration>, flow: &HashMap<KeyLink, usize>) -> Graph<DinicConfiguration> {
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

fn get_level_graph(
	graph: &Graph<DinicConfiguration>,
	flow: &HashMap<KeyLink, usize>,
	source: usize,
	target: usize
) -> Graph<DinicConfiguration> {
	let mut residual_graph: Graph<DinicConfiguration> = Graph::new();

	// Step 1: Build residual capacities
	for link in &graph.links {
		let Some(flow_value) = flow.get(&KeyLink((link.source, link.target))) else {
			panic!("No flow value for the link ({}, {})", link.source, link.target);
		};

		let residual_capacity = link.weight.saturating_sub(*flow_value);
		if residual_capacity > 0 {
			residual_graph.add_edge(link.source, link.target, residual_capacity);
		}
		if *flow_value > 0 {
			residual_graph.add_edge(link.target, link.source, *flow_value);
		}
	}

	// Step 2: BFS to compute levels
	let mut level = vec![None; target + 1];
	let mut queue = VecDeque::new();

	level[source] = Some(0);
	queue.push_back(source);

	while let Some(u) = queue.pop_front() {
		let current_level = level[u].unwrap();
		for edge in &residual_graph.links {
			if edge.source == u && edge.weight > 0 && level[edge.target].is_none() {
				level[edge.target] = Some(current_level + 1);
				queue.push_back(edge.target);
			}
		}
	}

	// Step 3: Build level graph
	let mut level_graph: Graph<DinicConfiguration> = Graph::new();

	for edge in residual_graph.links.iter() {
		if let (Some(lu), Some(lv)) = (level[edge.source], level[edge.target]) {
			if lv == lu + 1 && edge.weight > 0 {
				level_graph.add_edge(edge.source, edge.target, edge.weight);
			}
		}
	}

	// Step 4: Reverse BFS from target to find vertices that can reach target
	let mut can_reach_target = HashSet::new();
	let mut queue = VecDeque::new();

	can_reach_target.insert(target);
	queue.push_back(target);

	while let Some(v) = queue.pop_front() {
		// Traverse incoming edges instead of outgoing
		for edge in &level_graph.links {
			if edge.target == v && !can_reach_target.contains(&edge.source) {
				can_reach_target.insert(edge.source);
				queue.push_back(edge.source);
			}
		}
	}

	// Step 5: Keep only edges whose both endpoints can reach target
	let mut pruned_graph = Graph::new();
	for edge in level_graph.links.iter() {
		if can_reach_target.contains(&edge.source) && can_reach_target.contains(&edge.target) {
			pruned_graph.add_edge(edge.source, edge.target, edge.weight);
		}
	}

	pruned_graph
}

fn get_augmenting_path(residual_graph: &Graph<DinicConfiguration>, source: usize, target: usize) -> Option<Vec<usize>> {
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

fn get_gamma_value(residual_graph: &Graph<DinicConfiguration>, augmented_path: &Vec<usize>) -> usize {
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

fn augment_flow_with_flow(flow: &mut HashMap<KeyLink, usize>, augmenting_flow: &HashMap<KeyLink, usize>) {
	for (link, add_value) in augmenting_flow {
		*flow.entry(link.clone()).or_insert(0) += add_value;
	}
}
