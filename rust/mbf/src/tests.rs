use std::collections::HashSet;

use crate::{mbf, MbfConfiguration, MbfPseudocode::*, MbfVisualisationState};
use algorithm::{abuse::StateMachine, VisualisationState as _};
use graph::{Graph, Link, Node};

macro_rules! test_run {
	(
		$sm:ident => [
			$(
				$line:ident => | $state:ident | { $($body:tt)* }
			),*
		]
	) => {
		let mut sm = $sm;
		$({
			let Some((line, $state)) = sm.poll() else {
				panic!("Test run ended prematurely");
			};
			assert!(matches!(line, $line {..}));
			$($body)*
		})*
		if let Some((line, state)) = sm.poll() {
			panic!("Expected test run to end, but got line={line:?}, state={state:?}");
		}
	};
}

fn check_line1(state: MbfVisualisationState) {
	// for each node exists a distance
	for node in state.graph.nodes.iter() {
		assert!(state.distance.contains_key(&node.id));
	}
	// each registered distance has the value infinity
	for distance in state.distance.iter() {
		assert!(distance.0 >= &0); // target node index must be a value greater zero
		assert_eq!(distance.1, &f64::INFINITY); // distance must be infinity
	}
}

fn check_line2(state: MbfVisualisationState) {
	assert_eq!(state.distance[&state.start_node], 0.0);
}

fn check_line3(state: MbfVisualisationState) {
	state.predecessor.iter().for_each(|pred| {
		// we expect that only the predecessors for the start node are set,
		// and that it is set to the start node
		assert_eq!(*pred.0, state.start_node);
		assert_eq!(*pred.1, state.start_node);
	});
}

fn check_line4(state: MbfVisualisationState) {
	assert!(state.shortest_path_tree.is_empty());
	assert!(state.used_edges.is_empty());
}

fn check_line5(state: MbfVisualisationState, edge: (usize, usize)) {
	assert_eq!(state.active_edge, Some(edge))
}

fn get_node_idx(graph: &Graph<MbfConfiguration>, node_id: usize) -> Option<usize> {
	graph.nodes.iter().position(|n| n.id == node_id)
}

fn check_line7(state: MbfVisualisationState, node_id: usize, new_distance: f64) {
	assert_eq!(
		state.distance[&get_node_idx(&state.graph, node_id).unwrap()],
		new_distance
	);
}

fn check_line10(state: MbfVisualisationState, tree: HashSet<(usize, usize)>) {
	assert_eq!(state.shortest_path_tree, tree)
}

#[test]
fn test_unconnected_graph() {
	let nodes = vec![Node::new(0, String::from("A")), Node::new(1, String::from("B"))];
	let links = Vec::new();
	let state = MbfVisualisationState::new(Graph::from_nodes_and_links(nodes, links), 0);
	let sm = StateMachine::new(|out| mbf(state, out));
	test_run!(sm => [
		Line1 => |state| { check_line1(state) },
		Line2 => |state| { check_line2(state) },
		Line3 => |state| { check_line3(state) },

		Line4 => |state| { check_line4(state) },


		Line4 => |state| { check_line4(state) },


		Line9 => |_state| {},
		Line10 => |state| {check_line10(state, HashSet::new());}
		// done
	]);
}

#[test]
fn test_simple_graph() {
	let nodes = vec![
		Node::new(0, String::from("A")),
		Node::new(1, String::from("B")),
		Node::new(2, String::from("C")),
	];
	let links = vec![Link::new(0, 1, 1), Link::new(1, 2, 1), Link::new(0, 2, 5)];
	let state = MbfVisualisationState::new(Graph::from_nodes_and_links(nodes, links), 0);
	let sm = StateMachine::new(|out| mbf(state, out));
	let tree: HashSet<(usize, usize)> = HashSet::from([(0, 1), (1, 2)]);

	test_run!(sm => [
		Line1 => |state| { check_line1(state) },
		Line2 => |state| { check_line2(state) },
		Line3 => |state| { check_line3(state) },
		// iteration 1
		Line4 => |state| { check_line4(state) },
		// arc (0,1)
		Line5 => |state| {check_line5(state, (0,1))},
		Line6 => |_state| {},
		Line7 => |state| { check_line7(state, 1, 1.0) },
		Line8 => |_state| {},
		// arc (0,2)
		Line5 => |state| {check_line5(state, (0,2))},
		Line6 => |_state| {},
		Line7 => |state| { check_line7(state, 2, 5.0) },
		Line8 => |_state| {},
		// arc (1,2)
		Line5 => |state| {check_line5(state, (1,2))},
		Line6 => |_state| {},
		Line7 => |state| { check_line7(state, 2, 2.0) },
		Line8 => |_state| {},

		// iteration 2
		Line4 => |state| { check_line4(state) },
		// arc (0,1)
		Line5 => |state| {check_line5(state, (0,1))},
		Line6 => |_state| {},

		// arc (0,2)
		Line5 => |state| {check_line5(state, (0,2))},
		Line6 => |_state| {},

		// arc (1,2)
		Line5 => |state| {check_line5(state, (1,2))},
		Line6 => |_state| {},

		// iteration 3
		Line4 => |state| { check_line4(state) },
		// arc (0,1)
		Line5 => |state| {check_line5(state, (0,1))},
		Line6 => |_state| {},

		// arc (0,2)
		Line5 => |state| {check_line5(state, (0,2))},
		Line6 => |_state| {},

		// arc (1,2)
		Line5 => |state| {check_line5(state, (1,2))},
		Line6 => |_state| {},



		// done
		Line9 => |_state| {},
		Line10 => |state| { check_line10(state, tree) }

	]);
}

#[test]
fn test_negative_cycle_graph() {
	let nodes = vec![
		Node::new(0, String::from("A")),
		Node::new(1, String::from("B")),
		Node::new(2, String::from("C")),
	];
	let links = vec![Link::new(0, 1, 1), Link::new(1, 2, 1), Link::new(2, 0, -3)];
	let state = MbfVisualisationState::new(Graph::from_nodes_and_links(nodes, links), 0);
	let sm = StateMachine::new(|out| mbf(state, out));
	let tree: HashSet<(usize, usize)> = HashSet::from([(0, 1), (1, 2), (2, 0)]);

	test_run!(sm => [
		Line1 => |state| { check_line1(state) },
		Line2 => |state| { check_line2(state) },
		Line3 => |state| { check_line3(state) },
		// iteration 1
		Line4 => |state| { check_line4(state) },
		// arc (0,1)
		Line5 => |state| {check_line5(state, (0,1))},
		Line6 => |_state| {},
		Line7 => |state| { check_line7(state, 1, 1.0) },
		Line8 => |_state| {},

		// arc (1,2)
		Line5 => |state| {check_line5(state, (1,2))},
		Line6 => |_state| {},
		Line7 => |state| { check_line7(state, 2, 2.0) },
		Line8 => |_state| {},

		// arc (2,0)
		Line5 => |state| {check_line5(state, (2,0))},
		Line6 => |_state| {},
		Line7 => |state| { check_line7(state, 0, -1.0) },
		Line8 => |_state| {},

		// iteration 2
		Line4 => |state| { check_line4(state) },
		// arc (0,1)
		Line5 => |state| {check_line5(state, (0,1))},
		Line6 => |_state| {},
		Line7 => |state| { check_line7(state, 1, 0.0) },
		Line8 => |_state| {},

		// arc (1,2)
		Line5 => |state| {check_line5(state, (1,2))},
		Line6 => |_state| {},
		Line7 => |state| { check_line7(state, 2, 1.0) },
		Line8 => |_state| {},

		// arc (2,0)
		Line5 => |state| {check_line5(state, (2,0))},
		Line6 => |_state| {},
		Line7 => |state| { check_line7(state, 0, -2.0) },
		Line8 => |_state| {},

		// iteration 3
		Line4 => |state| { check_line4(state) },
		// arc (0,1)
		Line5 => |state| {check_line5(state, (0,1))},
		Line6 => |_state| {},
		Line7 => |state| { check_line7(state, 1, -1.0) },
		Line8 => |_state| {},

		// arc (1,2)
		Line5 => |state| {check_line5(state, (1,2))},
		Line6 => |_state| {},
		Line7 => |state| { check_line7(state, 2, 0.0) },
		Line8 => |_state| {},

		// arc (2,0)
		Line5 => |state| {check_line5(state, (2,0))},
		Line6 => |_state| {},
		Line7 => |state| { check_line7(state, 0, -3.0) },
		Line8 => |_state| {},



		// done
		Line9 => |_state| {},
		Line10 => |state| { check_line10(state, tree) }

	]);
}
