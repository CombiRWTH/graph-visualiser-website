use crate::{Configuration, Graph, LinkWeight};
use gloo_utils::format::JsValueSerdeExt as _;
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, num::NonZeroU64};
use wasm_bindgen::prelude::*;

#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[wasm_bindgen]
pub enum Property {
	UnweightedLinks,
	PositiveWeightedLinks,
	NonNegativeWeightedLinks,
	WeightedLinks,

	Connected,
	Unconnected,
	Empty,

	Complete,
	NotComplete
}

/// This type can store any link weight. It can be used to determine the properties of
/// a graph.
#[derive(Default, Deserialize, Serialize)]
#[serde(untagged)]
pub enum AnyWeight {
	#[default]
	Null,
	Number(serde_json::value::Number)
}

impl LinkWeight for AnyWeight {
	fn properties(&self) -> &'static [Property] {
		match self {
			Self::Null => LinkWeight::properties(&()),
			Self::Number(num) => match num.as_i64() {
				Some(num) if num > 0 => LinkWeight::properties(&NonZeroU64::new(1).unwrap()),
				Some(num) if num == 0 => LinkWeight::properties(&0u64),
				Some(_) => LinkWeight::properties(&0i64), // num < 0
				None => LinkWeight::properties(&0i64)     // malformed?
			}
		}
	}
}

/// The configuration for a graph that can store anything.
pub struct AnyConfiguration(());

impl Configuration for AnyConfiguration {
	type LinkWeight = AnyWeight;
}

/// A set of properties.
#[wasm_bindgen]
pub struct Properties(HashSet<Property>);

impl Properties {
	pub fn contains(&self, prop: Property) -> bool {
		self.0.contains(&prop)
	}
}

// wasm-bindgen can't do anything ... neither sets, nor vecs, nor functions taking self
// this is like the next best thing I could think of
/// Check whether a property is contained in the properties set.
#[wasm_bindgen]
pub fn properties_contains(this: &Properties, prop: Property) -> bool {
	this.contains(prop)
}

/// Get all properties of the graph.
#[wasm_bindgen]
pub fn graph_properties(graph: JsValue) -> Properties {
	Properties(graph_properties_impl(graph.into_serde().unwrap()))
}

fn graph_properties_impl(graph: Graph<AnyConfiguration>) -> HashSet<Property> {
	let mut props = HashSet::new();

	let mut link_weight_props: HashSet<Property> = [
		Property::UnweightedLinks,
		Property::PositiveWeightedLinks,
		Property::NonNegativeWeightedLinks,
		Property::WeightedLinks
	]
	.into_iter()
	.collect();
	for link in &graph.links {
		let props: HashSet<Property> = link.weight.properties().iter().copied().collect();
		link_weight_props.retain(|p| props.contains(p));
	}
	props.extend(link_weight_props.into_iter());

	if graph.nodes.is_empty() {
		props.insert(Property::Empty);
	}
	props.insert(match graph.is_connected() {
		true => Property::Connected,
		false => Property::Unconnected
	});
	props.insert(match graph.is_complete() {
		true => Property::Complete,
		false => Property::NotComplete
	});

	props
}

#[cfg(test)]
mod tests {
	use super::{Property::*, *};

	fn test_properties(graph: Graph<AnyConfiguration>, expected: &[Property]) {
		let props = graph_properties_impl(graph);
		for prop in expected {
			assert!(props.contains(prop), "Expected graph to have property {prop:?}");
		}
		assert_eq!(
			props.len(),
			expected.len(),
			"Expected graph to have properties {expected:?}, but graph has more properties: {props:?}"
		);
	}

	#[test]
	fn test_empty_graph() {
		test_properties(Graph::new(), &[
			UnweightedLinks,
			PositiveWeightedLinks,
			NonNegativeWeightedLinks,
			WeightedLinks,
			Connected,
			Complete,
			Empty
		]);
	}

	#[test]
	fn test_one_link_with_weight_null() {
		let mut graph = Graph::new();
		graph.add_node(0);
		graph.add_node(1);
		graph.add_edge(0, 1, serde_json::from_str("null").unwrap());
		test_properties(graph, &[UnweightedLinks, Connected, Complete]);
	}

	#[test]
	fn test_one_link_with_weight_zero() {
		let mut graph = Graph::new();
		graph.add_node(0);
		graph.add_node(1);
		graph.add_edge(0, 1, serde_json::from_str("0").unwrap());
		test_properties(graph, &[NonNegativeWeightedLinks, WeightedLinks, Connected, Complete]);
	}

	#[test]
	fn test_one_link_with_weight_one() {
		let mut graph = Graph::new();
		graph.add_node(0);
		graph.add_node(1);
		graph.add_edge(0, 1, serde_json::from_str("1").unwrap());
		test_properties(graph, &[
			PositiveWeightedLinks,
			NonNegativeWeightedLinks,
			WeightedLinks,
			Complete,
			Connected
		]);
	}

	#[test]
	fn test_one_link_with_weight_minus_one() {
		let mut graph = Graph::new();
		graph.add_node(0);
		graph.add_node(1);
		graph.add_edge(0, 1, serde_json::from_str("-1").unwrap());
		test_properties(graph, &[WeightedLinks, Connected, Complete]);
	}

	#[test]
	fn test_two_non_negative_links() {
		let mut graph = Graph::new();
		graph.add_node(0);
		graph.add_node(1);
		graph.add_node(2);
		graph.add_edge(0, 1, serde_json::from_str("0").unwrap());
		graph.add_edge(1, 2, serde_json::from_str("1").unwrap());
		test_properties(graph, &[
			NonNegativeWeightedLinks,
			WeightedLinks,
			Connected,
			NotComplete
		]);
	}
}
