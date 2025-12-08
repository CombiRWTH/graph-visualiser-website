#![warn(rust_2018_idioms, unreachable_pub)]
#![forbid(elided_lifetimes_in_paths)]

//! This library defines the [`Algorithm`] trait which needs to be implemented by every
//! algorithm.
//!
//! You can find more details here:
//! <https://git.rwth-aachen.de/combi/lab/graph-visualiser/-/wikis/Codebase/Backend/Algorithm-Crates>

// re-export proc macros
#[doc(inline)]
pub use algorithm_impl::*;

pub mod abuse;

pub mod history;

#[macro_use]
mod macros;

#[doc(hidden)]
pub mod private;

use abuse::StateMachine;
use gloo_utils::format::JsValueSerdeExt as _;
use graph::{Configuration, Graph, Property};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::JsValue;

/// This trait needs to be implemented for the visualisation state of each algorithm. It
/// is what is sent to the frontend after each step.
///
/// It also stores the graph configuration that the algorithm expects, and has a function
/// to initialise a visualisation state from a graph.
pub trait VisualisationState: Clone + DeserializeOwned + Serialize {
	type Configuration: Configuration;

	/// Create the initial visualisation state from a graph and a start node.
	fn new(graph: Graph<Self::Configuration>, start_node: usize) -> Self;
}

/// This enum is used to send the pseudocode from the backend to the frontend.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(tag = "ty", content = "value")]
pub enum PseudocodeText {
	Text(&'static str),
	Variable(&'static str)
}

pub type Variables = HashMap<&'static str, serde_json::Value>;

pub trait Pseudocode: Clone {
	/// This array contains human-readable descriptions of all pseudocode lines.
	const DESCRIPTION: &'static [&'static [PseudocodeText]];

	/// Return the first line of the algorithm.
	fn start() -> Self;

	/// Return the current line number.
	fn line(&self) -> usize;

	/// Return the variables and their values for the current line.
	fn variables(&self) -> Variables;
}
/// This struct is used to store example graphs for the algorithm. It contains the adjacency matrix
/// of the graph and a description of the graph.
pub struct ExampleGraph<'a> {
	pub adj: &'a [&'a [isize]],
	pub description: &'a str
}

/// This trait needs to be implemented by every algorithm.
pub trait Algorithm {
	/// The visualisation state is the place to store everything the algorithm needs to
	/// remember - both its input graph and any private variables it creates during
	/// its execution that need to be retained between different lines of pseudocode.
	type VisualisationState: VisualisationState;

	/// The pseudocode is used both for giving a human-readable description of the code,
	/// as well as to step through the code line by line.
	type Pseudocode: Pseudocode;

	/// Example graphs for this algorithm.
	const EXAMPLES: &'static [ExampleGraph<'static>];

	/// A list of all properties a graph must have for this algorithm to be run on the
	/// graph.
	const REQUIRED_PROPERTIES: &'static [Property];

	/// A list of all properties that are incompatible with this algorithm, i.e. that a
	/// graph must not have for this algorithm to be run on it.
	const INCOMPATIBLE_PROPERTIES: &'static [Property];

	/// Create a new state machine to iterate through the algorithm's execution.
	fn new(state: Self::VisualisationState) -> StateMachine<Self::Pseudocode, Self::VisualisationState>;
}

pub fn modify_vis_state<A, F>(state: JsValue, callback: F) -> JsValue
where
	A: Algorithm,
	F: FnOnce(&mut A::VisualisationState)
{
	let mut state: private::State<A::VisualisationState> = state.into_serde().unwrap();
	callback(&mut state.vis_state);
	JsValue::from_serde(&state).unwrap()
}
