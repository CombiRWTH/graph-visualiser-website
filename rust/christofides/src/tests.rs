// This test makes assumptions:
// - Graph is complete
// - Link source is never greater than the corresponding link target
// - Node ids and their row and column index in the adjacency matrix are equal
// (basically, the graph in the visualization state has an upper triangular matrix as adjacency matrix)
// If some refactoring or changes break these assumptions by intention, you may adjust the tests.
use crate::{christofides, ChristofidesPseudocode::*, ChristofidesVisualisationState};
use algorithm::{abuse::StateMachine, VisualisationState as _};
use graph::Graph;

// A macro that takes an initialized state machine and a list of pseudo code lines and check functions.
// The pseudo code line list describe a correct run of the algorithm on the initial state.
// The test fails:
// if the state machine finishes earlier than expected, or
// if the current line is not equal to the given pseudo code line, or
// if the check function finds the computed state to be wrong, or
// if the state machine finishes later than expected.
macro_rules! test_run {
	(
		$sm:ident => [
			$(
				$line:expr => | $state:ident | { $($body:tt)* }
			),*
		]
	) => {
		let mut sm = $sm;
		$({
			let Some((line, $state)) = sm.poll() else {
				panic!("Test run ended prematurely");
			};
			assert_eq!(line, $line);
			$($body)*
		})*
		if let Some((line, state)) = sm.poll() {
			panic!("Expected test run to end, but got line={line:?}, state={state:?}");
		}
	};
}

/// Compute a minimal spanning Tree $T \subseteq G$
/// Compute a minimal perfect matching $M$ on $V-odd \subseteq V$. The set $V-odd$ contains all vertices in $T$ with odd degree $d_T(v)$.
/// Add $M$ to $T$ and compute an Euler-Tour $Eu$
/// Skip over previously visited cities to obtain an Hamilton cycle $H$ from $Eu$
/// Return H
/*
pub minimal_spanning_tree: Vec<(usize, usize)>,
pub vertices_odd: Vec<usize>,
pub minimal_matching: Vec<(usize, usize)>, // Vertices with index 2k, 2k+1 form an edge
pub euler_tour: Vec<usize>,
pub hamilton_cycle: Vec<usize>,
*/

fn check_line1(state: ChristofidesVisualisationState, mst_weight: usize) {
	// Initialization stuff, very simple
	assert!(state.vertices_odd.is_empty());
	assert!(state.minimal_matching.is_empty());
	assert!(state.euler_tour.is_empty());
	assert!(state.hamilton_cycle.is_empty());

	// MST should be a spanning tree
	assert!(is_a_spanning_tree(
		state.graph.nodes.len(),
		&state.minimal_spanning_tree
	));
	let mut weight = 0;
	for &(source, target) in state.minimal_spanning_tree.iter() {
		let Some(link) = state
			.graph
			.links
			.iter()
			.find(|&l| l.source == source && l.target == target)
		else {
			panic!("Link not found but is specified in minimal spanning tree!");
		};
		weight += link.weight;
	}
	// MST should be minimal
	assert_eq!(mst_weight, weight);
}

fn check_line2(state: ChristofidesVisualisationState) {
	// Check if vertices that are odd in the tree are correct
	// Count degrees
	let mut vertices_degree: Vec<usize> = Vec::new();
	let n = state.graph.nodes.len();
	for _ in 0 .. n {
		vertices_degree.push(0);
	}
	for &(source, target) in state.minimal_spanning_tree.iter() {
		vertices_degree[source] += 1;
		vertices_degree[target] += 1;
	}
	// Check + get odd edges according to the given mst
	let mut v_odd: Vec<usize> = Vec::new();
	for i in 0 .. n {
		if vertices_degree[i] % 2 == 0 {
			assert!(!state.vertices_odd.contains(&i));
		} else {
			assert!(state.vertices_odd.contains(&i));
			v_odd.push(i);
		}
	}

	// Check if Matching is a valid matching
	for &(node_a, node_b) in state.minimal_matching.iter() {
		let Some(node_index) = v_odd.iter().position(|&node_id| node_id == node_a) else {
			panic!("Node given in minimal matching does not belong to the odd degree vertices in the given MST!");
		};
		v_odd.remove(node_index);
		let Some(node_index) = v_odd.iter().position(|&node_id| node_id == node_b) else {
			panic!("Node given in minimal matching does not belong to the odd degree vertices in the given MST!");
		};
		v_odd.remove(node_index);
	}
	assert!(v_odd.is_empty());

	// TODO: Check if Matching is minimal - this weight may not be unique because it depends on the tree (IF YOU MAKE ALL MST UNIQUE FEEL FREE TO ADD WEIGHT PARAMETER)
}

fn check_line3(state: ChristofidesVisualisationState) {
	// Check if euler tour is actually a tour - (we specify the tour without the final element which is simply the first one again)
	let mut edges: Vec<(usize, usize)> = Vec::new();
	for &(source, target) in state.minimal_spanning_tree.iter() {
		edges.push((source, target));
	}
	for &(source, target) in state.minimal_matching.iter() {
		edges.push((source, target));
	}
	assert!(!state.euler_tour.is_empty());
	let mut current = state.euler_tour[0];
	for &next in state.euler_tour.iter().skip(1) {
		let Some(edge_index) = edges.iter().position(|&(source, target)| {
			(source == current && target == next) || (source == next && target == current)
		}) else {
			panic!("Edge given in euler tour does not belong to MST nor minimum weighted matching");
		};
		edges.remove(edge_index);
		current = next;
	}
	// Checking the final edge is not necessary, as we already completed our circle
	assert!(edges.is_empty());
}

fn check_line4(state: ChristofidesVisualisationState) {
	// Did we skip accordingly..
	let mut hamilton_cycle: Vec<usize> = Vec::new();
	for node in state.euler_tour.iter() {
		if !hamilton_cycle.contains(node) {
			hamilton_cycle.push(*node);
		}
	}

	let n = hamilton_cycle.len();
	for i in 0 .. n {
		assert_eq!(hamilton_cycle[i], state.hamilton_cycle[i]);
	}
	// ..and visit every node?
	let number_of_nodes = state.graph.nodes.len();
	assert_eq!(number_of_nodes, n);
}

fn is_a_spanning_tree(number_of_nodes: usize, edges: &Vec<(usize, usize)>) -> bool {
	if edges.len() != number_of_nodes - 1 {
		return false;
	}
	// BFS
	let root = 0;
	let mut visited: Vec<usize> = Vec::new();
	let mut queue: Vec<usize> = Vec::new(); // Check neighbors
	visited.push(root);
	queue.push(root);
	while let Some(current) = queue.pop() {
		for &(source, target) in edges.iter() {
			if source == current && !visited.contains(&target) {
				visited.push(target);
				queue.push(target);
			} else if target == current && !visited.contains(&source) {
				visited.push(source);
				queue.push(source);
			}
		}
	}
	visited.len() == number_of_nodes
}

// Graphs should be metric and complete per assumption of the algorithm itself
// Super easy case
#[test]
fn test_graph_three_nodes() {
	// Initialize graph, state, and state machine
	let mut graph = Graph::new();
	graph.add_edge(0, 1, 1);
	graph.add_edge(0, 2, 2);
	graph.add_edge(1, 2, 400000);
	let state = ChristofidesVisualisationState::new(graph.clone(), 0);
	let sm = StateMachine::new(|out| christofides(state, out));
	// Run macro
	test_run!(sm => [
		Line1 => |state| { check_line1(state, 3) },
		Line2 => |state| { check_line2(state) },
		Line3 => |state| { check_line3(state) },
		Line4 => |state| { check_line4(state) },
		Line5 => |_state| { }
	]);
}

// More involved case
#[test]
fn test_graph_four_nodes() {
	// Initialize graph, state, and state machine, and comparison state
	let mut graph = Graph::new();
	graph.add_edge(0, 1, 1);
	graph.add_edge(0, 2, 17);
	graph.add_edge(0, 3, 12);
	graph.add_edge(1, 2, 5);
	graph.add_edge(1, 3, 39);
	graph.add_edge(2, 3, 56);
	let state = ChristofidesVisualisationState::new(graph.clone(), 0);
	let sm = StateMachine::new(|out| christofides(state, out));
	// Run macro
	test_run!(sm => [
		Line1 => |state| { check_line1(state, 18) },
		Line2 => |state| { check_line2(state) },
		Line3 => |state| { check_line3(state) },
		Line4 => |state| { check_line4(state) },
		Line5 => |_state| {}
	]);
}
