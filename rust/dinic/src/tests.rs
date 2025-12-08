// use crate::{dinic, DinicPseudocode::*, DinicVisualisationState};
// use algorithm::{abuse::StateMachine, VisualisationState as _};
// use graph::Graph;

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

// fn check_line1(state: DinicVisualisationState) {
// 	// Initialization stuff
// 	for (_, &flow_value) in state.flow.iter() {
// 		assert_eq!(flow_value, 0);
// 	}
// }

// fn check_line3(state: DinicVisualisationState) {
// 	// Is augmented path determined correctly
// 	let mut current = 0;
// 	for &node in state.blocking_flow.iter().skip(1) {
// 		assert!(state
// 			.residual_graph
// 			.links
// 			.iter()
// 			.any(|link| link.source == current && link.target == node));
// 		current = node;
// 	}
// }

// fn check_line4(state: DinicVisualisationState) {
// 	// Is gamma value computed correctly
// 	let mut capacities: Vec<usize> = Vec::new();
// 	let mut current = 0;
// 	for &node in state.blocking_flow.iter().skip(1) {
// 		let Some(link) = state
// 			.residual_graph
// 			.links
// 			.iter()
// 			.find(|link| link.source == current && link.target == node)
// 		else {
// 			panic!("Augmented path not found in residual graph");
// 		};
// 		capacities.push(link.weight);
// 		current = node;
// 	}
// 	assert_eq!(state.gamma_value, *capacities.iter().min().unwrap());
// }

// fn check_line5(_state: DinicVisualisationState) {
// 	// Was augmented correctly? (Is the new flow computed correctly)
// 	// TODO: Requires old flow for comparison and that old flow is not necessarly unique
// }

// #[test]
// fn test_graph_simple_example() {
// 	// Initialize graph, state, and state machine, and comparison state
// 	let mut graph = Graph::new();
// 	graph.add_edge(0, 2, 2);
// 	graph.add_edge(0, 3, 2);
// 	graph.add_edge(2, 3, 1);
// 	graph.add_edge(2, 1, 1);
// 	graph.add_edge(3, 1, 3);
// 	let state = DinicVisualisationState::new(graph.clone(), 0);
// 	let sm = StateMachine::new(|out| dinic(state, out));
// 	// Run macro
// 	test_run!(sm => [
// 		Line1 => |state| { check_line1(state) },
// 		Line2 => |_state| { },
// 		Line3 => |state| { check_line3(state) },
// 		Line4 => |state| { check_line4(state) },
// 		Line5 => |state| { check_line5(state) },

// 		Line2 => |_state| {},
// 		Line3 => |state| { check_line3(state) },
// 		Line4 => |state| { check_line4(state) },
// 		Line5 => |state| { check_line5(state) },

// 		Line2 => |_state| { },
// 		Line6 => |_state| { }
// 	]);
// }
