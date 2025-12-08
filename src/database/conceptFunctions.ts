import { LinkTS, NodeTS } from "../algorithms/adapter";
import { GraphTS } from "../utils/graphs";

export function isTree(graphTS: GraphTS<NodeTS, LinkTS>): boolean {
	const { nodes, edges } = graphTS;

	if (edges.length !== nodes.length - 1) {
		return false;
	}

	const uf = new UnionFind(nodes.length);

	for (const edge of edges) {
		const source = parseInt(edge.source);
		const target = parseInt(edge.target);

		if (source > target && !uf.union(source, target)) {
			// consider only source > target if the graph has both edge (x, y) and (y, x) for undirected graphs.
			return false;
		}
	}
	return true;
}

export class UnionFind {
	private parent: number[];
	private readonly rank: number[];

	constructor(size: number) {
		this.parent = Array.from({ length: size }, (_, i) => i);
		this.rank = Array(size).fill(1);
	}

	find(x: number): number {
		if (this.parent[x] !== x) {
			this.parent[x] = this.find(this.parent[x]);
		}
		return this.parent[x];
	}

	union(x: number, y: number): boolean {
		const rootX = this.find(x);
		const rootY = this.find(y);

		if (rootX !== rootY) {
			if (this.rank[rootX] > this.rank[rootY]) {
				this.parent[rootY] = rootX;
			} else if (this.rank[rootX] < this.rank[rootY]) {
				this.parent[rootX] = rootY;
			} else {
				this.parent[rootY] = rootX;
				this.rank[rootX] += 1;
			}
			return true;
		} else {
			return false;
		}
	}

	connected(x: number, y: number): boolean {
		return this.find(x) === this.find(y);
	}
}

export function calculateVertexDegrees(graph: GraphTS<NodeTS, LinkTS>): Map<string, number> {
	const degrees = new Map<string, number>();

	// Initialize all vertices with degree 0
	graph.nodes.forEach((node) => {
		degrees.set(node.id, 0);
	});

	// Count edges for each vertex
	graph.edges.forEach((edge) => {
		degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
		degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
	});

	return degrees;
}

// Function to find the maximum degree
export function findMaxDegree(degrees: Map<string, number>): number {
	return Math.max(...Array.from(degrees.values()));
}

// Function to find the most frequent degree
export function findMostFrequentDegree(degrees: Map<string, number>): number {
	const frequencyMap = new Map<number, number>();

	// Count frequency of each degree
	degrees.forEach((degree) => {
		frequencyMap.set(degree, (frequencyMap.get(degree) ?? 0) + 1);
	});

	// Find the degree that appears most often
	let mostFrequentDegree = 0;
	let maxFrequency = 0;

	frequencyMap.forEach((frequency, degree) => {
		if (frequency > maxFrequency || (frequency === maxFrequency && degree < mostFrequentDegree)) {
			maxFrequency = frequency;
			mostFrequentDegree = degree;
		}
	});

	return mostFrequentDegree;
}

/* Function to find a path for undirected graphs. To make it more difficult to find the right answer,
   only graphs which have a path of length 4 (4 edges, 5 vertices) are accepted. 
   To avoid very simple/boring paths like 0 -> 2 -> 0 -> 2 -> 1, each vertex should only occur once in the path. */
export function findUndirectedPath(
	graph: GraphTS<NodeTS, LinkTS>,
	startVertex: string,
	endVertex: string
): string[] | null {
	// Create an adjacency list
	const adjacencyList = new Map<string, string[]>();

	// Initialize the adjacency list with empty arrays for each vertex
	for (const node of graph.nodes) {
		adjacencyList.set(node.id, []);
	}

	// Insert the edges into the adjacency list
	for (const edge of graph.edges) {
		adjacencyList.get(edge.source)?.push(edge.target);
		adjacencyList.get(edge.target)?.push(edge.source);
	}

	// Initialize a queue for the BFS which contains the current vertex and the previous path
	const queue: Array<[string, string[]]> = [[startVertex, [startVertex]]];

	// Begin BFS traversal
	while (queue.length > 0) {
		const [currentNode, currentPath] = queue.shift()!;

		// Check if we've reached the target vertex and the path length is exactly 5
		if (currentNode === endVertex && currentPath.length === 5) {
			return currentPath;
		}

		// Visit all unvisited neighboring vertices of the current vertex
		for (const neighbor of adjacencyList.get(currentNode) ?? []) {
			if (!currentPath.includes(neighbor)) {
				queue.push([neighbor, [...currentPath, neighbor]]);
			}
		}
	}

	return null;
}

// Function to check whether a path exists in the graph
export function hasAnyUndirectedPath(
	graph: GraphTS<NodeTS, LinkTS>,
	vertices: string[]
): { found: boolean; start?: string; end?: string } {
	// Takes each vertex in the graph as start and end vertex
	for (let i = 0; i < vertices.length; i++) {
		for (let j = 0; j < vertices.length; j++) {
			if (i !== j) {
				const path = findUndirectedPath(graph, vertices[i], vertices[j]);
				if (path !== null) {
					return { found: true, start: vertices[i], end: vertices[j] };
				}
			}
		}
	}
	return { found: false };
}

// Function to check whether a path in an undirected graph is valid
export function isValidUndirectedPath(graph: GraphTS<NodeTS, LinkTS>, path: string[]): boolean {
	// Iterate over each edge of the path
	for (let i = 0; i < path.length - 1; i++) {
		const current = path[i];
		const next = path[i + 1];

		// Check whether every edge in the path exists
		const isConnected = graph.edges.some(
			(edge) =>
				(edge.source === current && edge.target === next) || (edge.source === next && edge.target === current)
		);

		if (!isConnected) return false;
	}

	return true;
}

/* Find a perfect matching for undirected graphs using a simple brute-force algorithm with exponential time complexity.
   For our small graphs this is okay. */
export function findPerfectMatching(graph: GraphTS<NodeTS, LinkTS>): Array<[string, string]> | null {
	// A perfect matching is only possible if the number of vertices is even
	if (graph.nodes.length % 2 !== 0) return null;

	// Create an adjacency list
	const adjacencyList = new Map<string, string[]>();

	// Initialize the adjacency list with empty arrays for each vertex
	for (const node of graph.nodes) {
		adjacencyList.set(node.id, []);
	}

	// Insert the edges into the adjacency list
	for (const edge of graph.edges) {
		adjacencyList.get(edge.source)?.push(edge.target);
		adjacencyList.get(edge.target)?.push(edge.source);
	}

	// Track which vertices have been matched
	const matchedNodes = new Set<string>();
	const pairs: Array<[string, string]> = [];

	// Recursive backtracking function to try all possible matchings
	function backtrack(): boolean {
		// If all vertices have been matched, there is a perfect matching
		if (matchedNodes.size === graph.nodes.length) return true;

		// Select the first unmatched vertex
		const unmatched: string[] = graph.nodes.map((node) => node.id).filter((id) => !matchedNodes.has(id));
		const firstUnmatched = unmatched[0];

		// Try pairing it with each of its unmatched neighbors
		for (const neighbor of adjacencyList.get(firstUnmatched) ?? []) {
			if (matchedNodes.has(neighbor)) continue;

			// Temporarily match the pairs
			matchedNodes.add(firstUnmatched);
			matchedNodes.add(neighbor);
			pairs.push(firstUnmatched < neighbor ? [firstUnmatched, neighbor] : [neighbor, firstUnmatched]);

			// Call the method recursively to match the other pairs
			if (backtrack()) return true;

			// Backtrack if no valid matching has been found along this path
			pairs.pop();
			matchedNodes.delete(firstUnmatched);
			matchedNodes.delete(neighbor);
		}

		// No matching possible with the current pairing choices
		return false;
	}

	// Start the recursive matching process, return the result if successful, otherwise null
	if (backtrack()) return pairs;

	return null;
}
