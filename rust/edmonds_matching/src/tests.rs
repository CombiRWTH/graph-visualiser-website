// /// This test makes assumptions:
// /// - Two nodes share at most one link
// /// - Link source is never greater than the corresponding link target
// /// - Node ids and their row and column index in the adjacency matrix are equal
// /// (basically, the graph in the visualization state has an upper triangular matrix as adjacency matrix)
// /// If some refactoring or changes break these assumptions by intention, you may adjust the tests.
// use crate::{kruskal, KruskalPseudocode::*, KruskalVisualisationState};
// use algorithm::{abuse::StateMachine, VisualisationState as _};
// use graph::Graph;
// use std::collections::{HashMap, HashSet};

// /// A macro that takes an initialized state machine and a list of pseudo code lines and check functions.
// /// The pseudo code line list describe a correct run of the algorithm on the initial state.
// /// The test fails:
// /// if the state machine finishes earlier than expected, or
// /// if the current line is not equal to the given pseudo code line, or
// /// if the check function finds the computed state to be wrong, or
// /// if the state machine finishes later than expected.
// macro_rules! test_run {
// 	(
// 		$sm:ident => [
// 			$(
// 				$line:expr => | $state:ident | { $($body:tt)* }
// 			),*
// 		]
// 	) => {
// 		let mut sm = $sm;
// 		$({
// 			let Some((line, $state)) = sm.poll() else {
// 				panic!("Test run ended prematurely");
// 			};
// 			assert_eq!(line, $line);
// 			$($body)*
// 		})*
// 		if let Some((line, state)) = sm.poll() {
// 			panic!("Expected test run to end, but got line={line:?}, state={state:?}");
// 		}
// 	};
// }

// fn check_line1(state: KruskalVisualisationState) {
// 	// Initialization stuff, very simple
// 	assert!(state.tree_edges.is_empty());
// 	assert!(state.dismissed_edges.is_empty());

// 	// Links should be sorted ascendingly
// 	let mut current_maximal_weight = 0;
// 	for link in state.graph.links.iter() {
// 		assert!(link.weight >= current_maximal_weight);
// 		current_maximal_weight = link.weight;
// 	}
// }
// fn check_line2(state: KruskalVisualisationState) {
// 	// Initialization stuff, very simple
// 	assert_eq!(state.index_variable, 1);
// }
// fn check_line3(state: KruskalVisualisationState, test_state_to_check_greedy: &mut KruskalVisualisationState) {
// 	// Each dismissed edges creates a cycle with tree edges
// 	let mut cycle_edges: Vec<(usize, usize)> = Vec::new();
// 	for (source, target) in &state.tree_edges {
// 		cycle_edges.push((*source, *target));
// 	}
// 	for (source, target) in &state.dismissed_edges {
// 		cycle_edges.push((*source, *target));
// 		assert!(has_cycle(&mut cycle_edges));
// 		cycle_edges.pop();
// 	}

// 	// Check Greedy behavior: An edge added is never removed
// 	for (source, target) in &test_state_to_check_greedy.tree_edges {
// 		assert!(state.tree_edges.contains(&(*source, *target)));
// 	}
// 	for (source, target) in &test_state_to_check_greedy.dismissed_edges {
// 		assert!(state.dismissed_edges.contains(&(*source, *target)));
// 	}
// 	// Fill test state for upcoming greedy checks
// 	for (source, target) in state.tree_edges {
// 		if !test_state_to_check_greedy.tree_edges.contains(&(source, target)) {
// 			test_state_to_check_greedy.tree_edges.insert((source, target));
// 		}
// 	}
// 	for (source, target) in state.dismissed_edges {
// 		if !test_state_to_check_greedy.dismissed_edges.contains(&(source, target)) {
// 			test_state_to_check_greedy.dismissed_edges.insert((source, target));
// 		}
// 	}
// }
// fn check_line4(state: KruskalVisualisationState, test_current_edge: (usize, usize)) {
// 	// Check if there is an active edge and that it is correct
// 	match state.active_edge {
// 		Some(e) => assert_eq!(e, test_current_edge),
// 		None => panic!("No edge active!")
// 	}
// }
// fn check_line5(
// 	state: KruskalVisualisationState,
// 	test_tree_edges: HashSet<(usize, usize)>,
// 	test_dismissed_edges: HashSet<(usize, usize)>
// ) {
// 	// Check if edges are correct
// 	// the algorithm should find the unique mst that results from, when in doubt,
// 	// choosing the lexicographically smaller edge
// 	assert_eq!(state.tree_edges, test_tree_edges);
// 	assert_eq!(state.dismissed_edges, test_dismissed_edges);
// }
// fn check_line6(state: KruskalVisualisationState, test_index_variable: usize) {
// 	// Very simple. But then we only increment a variable so why not.
// 	assert_eq!(state.index_variable, test_index_variable);
// }
// fn check_line7(
// 	state: KruskalVisualisationState,
// 	test_tree_edges: HashSet<(usize, usize)>,
// 	test_dismissed_edges: HashSet<(usize, usize)>
// ) {
// 	// Check if edges are correct
// 	// the algorithm should find the unique mst that results from, when in doubt,
// 	// choosing the lexicographically smaller edge
// 	assert_eq!(state.tree_edges, test_tree_edges);
// 	assert_eq!(state.dismissed_edges, test_dismissed_edges);

// 	// Since Kruskal is greedy, we only need to do the cycle check once.
// 	// Optimally, we do it at the very end, i.e., now:
// 	let mut tree_edges: Vec<(usize, usize)> = Vec::new();
// 	for tree_edge in state.tree_edges.iter() {
// 		tree_edges.push((tree_edge.0, tree_edge.1));
// 	}
// 	assert!(!has_cycle(&mut tree_edges));

// 	// Check if tree edges are actually a tree
// 	assert_eq!(tree_edges.len(), state.graph.nodes.len() - 1);
// 	// Proof of why this suffices:
// 	// A graph with n vertices and n-1 edges that does not contain cycles is a spanning tree
// 	// Induction Start n = 1: Trivially a spanning tree
// 	// Induction Step n -> n+1:
// 	// Consider a graph G with n vertices and n-1 edges. By our induction hypothesis, G is a spanning tree
// 	// If you now add a vertex and an edge you have two choices for the placement of the edge:
// 	// 1) Connect added vertex to G. Then you have a spanning tree.
// 	// 2) Connect two vertices in G with each other. Since G is a spanning tree, you get a cycle. QED
// }

// /// Checks via DFS if we have a cycle
// fn has_cycle(edges: &mut Vec<(usize, usize)>) -> bool {
// 	let adj_matrix = get_adjacency_matrix(edges);
// 	// Gather nodes
// 	let mut nodes: Vec<usize> = Vec::new();
// 	for (source, target) in edges.iter() {
// 		if !nodes.contains(source) {
// 			nodes.push(*source);
// 		}
// 		if !nodes.contains(target) {
// 			nodes.push(*target);
// 		}
// 	}
// 	// Edge case: Nodes are empty
// 	if nodes.len() == 0 {
// 		return false;
// 	}
// 	// Start cycle check
// 	let mut visited: HashMap<usize, bool> = HashMap::new();
// 	for node in nodes.iter() {
// 		visited.insert(*node, false);
// 	}
// 	while visited.iter().any(|(_, &boolean)| !boolean) {
// 		let mut next_node_to_check = adj_matrix.len();
// 		for (node, was_visited) in visited.iter() {
// 			if !was_visited {
// 				next_node_to_check = *node;
// 				break;
// 			}
// 		}
// 		if next_node_to_check == adj_matrix.len() {
// 			panic!("This is not expected.");
// 		}
// 		if has_cycle_connected_to(next_node_to_check, &mut visited, &adj_matrix) {
// 			return true;
// 		}
// 	}
// 	false
// }
// /// Helper functions for cycle check. This one checks for a cycle that is connected to the start node
// fn has_cycle_connected_to(start_node: usize, visited: &mut HashMap<usize, bool>, adj_matrix: &Vec<Vec<usize>>) -> bool {
// 	// Initialize required structures for dfs
// 	visited.insert(start_node, true);
// 	let mut stack: Vec<(usize, usize)> = Vec::new(); // .0: node, .1: column index (helps to keep track which node to consider next)
// 	stack.push((start_node, 0));
// 	let mut parents: Vec<usize> = Vec::new(); // So we do not backtrack if there are still other paths left
// 	parents.push(start_node);
// 	let mut backtracked = 0; // 0: We did not backtrack, 1: We did backtrack
// 						  // Start of DFS
// 	loop {
// 		// Initialize and reset
// 		let current_node;
// 		let column_index;
// 		// Check stack
// 		match stack.iter().last() {
// 			None => {
// 				return false;
// 			},
// 			Some(tuple) => {
// 				current_node = tuple.0;
// 				column_index = tuple.1 + backtracked;
// 			}
// 		}
// 		// Update stack if we backtracked, so we just don't go back from where we came from
// 		if backtracked == 1 {
// 			backtracked = 0;
// 			let stack_size = stack.len();
// 			stack[stack_size - 1] = (current_node, column_index);
// 		}
// 		// If index is out of bounds, pop stack, parents, and backtrack
// 		if column_index >= adj_matrix.len() {
// 			stack.pop();
// 			parents.pop();
// 			backtracked = 1;
// 			continue;
// 		}
// 		// Take next possible edge that does not traverse back to the parent
// 		if adj_matrix[current_node][column_index] == 1 && column_index != *parents.iter().last().unwrap() {
// 			parents.push(current_node);
// 			let next_node = column_index; // Names get a bit confusing, but the column index is also the node id
// 			match visited.get(&next_node) {
// 				Some(true) => {
// 					return true;
// 				},
// 				Some(false) => {
// 					visited.insert(next_node, true);
// 					stack.push((next_node, 0));
// 				},
// 				_ => {
// 					panic!("This should not happen. (Unit test is faulty)");
// 				}
// 			}
// 		} else {
// 			// Update column index
// 			let stack_size = stack.len();
// 			stack[stack_size - 1] = (current_node, column_index + 1);
// 		}
// 	}
// }
// /// Process edges to adjacency matrix
// fn get_adjacency_matrix(edges: &mut Vec<(usize, usize)>) -> Vec<Vec<usize>> {
// 	// Initialize adjacency matrix
// 	let mut adj_matrix: Vec<Vec<usize>> = Vec::new();
// 	// Determine node range
// 	let n = edges
// 		.iter()
// 		.fold(0, |res, edge| *[res, edge.0, edge.1].iter().max().unwrap())
// 		+ 1;
// 	// Fill matrix with zeros
// 	while adj_matrix.len() < n {
// 		let mut row: Vec<usize> = Vec::new();
// 		while row.len() < n {
// 			row.push(0);
// 		}
// 		adj_matrix.push(row);
// 	}
// 	// Scan edges
// 	for (source, target) in edges.iter() {
// 		adj_matrix[*source][*target] = 1;
// 		adj_matrix[*target][*source] = 1;
// 	}
// 	adj_matrix
// }

// // Be careful when creating test instances: Minimal spanning tree is not necessarily unique
// #[test]
// fn test_graph_unique_mst_0() {
// 	// Initialize graph, state, and state machine, and comparison state
// 	let mut graph = Graph::new();
// 	graph.add_edge(0, 1, 1);
// 	graph.add_edge(0, 2, 2);
// 	graph.add_edge(0, 3, 100);
// 	graph.add_edge(1, 2, 3);
// 	graph.add_edge(1, 3, 100);
// 	graph.add_edge(2, 3, 4);
// 	let state = KruskalVisualisationState::new(graph.clone(), 0);
// 	let mut test_state_to_check_greedy = KruskalVisualisationState::new(graph, 0);
// 	let sm = StateMachine::new(|out| kruskal(state, out));
// 	// Run macro
// 	test_run!(sm => [
// 		Line1 => |state| { check_line1(state) },
// 		Line2 => |state| { check_line2(state) },
// 		Line3 => |state| { check_line3(state, &mut test_state_to_check_greedy) },
// 		Line4 => |state| { check_line4(state, (0, 1)) },
// 		Line5 => |state| { check_line5(state, HashSet::from([(0, 1)]), HashSet::from([])) },

// 		Line6 => |state| { check_line6(state, 2) },
// 		Line3 => |state| { check_line3(state, &mut test_state_to_check_greedy) },
// 		Line4 => |state| { check_line4(state, (0, 2)) },
// 		Line5 => |state| { check_line5(state, HashSet::from([(0, 1), (0, 2)]), HashSet::from([])) },
// 		Line6 => |state| { check_line6(state, 3) },

// 		Line3 => |state| { check_line3(state, &mut test_state_to_check_greedy) },
// 		Line4 => |state| { check_line4(state, (1, 2)) }, // This edge will be dismissed next
// 		Line6 => |state| { check_line6(state, 4) },
// 		Line3 => |state| { check_line3(state, &mut test_state_to_check_greedy) },
// 		Line4 => |state| { check_line4(state, (2, 3)) },

// 		Line5 => |state| { check_line5(state, HashSet::from([(0, 1), (0, 2), (2, 3)]), HashSet::from([(1, 2)])) },
// 		Line6 => |state| { check_line6(state, 5) },
// 		Line3 => |state| { check_line3(state, &mut test_state_to_check_greedy) },
// 		Line7 => |state| { check_line7(state, HashSet::from([(0, 1), (0, 2), (2, 3)]), HashSet::from([(1, 2)])) }
// 	]);
// }
// // In this graph there are many msts, so we test, whether the implementation actually finds the right one
// #[test]
// fn test_graph_mst_0() {
// 	// Initialize graph, state, and state machine, and comparison state
// 	let mut graph = Graph::new();
// 	graph.add_edge(0, 1, 1);
// 	graph.add_edge(0, 2, 1);
// 	graph.add_edge(0, 3, 1);
// 	graph.add_edge(1, 3, 2);
// 	graph.add_edge(2, 3, 2);
// 	graph.add_edge(3, 4, 3);
// 	let state = KruskalVisualisationState::new(graph.clone(), 0);
// 	let mut test_state_to_check_greedy = KruskalVisualisationState::new(graph, 0);
// 	let sm = StateMachine::new(|out| kruskal(state, out));
// 	// Run macro
// 	test_run!(sm => [
// 		Line1 => |state| { check_line1(state) },
// 		Line2 => |state| { check_line2(state) },
// 		Line3 => |state| { check_line3(state, &mut test_state_to_check_greedy) },
// 		Line4 => |state| { check_line4(state, (0,1)) },
// 		Line5 => |state| { check_line5(state, HashSet::from([(0, 1)]), HashSet::from([])) },

// 		Line6 => |state| { check_line6(state, 2) },
// 		Line3 => |state| { check_line3(state, &mut test_state_to_check_greedy) },
// 		Line4 => |state| { check_line4(state, (0,2)) },
// 		Line5 => |state| { check_line5(state, HashSet::from([(0, 1), (0, 2)]), HashSet::from([])) },
// 		Line6 => |state| { check_line6(state, 3) },

// 		Line3 => |state| { check_line3(state, &mut test_state_to_check_greedy) },
// 		Line4 => |state| { check_line4(state, (0,3)) },
// 		Line5 => |state| { check_line5(state, HashSet::from([(0, 1), (0, 2), (0, 3)]), HashSet::from([])) },
// 		Line6 => |state| { check_line6(state, 4) },
// 		Line3 => |state| { check_line3(state, &mut test_state_to_check_greedy) },

// 		Line4 => |state| { check_line4(state, (1,3)) },
// 		Line6 => |state| { check_line6(state, 5) },
// 		Line3 => |state| { check_line3(state, &mut test_state_to_check_greedy) },
// 		Line4 => |state| { check_line4(state, (2,3)) },
// 		Line6 => |state| { check_line6(state, 6) },

// 		Line3 => |state| { check_line3(state, &mut test_state_to_check_greedy) },
// 		Line4 => |state| { check_line4(state, (3,4)) },
// 		Line5 => |state| { check_line5(state, HashSet::from([(0, 1), (0, 2), (0, 3), (3, 4)]), HashSet::from([(2, 3), (1, 3)])) },
// 		Line6 => |state| { check_line6(state, 7) },
// 		Line3 => |state| { check_line3(state, &mut test_state_to_check_greedy) },

// 		Line7 => |state| { check_line7(state, HashSet::from([(0, 1), (0, 2), (0, 3), (3, 4)]), HashSet::from([(2, 3), (1, 3)])) }
// 	]);
// }
