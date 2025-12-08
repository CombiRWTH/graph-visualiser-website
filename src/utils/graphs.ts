import { LinkTS, NodeTS } from "../algorithms/adapter";
import { UnionFind } from "../database/conceptFunctions";

export interface BasicGraphNodeRS {
	id: number;
	name: string;
}
export interface BasicGraphLinkRS {
	source: number;
	target: number;
	weight: number;
}

export interface GraphRS<N extends BasicGraphNodeRS, L extends BasicGraphLinkRS> {
	nodes: N[];
	links: L[];
	description?: string;
}

export interface GraphTS<NodeTS, LinkTS> {
	nodes: NodeTS[];
	edges: LinkTS[];
	description?: string;
	directed?: boolean;
}

export interface GraphWithPathMeta extends GraphTS<NodeTS, LinkTS> {
	meta: { startVertex: string; endVertex: string };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function has(a: any, b: string): boolean {
	return Object.prototype.hasOwnProperty.call(a, b);
}

interface PropertyValidationRule {
	property: string;
	required: boolean;
	validation: (elem: unknown) => boolean;
}

// some commonly used validation functions
const isString = (value: unknown): value is string => typeof value === "string";
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const isSafeInteger = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value);
const isNumber = (value: unknown): value is number => typeof value === "number";

const nodeProperties: PropertyValidationRule[] = [
	{ property: "id", required: true, validation: isString },
	{ property: "name", required: true, validation: isString },
	{ property: "color", required: false, validation: isString },
	{ property: "size", required: false, validation: isSafeInteger },
	{ property: "symbolType", required: false, validation: isString },
	{ property: "x", required: false, validation: isNumber },
	{ property: "y", required: false, validation: isNumber },
	{ property: "highlighted", required: false, validation: isBoolean },
];

const edgeProperties: PropertyValidationRule[] = [
	{ property: "source", required: true, validation: isString },
	{ property: "target", required: true, validation: isString },
	{ property: "color", required: false, validation: isString },
	{ property: "weight", required: false, validation: isSafeInteger },
];

function validateProperties(obj: NodeTS | LinkTS, properties: PropertyValidationRule[]): boolean {
	return properties.every(({ property, required, validation }) => {
		if (has(obj, property) ? validation(obj[property]) : !required) {
			return true;
		} else {
			console.error("property: '", property, "' of ", obj, "is invalid!");
			return false;
		}
	});
}

// checks for graph validity if a new graph is uploaded, independent of the algorithm to run
export function checkGraphForValidity(graph: GraphTS<NodeTS, LinkTS>): boolean {
	if (!(has(graph, "nodes") && Array.isArray(graph.nodes)) || !(has(graph, "edges") && Array.isArray(graph.edges))) {
		console.error("graph doesn't have nodes and edges properties");
		return false;
	}

	const nodesValid: boolean = graph.nodes.every((node: NodeTS) => validateProperties(node, nodeProperties));
	const edgesValid: boolean = graph.edges.every((edge: LinkTS) => validateProperties(edge, edgeProperties));
	if (!nodesValid || !edgesValid) {
		console.error("invalid node or edge");
		return false;
	}

	const nodeIds: Set<string> = new Set(graph.nodes.map((node: NodeTS) => node.id));
	// Each node must have a unique ID
	if (graph.nodes.length !== nodeIds.size) {
		console.error("node ids are not unique");
		return false;
	}

	for (const edge of graph.edges) {
		if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
			console.error("the edge's source or target node does not exist", edge);
			return false;
		}
	}

	return true;
}

// Infinity handling
export function f64ToJson(f: number): number | "INF" | "-INF" {
	if (f === Infinity) return "INF";
	if (f === -Infinity) return "-INF";
	return f;
}

export function jsonToF64(f: number | "INF" | "-INF"): number {
	if (f === "INF") return Infinity;
	if (f === "-INF") return -Infinity;
	return f;
}

// helper function to check if a link is contained in an array of arrays of size two (which encodes an edge list)
export function linkInEdgelist(e: LinkTS, edges: number[][], directed = false): boolean {
	const s = parseInt(e.source);
	const t = parseInt(e.target);
	if (!directed) {
		return edges.some((edge) => (edge[0] === s && edge[1] === t) || (edge[1] === s && edge[0] === t));
	} else {
		return edges.some((edge) => edge[0] === s && edge[1] === t);
	}
}

export function linkInPath(e: LinkTS, path: number[], directed = false): boolean {
	const s = parseInt(e.source);
	const t = parseInt(e.target);
	const sIndex = path.indexOf(s);
	const tIndex = path.indexOf(t);
	if (sIndex === -1 || tIndex === -1) {
		return false;
	}
	if (directed) {
		return sIndex + 1 === tIndex;
	} else {
		return sIndex + 1 === tIndex || sIndex === tIndex + 1;
	}
}

export function getEdgesAsStringArray(graph: GraphTS<NodeTS, LinkTS>): string[] {
	return graph.edges.map((edge) => `{${edge.source},${edge.target}}`);
}

export function isConnected(graphTS: GraphTS<NodeTS, LinkTS>): boolean {
	const { nodes, edges } = graphTS;
	const uf = new UnionFind(nodes.length);
	for (const edge of edges) {
		const source = parseInt(edge.source);
		const target = parseInt(edge.target);
		uf.union(source, target);
	}
	const nodeZero = parseInt(nodes[0].id);
	for (const node of nodes) {
		const id = parseInt(node.id);
		if (!uf.connected(id, nodeZero)) {
			return false;
		}
	}
	return true;
}

export function isComplete(graphTS: GraphTS<NodeTS, LinkTS>): boolean {
	const { nodes, edges } = graphTS;

	for (const currentNode of nodes) {
		for (const otherNode of nodes) {
			if (currentNode.id === otherNode.id) {
				continue;
			}
			const edgeExists = edges.some(
				(edge) =>
					(edge.source === currentNode.id && edge.target === otherNode.id) ||
					(edge.source === otherNode.id && edge.target === currentNode.id)
			);
			if (!edgeExists) {
				return false;
			}
		}
	}
	return true;
}
type NodeStyler = (node: NodeTS, layoutNode?: NodeTS) => void;
type EdgeStyler = (edge: LinkTS, layoutEdge?: LinkTS) => void;

/**
 * Applies layout (position, base styles) and algorithm-specific coloring to a graph.
 *
 * @param graph The graph to update
 * @param layoutGraph A layout-preserving graph to restore positions and styles
 * @param styleNode A function that applies algorithm-specific node styles
 * @param styleEdge A function that applies algorithm-specific edge styles
 * @returns The updated graph
 */
export function applyColorAndLayout(
	graph: GraphTS<NodeTS, LinkTS>,
	layoutGraph: GraphTS<NodeTS, LinkTS>,
	styleNode: NodeStyler,
	styleEdge: EdgeStyler
): GraphTS<NodeTS, LinkTS> {
	if (layoutGraph.nodes === undefined) {
		return graph;
	}
	// Index layout nodes and edges for quick lookup
	const layoutNodeMap = new Map(layoutGraph.nodes.map((n) => [n.id, n]));
	const layoutEdgeMap = new Map(layoutGraph.edges.map((e) => [`${e.source}-${e.target}`, e]));

	// Process edges
	graph.edges.forEach((e: LinkTS) => {
		const layoutEdge = layoutEdgeMap.get(`${e.source}-${e.target}`);
		if (layoutEdge?.style != null) {
			e.style = structuredClone(layoutEdge.style);
		}
		styleEdge(e, layoutEdge);
	});

	// Process nodes
	graph.nodes.forEach((n: NodeTS) => {
		const layoutNode = layoutNodeMap.get(n.id);
		if (layoutNode?.x !== undefined) {
			n.x = layoutNode.x;
			n.y = layoutNode.y;

			if (layoutNode.style != null) {
				n.style = {
					...structuredClone(layoutNode.style), // merge instead of overwrite

					badges: n.style?.badges ?? [], // preserve existing badges
				};
			}
		}

		styleNode(n, layoutNode);
	});

	return graph;
}

export function colorNode(node: NodeTS, color: string): void {
	node.style ??= {};
	node.style.keyshape ??= {};
	node.style.keyshape.fill = color;
	node.style.keyshape.stroke = color;
}
export function colorEdge(edge: LinkTS, color: string): void {
	edge.style ??= {};
	edge.style.keyshape ??= {};
	edge.style.keyshape.stroke = color;
}
export function highlightEdge(edge: LinkTS, color: string, enabled = true): void {
	edge.style ??= {};
	edge.style.keyshape ??= {};

	if (enabled) {
		edge.style.keyshape.shadowColor = color;
		edge.style.keyshape.shadowBlur = 20; // ↑ intensity
		edge.style.keyshape.shadowOffsetX = 0;
		edge.style.keyshape.shadowOffsetY = 0;
		edge.style.keyshape.lineWidth = 4; // boost glow
	} else {
		delete edge.style.keyshape.shadowColor;
		delete edge.style.keyshape.shadowBlur;
		delete edge.style.keyshape.shadowOffsetX;
		delete edge.style.keyshape.shadowOffsetY;
	}
}
