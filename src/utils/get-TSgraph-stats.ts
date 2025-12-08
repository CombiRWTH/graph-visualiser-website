import { GraphTS } from "./graphs";
import { LinkTS, NodeTS } from "../algorithms/adapter";

interface GraphStats {
	numNodes: number;
	numEdges: number;
	avgDegree: number;
	avgInDegree?: number;
	avgOutDegree?: number;
	maxInDegree?: number;
	maxOutDegree?: number;
	maxDegree?: number;
	isolatedNodes: number;
	leafNodes: number;
	density: number;
}

export function getGraphStats(graph: GraphTS<NodeTS, LinkTS>, isDirected: boolean): GraphStats {
	const numNodes = graph.nodes.length;
	const numEdges = graph.edges.length;

	const inDegrees = new Map<string, number>();
	const outDegrees = new Map<string, number>();

	for (const node of graph.nodes) {
		inDegrees.set(node.id, 0);
		outDegrees.set(node.id, 0);
	}

	for (const edge of graph.edges) {
		outDegrees.set(edge.source, (outDegrees.get(edge.source) ?? 0) + 1);
		inDegrees.set(edge.target, (inDegrees.get(edge.target) ?? 0) + 1);

		if (!isDirected) {
			outDegrees.set(edge.target, (outDegrees.get(edge.target) ?? 0) + 1);
			inDegrees.set(edge.source, (inDegrees.get(edge.source) ?? 0) + 1);
		}
	}

	const degrees = new Map<string, number>();
	for (const node of graph.nodes) {
		const inDeg = inDegrees.get(node.id) ?? 0;
		const outDeg = outDegrees.get(node.id) ?? 0;
		degrees.set(node.id, inDeg + outDeg);
	}

	const degreeValues = Array.from(degrees.values());
	const inDegreeValues = Array.from(inDegrees.values());
	const outDegreeValues = Array.from(outDegrees.values());

	const totalDegree = degreeValues.reduce((a, b) => a + b, 0);
	const maxDegree = degreeValues.length > 0 ? Math.max(...degreeValues) : 0;
	const maxInDegree = inDegreeValues.length > 0 ? Math.max(...inDegreeValues) : 0;
	const maxOutDegree = outDegreeValues.length > 0 ? Math.max(...outDegreeValues) : 0;

	const isolatedNodes = degreeValues.filter((d) => d === 0).length;
	const leafNodes = degreeValues.filter((d) => d === 1).length;

	const avgDegree = numNodes > 0 ? totalDegree / numNodes : 0;
	const avgInDegree = isDirected ? (numNodes > 0 ? numEdges / numNodes : 0) : undefined;
	const avgOutDegree = isDirected ? (numNodes > 0 ? numEdges / numNodes : 0) : undefined;

	const maxPossibleEdges = isDirected ? numNodes * (numNodes - 1) : (numNodes * (numNodes - 1)) / 2;

	const density = maxPossibleEdges > 0 ? numEdges / maxPossibleEdges : 0;

	return {
		numNodes,
		numEdges,
		avgDegree,
		avgInDegree,
		avgOutDegree,
		maxInDegree: isDirected ? maxInDegree : undefined,
		maxOutDegree: isDirected ? maxOutDegree : undefined,
		maxDegree,
		isolatedNodes,
		leafNodes,
		density,
	};
}
