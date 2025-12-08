#![warn(rust_2018_idioms, unreachable_pub)]
#![forbid(elided_lifetimes_in_paths, unsafe_code)]

#[cfg(test)]
mod tests;

use algorithm::{
	abuse::{StateMachine, States},
	export_algorithm_to_wasm, Algorithm, ExampleGraph, Pseudocode, VisualisationState
};
use graph::{Graph, Link, Property};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use wasm_bindgen::prelude::*;

/// initialise panic handler
#[wasm_bindgen(start)]
pub fn init_panic_handler() {
	console_error_panic_hook::set_once();
}

type PrimConfiguration = (i64,);

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrimVisualisationState {
	pub graph: Graph<PrimConfiguration>,
	pub start_node: usize,
	pub tree_edges: HashSet<(usize, usize)>,
	pub tree_nodes: HashSet<usize>,
	pub outgoing_edges: HashSet<(usize, usize)>,
	pub best_outgoing: Option<(usize, usize)>,
	pub helptext: String
}

impl VisualisationState for PrimVisualisationState {
	type Configuration = PrimConfiguration;
	fn new(graph: Graph<PrimConfiguration>, start_node: usize) -> Self {
		Self {
			graph,
			start_node,
			tree_edges: HashSet::new(),
			tree_nodes: HashSet::new(),
			outgoing_edges: HashSet::new(),
			best_outgoing: None,
			helptext: "Initialized".to_string()
		}
	}
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Pseudocode)]
enum PrimPseudocode {
	/// Choose an arbitrary $v \in V(G)$ and set $T = (\{{v\}}, \emptyset)$
	Line1,

	/// While $V(T) \neq V(G)$
	Line2,

	///   Choose $e \in \delta(V(T))$ with minimum cost $c(e)$
	Line3,

	///   Set $T = T + e$
	Line4,

	/// Return $T$
	Line5
}

async fn prim(mut state: PrimVisualisationState, out: States<PrimPseudocode, PrimVisualisationState>) {
	state.tree_nodes.insert(state.start_node);

	// start node already chosen?
	state.helptext = "Initialize empty tree edge set T and choose initial vertex.".to_string();
	out.yield_state(PrimPseudocode::Line1, state.clone()).await;

	while {
		let n = state.graph.nodes.len();
		let t = state.tree_edges.len();
		state.helptext = "Iterate until T is a spanning tree.".to_string();
		out.yield_state(PrimPseudocode::Line2, state.clone()).await;
		t < n - 1
	} {
		// compute outgoing edges
		let outgoing = state
			.graph
			.links
			.iter()
			.filter(|l| (state.tree_nodes.contains(&l.source) || state.tree_nodes.contains(&l.target)))
			.filter(|l| (!state.tree_nodes.contains(&l.source) || !state.tree_nodes.contains(&l.target)))
			.cloned()
			.collect::<Vec<Link<i64>>>();
		state.outgoing_edges = outgoing
			.iter()
			.map(|l| (l.source, l.target))
			.collect::<HashSet<(usize, usize)>>();

		// compute best on cut (minimize for weight first, then for vertex label second)
		let best = outgoing.iter().min_by_key(|l| (l.weight, l.source, l.target)).unwrap();
		state.best_outgoing = Some((best.source, best.target));
		out.yield_state(PrimPseudocode::Line3, state.clone()).await;

		// reset outgoing edges
		state.outgoing_edges = HashSet::new();
		state.best_outgoing = None;

		// add best edge to tree
		state.tree_edges.insert((best.source, best.target));
		if !state.tree_nodes.contains(&best.source) {
			state.tree_nodes.insert(best.source);
		}
		if !state.tree_nodes.contains(&best.target) {
			state.tree_nodes.insert(best.target);
		}
		out.yield_state(PrimPseudocode::Line4, state.clone()).await;
	}

	state.helptext = "T is a spanning tree. Return it now.".to_string();
	out.yield_state(PrimPseudocode::Line5, state.clone()).await;
}

struct Prim;

impl Algorithm for Prim {
	type VisualisationState = PrimVisualisationState;
	type Pseudocode = PrimPseudocode;
	const REQUIRED_PROPERTIES: &'static [Property] = &[Property::Connected, Property::WeightedLinks];
	const INCOMPATIBLE_PROPERTIES: &'static [Property] = &[Property::Empty];
	/// `description` is a prop that shows up in the UI `GraphCard` to give users more details about the Graph.
	const EXAMPLES: &'static [ExampleGraph<'static>] = &[
		ExampleGraph {
			description: "Lecture notes Fig. 2.17",
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

	fn new(state: Self::VisualisationState) -> StateMachine<Self::Pseudocode, Self::VisualisationState> {
		StateMachine::new(|out| prim(state, out))
	}
}

export_algorithm_to_wasm!(Prim);
