use crate::{dijkstra, DijkstraConfiguration, DijkstraPseudocode::*, DijkstraVisualisationState};
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

fn check_line1(state: DijkstraVisualisationState) {
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

fn check_line2(state: DijkstraVisualisationState) {
	assert_eq!(state.distance[&state.start_node], 0.0);
}

fn check_line3(state: DijkstraVisualisationState) {
	state.predecessor.iter().for_each(|pred| {
		// we expect that only the predecessors for the start node are set,
		// and that it is set to the start node
		assert_eq!(*pred.0, state.start_node);
		assert_eq!(*pred.1, state.start_node);
	});
}

fn check_line4(state: DijkstraVisualisationState) {
	assert!(state.visited_nodes.is_empty());
}

fn check_line6(state: DijkstraVisualisationState, node_id: usize) {
	assert_eq!(state.active_node, Some(node_id))
}

fn check_line7(state: DijkstraVisualisationState, node_id: usize, neighbors: &[usize]) {
	// this would be too easy:
	// assert_eq!(state.neighbors, neighbors);

	// instead, we have to look at active edges:
	for (s, t) in state.active_edges {
		assert_eq!(s, node_id);
		assert!(neighbors.iter().any(|n| t == *n));
	}
}

fn get_node_idx(graph: &Graph<DijkstraConfiguration>, node_id: usize) -> Option<usize> {
	graph.nodes.iter().position(|n| n.id == node_id)
}

fn check_line9(state: DijkstraVisualisationState, neighbor_id: usize, new_distance: f64) {
	assert_eq!(
		state.distance[&get_node_idx(&state.graph, neighbor_id).unwrap()],
		new_distance
	);
}

fn check_line10(state: DijkstraVisualisationState, neighbor_id: usize) {
	assert_eq!(
		state.predecessor[&get_node_idx(&state.graph, neighbor_id).unwrap()],
		state.active_node.unwrap()
	);
}

fn check_line11(state: DijkstraVisualisationState, node_id: usize) {
	assert!(state.visited_nodes.contains(&node_id))
}

#[test]
fn test_unconnected_graph() {
	let nodes = vec![Node::new(0, String::from("A")), Node::new(1, String::from("B"))];
	let links = Vec::new();
	let state = DijkstraVisualisationState::new(Graph::from_nodes_and_links(nodes, links), 0);
	let sm = StateMachine::new(|out| dijkstra(state, out));
	test_run!(sm => [
		Line1 => |state| { check_line1(state) },
		Line2 => |state| { check_line2(state) },
		Line3 => |state| { check_line3(state) },
		Line4 => |state| { check_line4(state) },
		// visit node 0
		Line5 => |_state| {},
		Line6 => |state| { check_line6(state, 0) },
		Line7 => |state| { check_line7(state, 0, &[]) },
		Line11 => |state| { check_line11(state, 0) },
		// done
		Line5 => |_state| {}
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
	let state = DijkstraVisualisationState::new(Graph::from_nodes_and_links(nodes, links), 0);
	let sm = StateMachine::new(|out| dijkstra(state, out));
	test_run!(sm => [
		Line1 => |state| { check_line1(state) },
		Line2 => |state| { check_line2(state) },
		Line3 => |state| { check_line3(state) },
		Line4 => |state| { check_line4(state) },
		// visit node 0
		Line5 => |_state| {},
		Line6 => |state| { check_line6(state, 0) },
		Line7 => |state| { check_line7(state, 0, &[1, 2]) },
		Line8 => |_state| {},
		// find neighbor 1
		Line9 => |state| { check_line9(state, 1, 1.0) },
		Line10 => |state| { check_line10(state, 1) },
		// continue node 0
		Line7 => |state| { check_line7(state, 0, &[2]) },
		Line8 => |_state| {},
		// find neighbor 2
		Line9 => |state| { check_line9(state, 2, 5.0) },
		Line10 => |state| { check_line10(state, 2) },
		// continue node 0
		Line7 => |state| { check_line7(state, 0, &[]) },
		Line11 => |state| { check_line11(state, 0) },
		// visit node 1
		Line5 => |_state| {},
		Line6 => |state| { check_line6(state, 1) },
		Line7 => |state| { check_line7(state, 1, &[2]) },
		Line8 => |_state| {},
		// find neighbor 2
		Line9 => |state| { check_line9(state, 2, 2.0) },
		Line10 => |state| { check_line10(state, 2) },
		// continue node 1
		Line7 => |state| { check_line7(state, 1, &[]) },
		Line11 => |state| { check_line11(state, 1) },
		// visit node 2
		Line5 => |_state| {},
		Line6 => |state| { check_line6(state, 2) },
		Line7 => |state| { check_line7(state, 2, &[]) },
		Line11 => |state| { check_line11(state, 2) },
		// done
		Line5 => |_state| {}
	]);
}

// In this graph there are links with the same weight. We test that the algorithm treats them in the correct order
#[test]
fn test_unique_sol() {
	// the order of going through the neighbours should not depend on their order in this vector
	let nodes = vec![
		Node::new(0, String::from("A")),
		Node::new(2, String::from("C")),
		Node::new(1, String::from("B")),
	];
	let links = vec![Link::new(0, 1, 1), Link::new(0, 2, 1)];
	let state = DijkstraVisualisationState::new(Graph::from_nodes_and_links(nodes, links), 0);
	let sm = StateMachine::new(|out| dijkstra(state, out));
	test_run!(sm => [
		Line1 => |state| { check_line1(state) },
		Line2 => |state| { check_line2(state) },
		Line3 => |state| { check_line3(state) },
		Line4 => |state| { check_line4(state) },
		// visit node 0
		Line5 => |_state| {},
		Line6 => |state| { check_line6(state, 0) },
		Line7 => |state| { check_line7(state, 0, &[1, 2]) },
		Line8 => |_state| {},
		// find neighbor 1
		Line9 => |state| { check_line9(state, 1, 1.0) },
		Line10 => |state| { check_line10(state, 1) },
		// continue node 0
		Line7 => |state| { check_line7(state, 0, &[2]) },
		Line8 => |_state| {},
		// find neighbor 2
		Line9 => |state| { check_line9(state, 2, 1.0) },
		Line10 => |state| { check_line10(state, 2) },
		// continue node 0
		Line7 => |state| { check_line7(state, 0, &[]) },
		Line11 => |state| { check_line11(state, 0) },
		// visit node 1
		Line5 => |_state| {},
		Line6 => |state| { check_line6(state, 1) },
		// continue node 1
		Line7 => |state| { check_line7(state, 1, &[]) },
		Line11 => |state| { check_line11(state, 1) },
		// visit node 2
		Line5 => |_state| {},
		Line6 => |state| { check_line6(state, 2) },
		Line7 => |state| { check_line7(state, 2, &[]) },
		Line11 => |state| { check_line11(state, 2) },
		// done
		Line5 => |_state| {}
	]);
}
