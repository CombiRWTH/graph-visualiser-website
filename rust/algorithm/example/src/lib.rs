#![warn(rust_2018_idioms, unreachable_pub)]
#![forbid(elided_lifetimes_in_paths, unsafe_code)]

use algorithm::{
	abuse::{StateMachine, States},
	export_algorithm_to_wasm, Algorithm, ExampleGraph, Pseudocode, VisualisationState
};
use graph::{Graph, Property};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// initialise panic handler
#[wasm_bindgen(start)]
pub fn init_panic_handler() {
	console_error_panic_hook::set_once();
}

type MyAlgoConfiguration = (usize,);

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MyAlgoVisualisationState {
	pub graph: Graph<MyAlgoConfiguration>,
	pub helptext: String
}

impl VisualisationState for MyAlgoVisualisationState {
	type Configuration = MyAlgoConfiguration;

	fn new(graph: Graph<MyAlgoConfiguration>, _start_node: usize) -> Self {
		Self {
			graph: graph.preprocess_links_as_undirected(),
			helptext: "Initialized".to_string()
		}
	}
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Pseudocode)]
enum MyAlgoPseudocode {
	Initialise,

	/// Eat {food}.
	Eat {
		food: &'static str
	},

	/// Sleep for {hours}.
	Sleep {
		hours: usize
	},

	/// Repeat.
	Repeat
}

async fn my_algo(mut state: MyAlgoVisualisationState, out: States<MyAlgoPseudocode, MyAlgoVisualisationState>) {
	let mut apple = true;
	loop {
		if apple {
			state.helptext = "Eat an apple to stay healthy".into();
			out.yield_state(MyAlgoPseudocode::Eat { food: "an apple" }, state.clone())
				.await;
		} else {
			state.helptext = "Eat some rice to refill your energy".into();
			out.yield_state(MyAlgoPseudocode::Eat { food: "some rice" }, state.clone())
				.await;
		}
		apple = !apple;

		state.helptext = "Get a good night's rest".into();
		out.yield_state(MyAlgoPseudocode::Sleep { hours: 8 }, state.clone())
			.await;

		state.helptext = "Rinse and repeat".into();
		out.yield_state(MyAlgoPseudocode::Repeat, state.clone()).await;
	}
}

struct MyAlgo;

impl Algorithm for MyAlgo {
	type VisualisationState = MyAlgoVisualisationState;
	type Pseudocode = MyAlgoPseudocode;

	const EXAMPLES: &'static [ExampleGraph<'static>] = &[];

	const REQUIRED_PROPERTIES: &'static [Property] = &[];
	const INCOMPATIBLE_PROPERTIES: &'static [Property] = &[];

	fn new(state: Self::VisualisationState) -> StateMachine<Self::Pseudocode, Self::VisualisationState> {
		StateMachine::new(|out| my_algo(state, out))
	}
}

export_algorithm_to_wasm!(MyAlgo);
