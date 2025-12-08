#![warn(rust_2018_idioms, unreachable_pub)]
#![forbid(elided_lifetimes_in_paths, unsafe_code)]

mod link;
mod node;
mod properties;

pub use link::*;
pub use node::*;
pub use properties::*;

use num_traits::Zero;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::{collections::HashSet, marker::PhantomData};

/// This trait exists solely for the purpouse of collecting generics into a single type.
/// It allows [`Graph`] to only have one single generic parameter.
pub trait Configuration {
	type LinkWeight: LinkWeight + DeserializeOwned + Serialize;
}

impl<LW> Configuration for (LW,)
where
	LW: LinkWeight + DeserializeOwned + Serialize
{
	type LinkWeight = LW;
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(bound(deserialize = "C::LinkWeight: DeserializeOwned"))]
#[serde(bound(serialize = "C::LinkWeight: Serialize"))]
pub struct Graph<C: Configuration> {
	#[serde(skip)]
	_configuration: PhantomData<C>,

	pub nodes: Vec<Node>,
	pub links: Vec<Link<C::LinkWeight>>,
	pub description: Option<String>
}

impl<C: Configuration> Default for Graph<C> {
	fn default() -> Self {
		Self::new()
	}
}

impl<C: Configuration> Graph<C> {
	pub fn new() -> Self {
		Self {
			_configuration: PhantomData,
			description: None,
			nodes: Vec::new(),
			links: Vec::new()
		}
	}

	pub fn from_nodes_and_links(nodes: Vec<Node>, links: Vec<Link<C::LinkWeight>>) -> Self {
		Self {
			_configuration: PhantomData,
			description: None,
			nodes,
			links
		}
	}

	pub fn add_node(&mut self, index: usize) {
		let name = index.to_string();
		let node = Node::new(index, name);
		self.add_node_with_value(node)
	}

	pub fn add_node_with_value(&mut self, value: Node) {
		self.nodes.push(value);
	}

	pub fn add_edge(&mut self, from: usize, to: usize, new_weight: C::LinkWeight) {
		if !self.nodes.iter().map(|x| x.id).any(|x| x == from) {
			self.add_node(from);
		}
		if !self.nodes.iter().map(|x| x.id).any(|x| x == to) {
			self.add_node(to);
		}
		let new_link = Link::new(from, to, new_weight);

		self.links.push(new_link)
	}

	pub fn get_edge(&mut self, from: usize, to: usize) -> Option<usize> {
		self.links.iter().position(|x| x.source == from && x.target == to)
	}

	pub fn is_connected(&self) -> bool {
		// an empty graph is always connected
		if self.nodes.is_empty() {
			return true;
		}

		let mut found = HashSet::new();
		let mut q = Vec::new();
		q.push(self.nodes.first().unwrap().id);
		while let Some(v) = q.pop() {
			if found.contains(&v) {
				continue;
			}
			found.insert(v);
			for l in &self.links {
				// we treat this graph as undirected here
				if l.source == v && !found.contains(&l.target) {
					q.push(l.target);
				} else if l.target == v && !found.contains(&l.source) {
					q.push(l.source);
				}
			}
		}

		found.len() == self.nodes.len()
	}

	pub fn find_unvisited_neighbours(&mut self, from: usize) -> impl Iterator<Item = usize> + '_ {
		self.links
			.iter_mut()
			.filter(move |x| x.source == from)
			.filter(|value| self.nodes.iter().any(|x| x.id == value.target))
			.map(|value| value.target)
	}

	pub fn generate_adj_matrix(&self) -> Vec<Vec<C::LinkWeight>>
	where
		C::LinkWeight: Zero + Copy
	{
		// Find max node ID to determine full size
		let max_id = self.nodes.iter().map(|n| n.id).max().unwrap_or(0);
		let size = max_id + 1; // assuming 0-based IDs

		let mut adj_matrix = vec![vec![C::LinkWeight::zero(); size]; size];

		for link in &self.links {
			adj_matrix[link.source][link.target] = link.weight;
		}

		adj_matrix
	}

	/// Preprocess:
	/// Replace every zero valued entry in upper triangular matrix
	/// by the corresponding entry in the transpose (or lower triangular matrix)
	pub fn preprocess_links_as_undirected(&self) -> Self
	where
		C::LinkWeight: Zero + Copy
	{
		let mut adjusted_graph = Graph::new();
		let mut already_encountered: Vec<(usize, usize)> = Vec::new(); // Do not consider redundant links

		// sort links lexicographically through (source,target), where source is the smaller vertex
		// this is done, so that the user knows the order in which the computer considers the edges in the algo.
		let mut sorted_links = self.links.clone();
		sorted_links.sort_by_key(|l| (l.source.min(l.target), l.source.max(l.target)));

		for link in sorted_links {
			if link.weight.is_zero() || already_encountered.contains(&(link.source, link.target)) {
				continue;
			}
			if link.source > link.target {
				adjusted_graph.add_edge(link.target, link.source, link.weight);
			} else {
				adjusted_graph.add_edge(link.source, link.target, link.weight);
			}
			already_encountered.push((link.source, link.target));
			already_encountered.push((link.target, link.source));
		}
		adjusted_graph
	}

	/// Assume graph is undirected
	pub fn is_complete(&self) -> bool {
		for current_node in self.nodes.iter() {
			for other_node in self.nodes.iter() {
				if current_node.id == other_node.id {
					continue;
				}
				if !self.links.iter().any(|link| {
					(link.source == current_node.id && link.target == other_node.id)
						|| (link.source == other_node.id && link.target == current_node.id)
				}) {
					return false;
				}
			}
		}
		true
	}
}

impl<LW> Graph<(LW,)>
where
	LW: LinkWeight + DeserializeOwned + Serialize + Zero + Copy
{
	/// Create a new graph based on an adjacency matrix.
	pub fn from_adj_matrix(matrix: &[&[LW]], description: &str) -> Self {
		let mut graph = Graph::new();

		for y in 0 .. matrix.len() {
			graph.add_node(y);
		}

		for (y, row) in matrix.iter().enumerate() {
			for x in 0 .. row.len() {
				if !matrix[y][x].is_zero() {
					graph.add_edge(y, x, matrix[y][x]);
				}
			}
		}

		graph.description = Some(description.to_string());
		graph
	}
}

/**
 * function checking the validation of input-matrix
 * 1. negative value exists
 * 2. N*N as Matrix (size valid)
 * Maybe we can check the negative value before the value convert into matrix.
 */
pub fn dij_validation_check(matrix: Vec<Vec<isize>>) -> bool {
	let mut res: bool = true;
	for x in &matrix {
		if x.capacity() != matrix.capacity() {
			res = false;
			break;
		} else {
			for y in x {
				if y < &0 {
					//although datatype usize doesn't accept negative value.
					res = false;
					break;
				}
			}
		}
	}
	res
}

/*
After using dij_validation_check convert matrix from Vec<Vec<isize>> -> Vec<Vec<usize>>
*/
pub fn datatype_converter(matrix: Vec<Vec<isize>>) -> Vec<Vec<usize>> {
	let mut res: Vec<Vec<usize>> = Vec::new();
	for x in matrix {
		let mut temp: Vec<usize> = Vec::new();
		for y in x {
			temp.push(y as usize);
		}
		res.push(temp.clone());
	}
	res
}

// pub fn node_layout<C: Configuration>(mut graph: Graph<C>, layout: LayoutAlgorithm) -> Graph<C> {
// 	let positions = graph_layout(JsValue::from_serde(&graph).unwrap(), LayoutAlgorithm::from(layout));

// 	let positions: HashMap<usize, (usize, usize)> = positions.into_serde().unwrap();

// 	// Set node positions in the graph
// 	for (i, v) in graph.nodes.iter_mut().enumerate() {
// 		v.x = positions[&i].0;
// 		v.y = positions[&i].1;
// 	}

// 	graph
// }

//function to add edges to a graph by an edge list
//
// pub fn generate_graph_by_matrix(&mut self, matrix: Vec<[usize; 3]>) {
// 	for i in matrix {
// 		self.add_edge(i[0], i[1], i[2]);
// 	}
// }
#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn valid_check() {
		let data = vec![vec![1, 2, 99], vec![2, 1, 99], vec![1, 3, 99], vec![1, 3, 99]];
		assert!(!dij_validation_check(data));

		let data2 = vec![vec![1, 2, 99], vec![2, 1, 99]];
		assert!(!dij_validation_check(data2));

		let data3 = vec![vec![1, 2, -99], vec![2, 1, 99], vec![1, 3, 99]];
		assert!(!dij_validation_check(data3));
	}

	#[test]
	fn converter_test() {
		let data4: Vec<Vec<usize>> = vec![vec![1, 2, 99], vec![2, 1, 99], vec![1, 3, 99], vec![1, 3, 99]];
		let data5: Vec<Vec<isize>> = vec![vec![1, 2, 99], vec![2, 1, 99], vec![1, 3, 99], vec![1, 3, 99]];
		assert_eq!(datatype_converter(data5), data4);

		let data6: Vec<Vec<isize>> = vec![vec![1, 2, -1], vec![2, 1, 99], vec![1, 3, 99]];
		let data7: Vec<Vec<usize>> = vec![vec![1, 2, usize::MAX], vec![2, 1, 99], vec![1, 3, 99]]; // Attention here!
		assert_eq!(datatype_converter(data6), data7);
	}
}
