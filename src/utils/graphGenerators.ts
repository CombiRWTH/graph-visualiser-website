import { GraphTS } from "../utils/graphs";
import { NodeTS, LinkTS } from "../algorithms/adapter";
import { IGraphGeneratorOptions } from "../algorithms/algorithm-interfaces";
import { getRandomInt } from "./randomInt";

export const generalGraphOptionsDefaults: IGraphGeneratorOptions = {
	weightRange: [1, 9],
	radius: 150,
	center: [150, 150],
	minimumVertexDegree: 2,
	connected: true,
	complete: false,
	directed: false,
	minNodes: 4,
	maxNodes: 6,
	density: 0.4,
	allowSelfLoops: false,
	negativeEdgeWeightsAllowed: false,
};

interface Position {
	x: number;
	y: number;
}

// Helper functions
function generateCircularPosition(index: number, total: number, config: IGraphGeneratorOptions): Position {
	const angle = (2 * Math.PI * index) / total;
	return {
		x: config.center[0] + config.radius * Math.cos(angle),
		y: config.center[1] + config.radius * Math.sin(angle),
	};
}

function createNode(id: number, position: { x: number; y: number }): NodeTS {
	return {
		id: id.toString(),
		name: id.toString(),
		x: position.x,
		y: position.y,
		style: {
			keyshape: {
				fill: "Lightsteelblue",
				stroke: "Lightsteelblue",
			},
			label: {
				value: id.toString(),
			},
		},
	};
}

function createEdge(source: string, target: string, weight: number, areEdgesUndirected = true): LinkTS {
	// For undirected graphs, ensure source < target for consistent ordering
	if (areEdgesUndirected && parseInt(source) > parseInt(target)) {
		[source, target] = [target, source];
	}

	return {
		source,
		target,
		weight,
		style: {
			keyshape: {
				stroke: "Lightsteelblue",
				...(areEdgesUndirected ? { endArrow: { path: "none" } } : {}),
			},
			label: {
				value: weight.toString(),
			},
		},
	};
}

/**
 * Generates a random weight with absolute value within the configured range
 */
function randomWeight(config: IGraphGeneratorOptions): number {
	let [min, max] = config.weightRange;
	if (config.negativeEdgeWeightsAllowed) {
		min = -max;
	}
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if an edge already exists in the graph
 */
function edgeExists(edges: LinkTS[], source: string, target: string, areEdgesUndirected: boolean): boolean {
	if (areEdgesUndirected) {
		// For undirected graphs, check both directions and ensure source < target
		const [minId, maxId] = [source, target].sort((a, b) => parseInt(a) - parseInt(b));
		return edges.some((e) => e.source === minId && e.target === maxId);
	} else {
		return edges.some((e) => e.source === source && e.target === target);
	}
}

function getReachableNodes(graph: GraphTS<NodeTS, LinkTS>, start: number): Set<number> {
	const visited = new Set<number>();
	const queue: number[] = [start];

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (visited.has(current)) continue;

		visited.add(current);

		for (const edge of graph.edges) {
			if (parseInt(edge.source) === current) {
				const target = parseInt(edge.target);
				if (!visited.has(target)) {
					queue.push(target);
				}
			}
		}
	}

	return visited;
}
/**
 * Generates a random graph with specified parameters
 */
export function getRandomGraph(options: Partial<IGraphGeneratorOptions> = {}): GraphTS<NodeTS, LinkTS> {
	const config: IGraphGeneratorOptions = {
		...generalGraphOptionsDefaults,
		...options,
	};
	const n: number = Math.floor(getRandomInt(config.minNodes, config.maxNodes));
	const p: number = config.density;

	// Guard clause for complete graphs
	if (config.complete) {
		return getCompleteGraph(n, options);
	}

	// Preprocessing
	if (config.minimumVertexDegree > n - 1) {
		config.minimumVertexDegree = n - 1;
	}

	// Initialize graph
	const graph: GraphTS<NodeTS, LinkTS> = {
		nodes: [],
		edges: [],
		directed: config.directed,
	};

	// Track adjacency for minimum degree requirement
	const adjacencyList: number[][] = Array(n)
		.fill(null)
		.map(() => []);

	// Create nodes with circular layout
	for (let i = 0; i < n; i++) {
		const position = generateCircularPosition(i, n, config);
		graph.nodes.push(createNode(i, position));
	}

	// Create edges based on probability
	for (let i = 0; i < n; i++) {
		// For undirected graphs, only consider j < i to avoid duplicate edges
		const end = !config.directed ? i : n;

		for (let j = 0; j < end; j++) {
			if (i !== j && Math.random() < p) {
				if (!edgeExists(graph.edges, i.toString(), j.toString(), !config.directed)) {
					graph.edges.push(createEdge(i.toString(), j.toString(), randomWeight(config), !config.directed));
					adjacencyList[i].push(j);
					adjacencyList[j].push(i);
				}
			}
		}
	}

	// Ensure minimum vertex degree
	for (let i = 0; i < n; i++) {
		while (adjacencyList[i].length < config.minimumVertexDegree) {
			// Find non-adjacent vertices
			const nonAdjacent = Array.from({ length: n }, (_, j) => j).filter(
				(j) => j !== i && !adjacencyList[i].includes(j)
			);

			if (nonAdjacent.length === 0) break;

			// Add random edge to non-adjacent vertex
			const j = nonAdjacent[Math.floor(Math.random() * nonAdjacent.length)];
			if (!edgeExists(graph.edges, i.toString(), j.toString(), !config.directed)) {
				graph.edges.push(createEdge(i.toString(), j.toString(), randomWeight(config), !config.directed));
				adjacencyList[i].push(j);
				adjacencyList[j].push(i);
			}
		}
	}
	// Needed for dijkstra
	if (config.connected && config.directed) {
		let reachable = getReachableNodes(graph, 0);

		while (reachable.size < graph.nodes.length) {
			const reachableArray = Array.from(reachable);
			const randomReachable = reachableArray[Math.floor(Math.random() * reachableArray.length)];

			const unreachable = graph.nodes.filter((n) => !reachable.has(Number(n.id)));
			const randomUnreachable = unreachable[Math.floor(Math.random() * unreachable.length)];

			// Add edge from reachable → unreachable
			graph.edges.push(
				createEdge(
					randomReachable.toString(),
					randomUnreachable.id,
					randomWeight(config),
					false // already directed
				)
			);

			reachable = getReachableNodes(graph, 0);
		}
	}

	const graphString = JSON.stringify(graph);
	localStorage.setItem("currentGraph", graphString);
	return graph;
}

/**
 * Generates a random connected tree
 */
export function getRandomTree(n: number, options: Partial<IGraphGeneratorOptions> = {}): GraphTS<NodeTS, LinkTS> {
	const config: IGraphGeneratorOptions = {
		...generalGraphOptionsDefaults,
		...options,
		minimumVertexDegree: 1, // Trees have minimum degree of 1
	};

	const graph: GraphTS<NodeTS, LinkTS> = {
		nodes: [],
		edges: [],
	};

	// Create nodes
	for (let i = 0; i < n; i++) {
		const position = generateCircularPosition(i, n, config);
		graph.nodes.push(createNode(i, position));
	}

	// Create tree edges (connect each new node to a random existing node)
	for (let i = 1; i < n; i++) {
		const parentId = Math.floor(Math.random() * i);
		graph.edges.push(createEdge(parentId.toString(), i.toString(), randomWeight(config), !config.directed));
	}

	return graph;
}

/**
 * Generates a complete graph with n vertices
 */
export function getCompleteGraph(n: number, options: Partial<IGraphGeneratorOptions> = {}): GraphTS<NodeTS, LinkTS> {
	const config: IGraphGeneratorOptions = {
		...generalGraphOptionsDefaults,
		...options,
	};

	const graph: GraphTS<NodeTS, LinkTS> = {
		nodes: [],
		edges: [],
	};

	// Create nodes
	for (let i = 0; i < n; i++) {
		const position = generateCircularPosition(i, n, config);
		graph.nodes.push(createNode(i, position));
	}

	// Create all possible edges (ensuring source < target for undirected graphs)
	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j < n; j++) {
			graph.edges.push(createEdge(i.toString(), j.toString(), randomWeight(config), !config.directed));
		}
	}

	return graph;
}

/**
 *	Generates an unconnected graph
 *  This function generates a graph with a random number of components (>1).
 *  Edges are only added between vertices from the same component
 *  **/
export function getConnectivityGraph(options: Partial<IGraphGeneratorOptions> = {}): GraphTS<NodeTS, LinkTS> {
	const config: IGraphGeneratorOptions = {
		...generalGraphOptionsDefaults,
		...options,
		minimumVertexDegree: 1,
	};

	const graph: GraphTS<NodeTS, LinkTS> = {
		nodes: [],
		edges: [],
	};
	const n = Math.floor(Math.random() * (config.maxNodes - config.minNodes) + config.minNodes);
	const p = config.density;

	// Create nodes
	for (let i = 0; i < n; i++) {
		const position = generateCircularPosition(i, n, config);
		graph.nodes.push(createNode(i, position));
	}

	// up to n-2 components, but at least 2 components, or 1 if n=1
	const numComponents = Math.max(Math.floor(Math.random() * (n - 2)), Math.min(2, n));
	const components: number[][] = Array(numComponents)
		.fill(null)
		.map(() => []);
	const nodeComponentMap: number[] = Array(n)
		.fill(null)
		.map(() => 0);
	for (let i = 0; i < n; i++) {
		nodeComponentMap[i] = Math.floor(Math.random() * numComponents);
		components[nodeComponentMap[i]].push(i);
	}

	// Track adjacency for minimum degree requirement
	const adjacencyList: number[][] = Array(n)
		.fill(null)
		.map(() => []);

	for (let k = 0; k < numComponents; k++) {
		const lenComponent = components[k].length;
		for (let i = 0; i < lenComponent; i++) {
			// For undirected graphs, only consider j < i to avoid duplicate edges
			const end = !config.directed ? i : lenComponent;

			for (let j = 0; j < end; j++) {
				if ((i !== j && Math.random() < p) || ((config.allowSelfLoops ?? false) && Math.random() < 0.07)) {
					graph.edges.push(
						createEdge(
							components[k][i].toString(),
							components[k][j].toString(),
							randomWeight(config),
							!config.directed
						)
					);
					adjacencyList[components[k][i]].push(components[k][j]);
					adjacencyList[components[k][j]].push(components[k][i]);
				}
			}
		}
	}

	// Ensure minimum vertex degree inside components if possible
	for (let i = 0; i < n; i++) {
		while (adjacencyList[i].length < config.minimumVertexDegree) {
			// Find non-adjacent vertices from same component
			const nonAdjacent = components[nodeComponentMap[i]].filter((j) => j !== i && !adjacencyList[i].includes(j));
			// if there are none, we don't bother with the requirement
			if (nonAdjacent.length === 0) break;
			// Add random edge to non-adjacent vertex
			const j = nonAdjacent[Math.floor(Math.random() * nonAdjacent.length)];
			graph.edges.push(createEdge(i.toString(), j.toString(), randomWeight(config), !config.directed));
			adjacencyList[i].push(j);
			adjacencyList[j].push(i);
		}
	}

	return graph;
}
