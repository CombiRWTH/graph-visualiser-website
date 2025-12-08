/// This macro expands to a bunch of boilerplate code necessary to expose an algorithm
/// to the frontend.
#[macro_export]
macro_rules! export_algorithm_to_wasm {
	($input:ident) => {
		static STATE_MACHINES: $crate::private::StateMachines<$input> = $crate::private::state_machines_new::<$input>();
		static HISTORIES: $crate::private::Histories<$input> = $crate::private::histories_new::<$input>();

		/// Return the pseudo code for this algorithm.
		#[$crate::private::wasm_bindgen(js_name = getPseudoCode)]
		pub fn pseudo_code() -> $crate::private::Array {
			$crate::private::pseudo_code::<$input>().unwrap()
		}

		/// Return the requirements that this algorithm has regarding the graph
		/// properties.
		#[$crate::private::wasm_bindgen(js_name = getGraphPropertyRequirements)]
		pub fn graph_property_requirements() -> $crate::private::PropertyRequirements {
			$crate::private::graph_property_requirements::<$input>()
		}

		/// Set a graph and start node to start a new algorithm.
		///
		/// In case you want to restart the algorithm, don't forget to call the drop state
		/// function on the old instance first to free up resources.
		#[$crate::private::wasm_bindgen(js_name = setGraph)]
		pub fn set_graph(graph: $crate::private::JsValue, start_node: usize) -> $crate::private::JsValue {
			$crate::private::set_graph::<$input>(&STATE_MACHINES, &HISTORIES, graph, start_node)
		}

		/// Compute the next step of the algorithm. This method returns a new state. You
		/// must not use the state passed as an argument to this method anymore.
		///
		/// When the algorithm finishes, the next call to this method after its last step
		/// will set the line to `None`. You must not call this method afterwards.
		///
		/// This method will fail if the state is invalid. States become invalid when
		/// the algorithm is finished, or when you call the drop state function.
		#[$crate::private::wasm_bindgen(js_name = nextStep)]
		pub fn next_step(
			state: $crate::private::JsValue
		) -> Result<$crate::private::JsValue, $crate::private::JsValue> {
			$crate::private::next_step::<$input>(&STATE_MACHINES, &HISTORIES, state)
				.map_err(|err| $crate::private::JsValue::from_str(err.to_string().as_str()))
		}

		#[$crate::private::wasm_bindgen(js_name = prevStep)]
		pub fn prev_step(
			state: $crate::private::JsValue
		) -> Result<$crate::private::JsValue, $crate::private::JsValue> {
			$crate::private::prev_step::<$input>(&HISTORIES, state)
				.map_err(|err| $crate::private::JsValue::from_str(err.to_string().as_str()))
		}

		/// Drop the state. This method should be called when an algorithm will not be
		/// used anymore to free up memory resources. You must not call the next step
		/// function after dropping the state.
		#[$crate::private::wasm_bindgen(js_name = dropState)]
		pub fn drop_state(state: $crate::private::JsValue) {
			$crate::private::drop_state::<$input>(&STATE_MACHINES, &HISTORIES, state)
		}

		/// Get the number of example graphs that come with this algorithm.
		#[$crate::private::wasm_bindgen(js_name = getListLen)]
		pub fn example_count() -> usize {
			$crate::private::example_count::<$input>()
		}

		/// Get an example graph by its index. The index must be between 0 and the return
		/// value of the example count function.
		#[$crate::private::wasm_bindgen(js_name = getExampleGraph)]
		pub fn example(index: usize) -> $crate::private::JsValue {
			$crate::private::example::<$input>(index)
		}
	};
}
