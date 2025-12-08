#![warn(rust_2018_idioms, unreachable_pub)]
#![forbid(elided_lifetimes_in_paths, unsafe_code)]

mod infinite_f64;

#[cfg(test)]
mod tests;

use algorithm::{
	abuse::{StateMachine, States},
	export_algorithm_to_wasm, Algorithm, ExampleGraph, Pseudocode, VisualisationState
};
use graph::{Graph, Property};
use infinite_f64::InfiniteF64;
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DisplayFromStr};
use std::collections::{BTreeMap, HashSet};
use wasm_bindgen::prelude::*;

/// initialise panic handler
#[wasm_bindgen(start)]
pub fn init_panic_handler() {
	console_error_panic_hook::set_once();
}

type MbfConfiguration = (i64,);

#[serde_as]
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MbfVisualisationState {
	pub graph: Graph<MbfConfiguration>,
	#[serde_as(as = "BTreeMap<DisplayFromStr, InfiniteF64>")]
	pub distance: BTreeMap<usize, f64>,
	#[serde_as(as = "BTreeMap<DisplayFromStr, _>")]
	pub predecessor: BTreeMap<usize, usize>, //state=1 node not yet scanned, state=2 node active, state=3 node scanned
	pub start_node: usize,
	pub active_edge: Option<(usize, usize)>,
	pub used_edges: HashSet<(usize, usize)>,
	pub shortest_path_tree: HashSet<(usize, usize)>,
	pub helptext: String
}

impl VisualisationState for MbfVisualisationState {
	type Configuration = MbfConfiguration;

	fn new(graph: Graph<MbfConfiguration>, start_node: usize) -> Self {
		Self {
			graph,
			distance: BTreeMap::new(),
			predecessor: BTreeMap::new(),
			start_node,
			active_edge: None,
			used_edges: HashSet::new(),
			shortest_path_tree: HashSet::new(),
			helptext: "Initialized".to_string()
		}
	}
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Pseudocode)]
enum MbfPseudocode {
	/// Set $dist(v) = \infty$ for every $v \in V$
	Line1,

	/// Set $dist({s}) = 0$
	Line2 { s: usize },

	/// Set $pred(v) = NULL$ for every $v \in V$ and $pred({s}) = {s}$
	Line3 { s: usize },

	/// For $i = 1,\dots,n$ do
	Line4,

	///   Forall $a = (v,w) \in A$ do
	Line5,

	///     If $dist(v) + c(a) < dist(w)$ do
	Line6,

	///       Set $dist(w) = dist(v) + c(a)$
	Line7,

	///       Set $pred(w) = v$
	Line8,

	/// Create the graph $T = (V, A' )$ with $A' = \{{(u, v) \in A\mid u = pred(v), v \in V \setminus \{{s\}}\}}$
	Line9,

	///  If $T$ is a tree then $T$ is a shortest path tree. Otherwise $T$ contains a negative cycle,
	Line10
}

async fn mbf(mut state: MbfVisualisationState, out: States<MbfPseudocode, MbfVisualisationState>) {
	// sort the links, and nodes, so that they are considered in lexicographical order
	state.graph.links.sort_by_key(|l| (l.source, l.target));
	state.graph.nodes.sort_by_key(|n| n.id);

	for node in state.graph.nodes.iter() {
		state.distance.insert(node.id, f64::INFINITY);
	}
	state.helptext = "Set the distance for every node to Infinity.".to_string();

	out.yield_state(MbfPseudocode::Line1, state.clone()).await;

	state.distance.insert(state.start_node, 0.0);
	state.helptext = "Set the distance of the start node to 0.".to_string();

	out.yield_state(MbfPseudocode::Line2 { s: state.start_node }, state.clone())
		.await;

	state.predecessor.insert(state.start_node, state.start_node);
	state.helptext =
		"Set the predecessor of all nodes to unknown (NULL) and the predecessor of the start node to the start node."
			.to_string();

	out.yield_state(MbfPseudocode::Line3 { s: state.start_node }, state.clone())
		.await;

	for _ in 1 ..= state.graph.nodes.len() {
		state.helptext = "Repeat the following n-times".to_string();

		out.yield_state(MbfPseudocode::Line4, state.clone()).await;

		for arc in state.graph.links.iter() {
			let source_name: &str = if state.graph.nodes[arc.source].id == state.start_node {
				"start"
			} else {
				&state.graph.nodes[arc.source].name
			};

			let target_name: &str = if state.graph.nodes[arc.target].id == state.start_node {
				"start"
			} else {
				&state.graph.nodes[arc.target].name
			};
			state.helptext = format!("Go through all arcs. Choosing arc ({source_name},{target_name}).",);
			state.active_edge = Some((arc.source, arc.target));
			out.yield_state(MbfPseudocode::Line5, state.clone()).await;
			let new_dist = state.distance[&arc.source] + (arc.weight as f64);

			if new_dist < state.distance[&arc.target] {
				state.helptext = format!(
					"Check if the distance of the source node ({}) + the weight of the arc ({}) is smaller than the distance to the target node ({}).  Since it is, update the distance and the predecessor in the next steps.",
					state.distance[&arc.source],
					(arc.weight as f64),
					state.distance[&arc.target]
				);
				out.yield_state(MbfPseudocode::Line6, state.clone()).await;

				state.helptext = format!(
					"Update the distance for node {target_name} to {}+{}={new_dist}.",
					state.graph.nodes[arc.target].name, state.distance[&arc.source],
				);
				state.distance.insert(arc.target, new_dist);

				out.yield_state(MbfPseudocode::Line7, state.clone()).await;

				state.predecessor.insert(arc.target, arc.source);
				state.helptext = format!("Update the predecessor for node {target_name} to {source_name}.",);
				out.yield_state(MbfPseudocode::Line8, state.clone()).await;
			} else {
				state.helptext = format!(
					"Check if the distance of the source node {} + the weight of the arc {} is smaller than the distance to the target node {}. It isn't, so this arc won't give us a \"shortcut\".",
					state.distance[&arc.source],
					(arc.weight as f64),
					state.distance[&arc.target]
				);
				out.yield_state(MbfPseudocode::Line6, state.clone()).await;
			};

			state.used_edges.insert((arc.source, arc.target));
		}
		state.used_edges = HashSet::new();
		state.active_edge = None;
	}
	state.helptext = format!("The shortest path tree, is the set of all pairs of vertices and their predecessor.",);
	state.shortest_path_tree = state
		.graph
		.links
		.iter()
		.filter(|edge| state.predecessor.get(&(edge.target as usize)) == Some(&(edge.source as usize)))
		.map(|edge| (edge.source as usize, edge.target as usize))
		.collect::<HashSet<_>>();

	out.yield_state(MbfPseudocode::Line9, state.clone()).await;

	state.helptext = format!("Is T a Tree?",);

	out.yield_state(MbfPseudocode::Line10, state.clone()).await;
}

struct Mbf;

impl Algorithm for Mbf {
	type VisualisationState = MbfVisualisationState;
	type Pseudocode = MbfPseudocode;
	// `description` is a prop that shows up in the UI `GraphCard` to give users more details about the Graph.
	const EXAMPLES: &'static [ExampleGraph<'static>] = &[
		ExampleGraph {
			description: "Lecture notes Fig. 4.14",
			adj: &[
				&[0, 1, 5, 0, 0, 0],
				&[0, 0, 2, 10, 0, 0],
				&[0, 0, 0, 0, 3, 0],
				&[0, 0, 0, 0, 0, 1],
				&[0, 0, 0, 2, 0, 7],
				&[0, 0, 0, 0, 0, 0]
			]
		},
		ExampleGraph {
			description: "Lecture notes Fig. 4.19",
			adj: &[&[0, 3, 1, 0], &[0, 0, -5, 2], &[0, 0, 0, 1], &[0, 0, 0, 0]]
		},
		ExampleGraph {
			description: "Example with negative cycle",
			adj: &[
				&[0, 1, 1, 0, 0, 0],
				&[0, 0, 0, 0, 1, 0],
				&[0, 0, 0, 0, 0, 1],
				&[0, -3, 0, 0, 0, 5],
				&[0, 0, 0, 1, 0, 0],
				&[0, 0, 0, 0, 0, 0]
			]
		},
		ExampleGraph {
			description: "Generic example graph",
			adj: &[
				&[0, 15, 0, 0, 0, 10],
				&[0, 0, 10, 0, 0, 0],
				&[0, 0, 0, 0, 0, 0],
				&[0, 0, 5, 0, 0, 0],
				&[0, 0, 2, 1, 0, 0],
				&[1, 0, 0, 15, 12, 0]
			]
		},
		ExampleGraph {
			description: "Another generic example graph with loops",
			adj: &[
				&[2, 2, 2, 2, 2],
				&[8, 0, 1, 3, 5],
				&[0, 0, 6, 1, 2],
				&[8, 0, 1, 0, 1],
				&[0, 0, 9, 0, 0]
			]
		},
		ExampleGraph {
			description: "To understand when newly discovered nodes are used and when they are not",
			adj: &[
				&[0, 2, 6, 11, 23, 9, 8, 7],
				&[0, 0, 2, 0, 0, 0, 0, 0],
				&[0, 0, 0, 5, 0, 0, 0, 0],
				&[0, 0, 0, 0, 0, 0, 0, 0],
				&[0, 0, 0, 0, 0, 0, 0, 0],
				&[0, 0, 0, 0, 0, 0, 1, 0],
				&[0, 0, 0, 0, 0, 0, 0, 5],
				&[0, 0, 0, 0, 0, 0, 0, 0]
			]
		},
		ExampleGraph {
			description: "Planar graph with edges in both directions",
			adj: &[
				&[0, 3, 0, 0, 10],
				&[0, 0, 2, 8, 4],
				&[0, 0, 0, 5, 0],
				&[0, 0, 7, 0, 0],
				&[0, 1, 0, 2, 0]
			]
		},
		ExampleGraph {
			description: "Line to illustrate the worst case input",
			adj: &[
				&[0, 1, 0, 0, 0],
				&[0, 0, 1, 0, 0],
				&[0, 0, 0, 1, 0],
				&[0, 0, 0, 0, 1],
				&[0, 0, 0, 0, 0]
			]
		},
		ExampleGraph {
			// Image: https://upload.wikimedia.org/wikipedia/commons/5/57/Mbf_Animation.gif
			// ~https://de.wikipedia.org/wiki/Mbf-Algorithmus
			description: "Undirected graph",
			adj: &[
				&[0, 7, 9, 0, 0, 14],
				&[7, 0, 10, 15, 0, 0],
				&[9, 10, 0, 11, 0, 2],
				&[0, 15, 11, 0, 6, 0],
				&[0, 0, 0, 6, 0, 9],
				&[14, 0, 2, 0, 9, 0]
			]
		},
		ExampleGraph {
			description: "",
			// Image: https://www.freecodecamp.org/news/content/images/2020/06/image-83.png
			// ~https://www.freecodecamp.org/news/mbfs-shortest-path-algorithm-visual-introduction/
			adj: &[
				&[0, 2, 6, 0, 0, 0, 0],
				&[2, 0, 0, 5, 0, 0, 0],
				&[6, 0, 0, 8, 0, 0, 0],
				&[0, 0, 0, 0, 10, 15, 0],
				&[0, 0, 0, 10, 0, 6, 2],
				&[0, 0, 0, 15, 6, 0, 6],
				&[0, 0, 0, 0, 2, 6, 0]
			]
		},
		ExampleGraph {
			// From kickoff slides
			description: "",
			adj: &[
				&[0, 4, 3, 0, 0, 0, 0],
				&[0, 0, 0, 2, 8, 0, 0],
				&[0, 0, 0, 4, 0, 4, 0],
				&[0, 0, 0, 0, 2, 3, 0],
				&[0, 0, 0, 0, 0, 0, 1],
				&[0, 0, 0, 0, 0, 0, 5],
				&[0, 0, 0, 0, 0, 0, 0]
			]
		}
	];

	const REQUIRED_PROPERTIES: &'static [Property] = &[Property::Connected, Property::NonNegativeWeightedLinks];

	const INCOMPATIBLE_PROPERTIES: &'static [Property] = &[Property::Empty];

	fn new(state: Self::VisualisationState) -> StateMachine<Self::Pseudocode, Self::VisualisationState> {
		StateMachine::new(|out| mbf(state, out))
	}
}

export_algorithm_to_wasm!(Mbf);
