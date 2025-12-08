#![warn(rust_2018_idioms, unreachable_pub)]
#![forbid(elided_lifetimes_in_paths, unsafe_code)]

mod infinite_f64;

#[cfg(test)]
mod tests;

use algorithm::{
	abuse::{StateMachine, States},
	console_log, export_algorithm_to_wasm, modify_vis_state, Algorithm, ExampleGraph, Pseudocode, VisualisationState
};
use graph::{Graph, Property};
use infinite_f64::InfiniteF64;
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DisplayFromStr};
use std::collections::{BTreeMap, HashSet, VecDeque};
use wasm_bindgen::prelude::*;

/// initialise panic handler
#[wasm_bindgen(start)]
pub fn init_panic_handler() {
	console_error_panic_hook::set_once();
}

type DijkstraConfiguration = (i64,);

#[serde_as]
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DijkstraVisualisationState {
	pub graph: Graph<DijkstraConfiguration>,
	#[serde_as(as = "BTreeMap<DisplayFromStr, InfiniteF64>")]
	pub distance: BTreeMap<usize, f64>,
	#[serde_as(as = "BTreeMap<DisplayFromStr, _>")]
	pub predecessor: BTreeMap<usize, usize>, //state=1 node not yet scanned, state=2 node active, state=3 node scanned
	pub start_node: usize,
	pub neighbors: VecDeque<usize>,
	pub active_node: Option<usize>,
	pub active_edges: HashSet<(usize, usize)>,
	pub used_edges: HashSet<(usize, usize)>,
	pub visited_nodes: HashSet<usize>,
	pub shortest_path: Option<HashSet<(usize, usize)>>,
	pub helptext: String
}

impl VisualisationState for DijkstraVisualisationState {
	type Configuration = DijkstraConfiguration;

	fn new(graph: Graph<DijkstraConfiguration>, start_node: usize) -> Self {
		Self {
			graph,
			distance: BTreeMap::new(),
			predecessor: BTreeMap::new(),
			start_node,
			neighbors: VecDeque::new(),
			active_node: None,
			active_edges: HashSet::new(),
			used_edges: HashSet::new(),
			visited_nodes: HashSet::new(),
			shortest_path: None,
			helptext: "Initialized".to_string()
		}
	}
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Pseudocode)]
enum DijkstraPseudocode {
	/// Set $dist(v) = \infty$ for every $v \in V$
	Line1,

	/// Set $dist({s}) = 0$
	Line2 { s: usize },

	/// Set $pred(v) = NULL$ for every $v \in V$ and $pred({s}) = {s}$
	Line3 { s: usize },

	/// Set the set of not yet scanned vertex $V'$ to $V$
	Line4,

	/// While $v \in V'$ with $dist(v) < \infty$ do
	Line5,

	///   Choose ${v'} \in V'$ with minimum $dist({v'})$, i.e., $dist({v'}) \leq dist(v)$ for all $v \in V'$
	Line6 {
		#[pseudocode(rename = "v'")]
		v_prime: usize
	},

	///   Forall $w' \in V$ with $({v'}, w') \in A$ do
	Line7 {
		#[pseudocode(rename = "v'")]
		v_prime: usize
	},

	///     If $dist({v'}) + c(({v'}, {w'})) < dist({w'})$ do
	Line8 {
		#[pseudocode(rename = "v'")]
		v_prime: usize,
		#[pseudocode(rename = "w'")]
		w_prime: usize
	},

	///       Set $dist({w'}) = dist({v'}) + c(({v'}, {w'}))$
	Line9 {
		#[pseudocode(rename = "v'")]
		v_prime: usize,
		#[pseudocode(rename = "w'")]
		w_prime: usize
	},

	///       Set $pred(w') = v'$
	Line10 {
		#[pseudocode(rename = "v'")]
		v_prime: usize,
		#[pseudocode(rename = "w'")]
		w_prime: usize
	},

	///   Delete ${v'}$ from $V$
	Line11 {
		#[pseudocode(rename = "v'")]
		v_prime: usize
	}
}

async fn dijkstra(mut state: DijkstraVisualisationState, out: States<DijkstraPseudocode, DijkstraVisualisationState>) {
	// sort the links, and nodes, so that they are considered in lexicographical order
	state.graph.links.sort_by_key(|l| (l.source, l.target));
	state.graph.nodes.sort_by_key(|n| n.id);

	for node in state.graph.nodes.iter() {
		state.distance.insert(node.id, f64::INFINITY);
	}
	state.helptext = "Set the distance for every node to Infinity.".to_string();

	out.yield_state(DijkstraPseudocode::Line1, state.clone()).await;

	state.distance.insert(state.start_node, 0.0);
	state.helptext = "Set the distance of the start node to 0.".to_string();

	out.yield_state(DijkstraPseudocode::Line2 { s: state.start_node }, state.clone())
		.await;

	state.predecessor.insert(state.start_node, state.start_node);
	state.helptext =
		"Set the predecessor of all nodes to unknown (NULL) and the predecessor of the start node to the start node."
			.to_string();

	out.yield_state(DijkstraPseudocode::Line3 { s: state.start_node }, state.clone())
		.await;

	state.visited_nodes = HashSet::new();
	state.helptext = "Mark all nodes as not yet scanned.".to_string();

	out.yield_state(DijkstraPseudocode::Line4, state.clone()).await;

	while state
		.graph
		.nodes
		.iter()
		.any(|x| !state.visited_nodes.contains(&x.id) && state.distance[&x.id] != f64::INFINITY)
	{
		state.helptext =
			"Check if there is a node marked as not yet scanned with distance smaller than infinity. There is such a node so the algorithm continues.".to_string();
		out.yield_state(DijkstraPseudocode::Line5, state.clone()).await;

		let (node_id, node_idx) = state
            .graph
            .nodes
            .iter()
            .enumerate()
            .filter(|(_, x)| {
                !state.visited_nodes.contains(&x.id) && state.distance[&x.id] != f64::INFINITY
            })
            // sort by distance first, and then by node id
            .min_by(|(_, x), (_, y)| {
                state.distance[&x.id]
                    .total_cmp(&state.distance[&y.id])
                    .then_with(|| x.id.cmp(&y.id))
            })
            .map(|(idx, x)| (x.id, idx))
            .unwrap();
		state.active_node = Some(node_idx);
		state.helptext = format!(
			"Choose the node with the smallest distance which is marked as not yet scanned (blue). In this step this node is {} with distance {}.",
			state.graph.nodes[node_idx].name,
			state.distance[&node_id]
		);

		state.neighbors = state
			.graph
			.links
			.iter_mut()
			.filter(move |x| x.source == node_id)
			.filter(|value| {
				state
					.graph
					.nodes
					.iter()
					.any(|x| x.id == value.target && !state.visited_nodes.contains(&x.id))
			})
			.map(|value| {
				state.active_edges.insert((value.source, value.target));
				value.target
			})
			.collect();

		out.yield_state(DijkstraPseudocode::Line6 { v_prime: node_id }, state.clone())
			.await;

		while let Some(neighbor) = state.neighbors.pop_front() {
			state.helptext =
				"Iterate over all neighbours of the active node which are not yet scanned. Since there are still nodes we continue".to_string();
			out.yield_state(DijkstraPseudocode::Line7 { v_prime: node_id }, state.clone())
				.await;

			let link_weight = state
				.graph
				.links
				.iter()
				.find(|x| x.source == node_id && x.target == neighbor)
				.unwrap()
				.weight;
			let new_dist = state.distance[&node_id] + (link_weight as f64);
			let line = if new_dist <= state.distance[&neighbor] {
				state.helptext = format!(
					"Check if the distance of the current active node {} + the weight of the link between the current neighbor {} is smaller than the distance the neighbor had before {}. Since the new distance would be smaller we will update the distance and the predecessor in the next steps.",
					state.distance[&node_id],
					link_weight,
					state.distance[&neighbor]
				);
				out.yield_state(
					DijkstraPseudocode::Line8 {
						v_prime: node_id,
						w_prime: neighbor
					},
					state.clone()
				)
				.await;

				state.helptext = format!(
					"Update the distance for node {} to {}+{link_weight}={new_dist}.",
					state.graph.nodes[neighbor].name, state.distance[&node_id]
				);
				state.distance.insert(neighbor, new_dist);

				out.yield_state(
					DijkstraPseudocode::Line9 {
						v_prime: node_id,
						w_prime: neighbor
					},
					state.clone()
				)
				.await;

				state.predecessor.insert(neighbor, node_id);
				state.helptext = format!(
					"Update the predecessor for node {} to {}.",
					state.graph.nodes[neighbor].name, state.graph.nodes[node_id].name
				);

				DijkstraPseudocode::Line10 {
					v_prime: node_id,
					w_prime: neighbor
				}
			} else {
				state.helptext = format!(
					"Check if the distance of the current active node {} + the weight of the link between the current neighbor {} is smaller than the distance the neighbor had before {}. Since the distance the neighbor had before is not bigger than the new value, we continue with the next neighbor.",
					state.distance[&node_id],
					link_weight,
					state.distance[&neighbor]
				);
				DijkstraPseudocode::Line8 {
					v_prime: node_id,
					w_prime: neighbor
				}
			};

			state.used_edges.insert((node_id, neighbor));
			state.active_edges.retain(|e| *e != (node_id, neighbor));
			out.yield_state(line, state.clone()).await;
		}

		state.helptext =
			"Iterate over all neighbours of the active node (red node) which are not yet scanned (blue). At this point we have visited all neighbors or there are no neighbors of the current node, so we can continue with the next node.".to_string();
		out.yield_state(DijkstraPseudocode::Line7 { v_prime: node_id }, state.clone())
			.await;

		state.visited_nodes.insert(node_idx);
		state.active_edges = HashSet::new();
		state.active_node = None;
		state.helptext = format!(
			"Finished the update of the neighbors of node {} so we can mark this node as scanned (green). The weight of this node can never again become better.",
			state.graph.nodes[node_idx].name
		);
		out.yield_state(DijkstraPseudocode::Line11 { v_prime: node_id }, state.clone())
			.await;
	}

	state.helptext =
		"Check if there is a node marked as not yet scanned with distance smaller than infinity. There is no such node so the algorithm stops.".to_string();
	out.yield_state(DijkstraPseudocode::Line5, state.clone()).await;
}

struct Dijkstra;

impl Algorithm for Dijkstra {
	type VisualisationState = DijkstraVisualisationState;
	type Pseudocode = DijkstraPseudocode;
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
		// ExampleGraph {
		// 	description: "Lecture notes Fig. 4.1",
		// 	adj: &[
		// 		&[0, 5, 0, 0, 0, 0, 0, 0],
		// 		&[5, 0, 0, 0, 0, 0, 0, 0],
		// 		&[0, 3, 0, 0, 0, 0, 0, 0],
		// 		&[0, 6, 0, 0, 5, 11, 0, 0],
		// 		&[0, 0, 2, 0, 0, 0, 0, 0],
		// 		&[0, 0, 0, 0, 6, 0, 0, 0],
		// 		&[0, 0, 0, 10, 0, 7, 0, 0],
		// 		&[3, 0, 0, 0, 0, 0, 8, 0]
		// 	]
		// },
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
			// Image: https://upload.wikimedia.org/wikipedia/commons/5/57/Dijkstra_Animation.gif
			// ~https://de.wikipedia.org/wiki/Dijkstra-Algorithmus
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
			// ~https://www.freecodecamp.org/news/dijkstras-shortest-path-algorithm-visual-introduction/
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
		StateMachine::new(|out| dijkstra(state, out))
	}
}

export_algorithm_to_wasm!(Dijkstra);

/// mark the current shortest path
#[wasm_bindgen(js_name = markShortestPath)]
pub fn mark_shortest_path(state: JsValue, node_id: usize) -> JsValue {
	console_log!("mark_shortest_path({state:?}, {node_id})");
	modify_vis_state::<Dijkstra, _>(state, |current_state| {
		unmark_all_shortest_paths(current_state);

		let mut id = node_id;
		let mut shortest_path: HashSet<(usize, usize)> = HashSet::new();
		if current_state.predecessor.contains_key(&id) && current_state.predecessor.contains_key(&id) {
			while (current_state.predecessor[&id] as usize) != id {
				let link = current_state
					.graph
					.links
					.iter_mut()
					.find(|x| x.source == (current_state.predecessor[&id] as usize) && x.target == id)
					.unwrap();
				shortest_path.insert((link.source, link.target));
				id = current_state.predecessor[&id] as usize;
			}
		}
		current_state.shortest_path = Some(shortest_path);
	})
}

/// unmark the current shortest path
#[wasm_bindgen(js_name = unmarkShortestPath)]
pub fn unmark_shortest_path(state: JsValue) -> JsValue {
	modify_vis_state::<Dijkstra, _>(state, unmark_all_shortest_paths)
}

/// unmark all shortest paths
fn unmark_all_shortest_paths(state: &mut DijkstraVisualisationState) {
	state.shortest_path = None;
}
