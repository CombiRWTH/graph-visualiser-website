use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[wasm_bindgen]
#[serde(rename_all = "camelCase")]
#[wasm_bindgen]
pub struct Node {
	pub id: usize,

	#[wasm_bindgen(getter_with_clone)]
	pub name: String
}

#[wasm_bindgen]
impl Node {
	#[wasm_bindgen(constructor)]
	pub fn new(id: usize, name: String) -> Node {
		Node { id, name }
	}
}
