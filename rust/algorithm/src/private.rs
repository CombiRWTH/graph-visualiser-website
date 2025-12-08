//! This module contains code private to the implementation macro.

pub use js_sys::Array;
pub use serde_json::to_value;
pub use wasm_bindgen::{prelude::wasm_bindgen, JsValue};
pub use web_sys::console::log_1 as console_log;

use crate::{abuse::StateMachine, history::History, Algorithm, Pseudocode, VisualisationState};
use gloo_utils::format::JsValueSerdeExt as _;
use graph::{Graph, Properties, Property};
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap};
use thiserror::Error;

// Rust says that we shouldn't use type bounds because they are not enforced. I politely
// disagree: Specifying them still serves as documentation.
#[allow(type_alias_bounds)]
pub type StateMachines<A: Algorithm> =
	Lazy<Mutex<BTreeMap<usize, StateMachine<<A as Algorithm>::Pseudocode, <A as Algorithm>::VisualisationState>>>>;

#[allow(type_alias_bounds)]
pub type Histories<A: Algorithm> =
	Lazy<Mutex<BTreeMap<usize, History<<A as Algorithm>::Pseudocode, <A as Algorithm>::VisualisationState>>>>;

#[derive(Debug, Error)]
#[error("No such handle")]
pub struct NoSuchHandleError;

/// Create a new state machines storage.
pub const fn state_machines_new<A: Algorithm>() -> StateMachines<A> {
	Lazy::new(|| Mutex::new(BTreeMap::new()))
}

/// Insert a new state machine into the storage, and return its handle.
pub fn state_machines_insert<A: Algorithm>(
	state_machines: &StateMachines<A>,
	new: StateMachine<A::Pseudocode, A::VisualisationState>
) -> usize {
	let mut state_machines = state_machines.lock();
	let key = state_machines.last_key_value().map(|(k, _)| *k + 1).unwrap_or_default();
	assert!(!state_machines.contains_key(&key));
	state_machines.insert(key, new);
	key
}

/// Get a state machine by its handle. You must lock the mutex beforehand.
pub fn state_machines_get<A: Algorithm>(
	state_machines: &mut BTreeMap<usize, StateMachine<A::Pseudocode, A::VisualisationState>>,
	key: usize
) -> Result<&mut StateMachine<A::Pseudocode, A::VisualisationState>, NoSuchHandleError> {
	state_machines.get_mut(&key).ok_or(NoSuchHandleError)
}

/// Take a state machine by its handle. It will be removed from storage.
pub fn state_machines_take<A: Algorithm>(
	state_machines: &StateMachines<A>,
	key: usize
) -> Result<StateMachine<A::Pseudocode, A::VisualisationState>, NoSuchHandleError> {
	state_machines.lock().remove(&key).ok_or(NoSuchHandleError)
}

/// Create a new histories storage.
pub const fn histories_new<A: Algorithm>() -> Histories<A> {
	Lazy::new(|| Mutex::new(BTreeMap::new()))
}

/// Insert a new history into the storage, and return its handle.
pub fn histories_insert<A: Algorithm>(
	histories: &Histories<A>,
	new: History<A::Pseudocode, A::VisualisationState>
) -> usize {
	let mut histories = histories.lock();
	let key = histories.last_key_value().map(|(k, _)| *k + 1).unwrap_or_default();
	assert!(!histories.contains_key(&key));
	histories.insert(key, new);
	key
}

/// Get a history by its handle. You must lock the mutex beforehand.
pub fn histories_get<A: Algorithm>(
	histories: &mut BTreeMap<usize, History<A::Pseudocode, A::VisualisationState>>,
	key: usize
) -> Result<&mut History<A::Pseudocode, A::VisualisationState>, NoSuchHandleError> {
	histories.get_mut(&key).ok_or(NoSuchHandleError)
}

/// Take a state machine by its handle. It will be removed from storage.
pub fn histories_take<A: Algorithm>(
	histories: &Histories<A>,
	key: usize
) -> Result<History<A::Pseudocode, A::VisualisationState>, NoSuchHandleError> {
	histories.lock().remove(&key).ok_or(NoSuchHandleError)
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct State<VS> {
	#[serde(flatten)]
	pub(super) vis_state: VS,

	#[serde(skip_serializing_if = "Option::is_none")]
	state_machine_handle: Option<usize>,

	#[serde(rename = "lineOfCode", skip_serializing_if = "Option::is_none")]
	line: Option<usize>,

	#[serde(skip_serializing_if = "Option::is_none")]
	history_handle: Option<usize>,

	#[serde(default, skip_deserializing)]
	variables: HashMap<&'static str, serde_json::Value>
}

impl<VS> State<VS> {
	fn set_line<A>(&mut self, line: A::Pseudocode)
	where
		A: Algorithm<VisualisationState = VS>
	{
		self.line = Some(line.line());
		self.variables = line.variables();
	}
}

pub fn pseudo_code<A: Algorithm>() -> serde_json::Result<Array> {
	// console_log!("[wasm] running pseudo_code()");
	A::Pseudocode::DESCRIPTION.iter().map(JsValue::from_serde).collect()
}

#[wasm_bindgen]
pub struct PropertyRequirements {
	required: &'static [Property],
	incompatible: &'static [Property]
}

pub fn graph_property_requirements<A: Algorithm>() -> PropertyRequirements {
	PropertyRequirements {
		required: A::REQUIRED_PROPERTIES,
		incompatible: A::INCOMPATIBLE_PROPERTIES
	}
}

#[wasm_bindgen]
pub fn properties_compatible(this: &Properties, requirements: &PropertyRequirements) -> bool {
	requirements.required.iter().all(|prop| this.contains(*prop))
		&& requirements.incompatible.iter().all(|prop| !this.contains(*prop))
}

pub fn set_graph<A: Algorithm>(
	state_machines: &StateMachines<A>,
	histories: &Histories<A>,
	graph: JsValue,
	start_node: usize
) -> JsValue {
	// console_log!("[wasm] running set_graph({graph:?}, {start_node})");
	let graph = graph.into_serde().unwrap();
	let vis_state = A::VisualisationState::new(graph, start_node);
	let line = A::Pseudocode::start();
	let sm = A::new(vis_state.clone());
	let mut history = History::new();
	history.push(&line, &vis_state);

	let state_machine_handle = state_machines_insert::<A>(state_machines, sm);
	let history_handle = histories_insert::<A>(histories, history);
	// console_log!("[wasm] set_graph(): Inserted state machine with handle {state_machine_handle}");
	let state = State {
		vis_state,
		state_machine_handle: Some(state_machine_handle),
		history_handle: Some(history_handle),
		line: Some(line.line()),
		variables: line.variables()
	};
	JsValue::from_serde(&state).unwrap()
}

pub fn next_step<A: Algorithm>(
	state_machines: &StateMachines<A>,
	histories: &Histories<A>,
	state: JsValue
) -> Result<JsValue, NoSuchHandleError> {
	// console_log!("[wasm] running next_step({state:?})");
	let mut state: State<A::VisualisationState> = state.into_serde().unwrap();
	let Some(history_handle) = state.history_handle else {
		return Err(NoSuchHandleError);
	};
	let mut history_lock = histories.lock();
	let history = histories_get::<A>(&mut history_lock, history_handle)?;
	if let Some(state_machine_handle) = state.state_machine_handle {
		// State machine handle still exists so we continue executing the machine
		let mut lock = state_machines.lock();
		// console_log!("[wasm] next_step(): Getting state machine with handle {state_machine_handle}");
		let sm = state_machines_get::<A>(&mut lock, state_machine_handle)?;
		let poll = sm.poll();
		drop(lock);
		match poll {
			Some((line, vis_state)) => {
				history.push(&line, &vis_state);
			},
			None => {
				// we're done: remove the state machine
				// console_log!("[wasm] next_step(): Taking state machine with handle {state_machine_handle}");
				state_machines_take::<A>(state_machines, state_machine_handle).unwrap();
				state.state_machine_handle = None;
			}
		}
	}

	// Return next step from current history entry
	if history.next() {
		let line = history.current_pseudocode().unwrap();
		state.set_line::<A>(line.clone());
	} else {
		// Algorithm cannot proceed further from here, hide line
		state.line = None;
	}
	state.vis_state = history.current_vis_state().unwrap().clone();
	Ok(JsValue::from_serde(&state).unwrap())
}

pub fn prev_step<A: Algorithm>(histories: &Histories<A>, state: JsValue) -> Result<JsValue, NoSuchHandleError> {
	// console_log!("[wasm] running prev_step({state:?})");
	let mut state: State<A::VisualisationState> = state.into_serde().unwrap();
	let Some(history_handle) = state.history_handle else {
		return Err(NoSuchHandleError);
	};
	let mut history_lock = histories.lock();
	let history = histories_get::<A>(&mut history_lock, history_handle)?;
	history.prev();
	let line = history.current_pseudocode().unwrap().clone();
	state.set_line::<A>(line);
	state.vis_state = history.current_vis_state().unwrap().clone();
	drop(history_lock);
	Ok(JsValue::from_serde(&state).unwrap())
}

pub fn drop_state<A: Algorithm>(state_machines: &StateMachines<A>, histories: &Histories<A>, state: JsValue) {
	// console_log!("[wasm] running drop_state({state:?})");
	let state: State<A::VisualisationState> = state.into_serde().unwrap();
	if let Some(state_machine_handle) = state.state_machine_handle {
		// console_log!("[wasm] drop_state(): Taking state machine with handle {state_machine_handle}");
		state_machines_take::<A>(state_machines, state_machine_handle).unwrap();
	}
	if let Some(history_handle) = state.history_handle {
		// console_log!("[wasm] drop_state(): Taking history with handle {history_handle}");
		histories_take::<A>(histories, history_handle).unwrap();
	}
	// no need to modify the state as we aren't returning it
}

pub fn example_count<A: Algorithm>() -> usize {
	// console_log!("[wasm] running example_count()");
	A::EXAMPLES.len()
}

pub fn example<A: Algorithm>(index: usize) -> JsValue {
	// console_log!("[wasm] running example({index})");
	let example = &A::EXAMPLES[index];
	let graph = Graph::from_adj_matrix(example.adj, example.description);
	JsValue::from_serde(&graph).unwrap()
}
