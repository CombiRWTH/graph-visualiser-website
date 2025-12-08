import { GraphinData, IUserEdge, IUserNode, Utils } from "@antv/graphin";
import { NumberOrInfinity } from "../routes/dijkstra/types";
import { BasicGraphLinkRS, BasicGraphNodeRS, GraphRS, GraphTS, f64ToJson, jsonToF64 } from "../utils/graphs";
import { infinityToUnicode } from "../utils/string-utils";
import { getDaisyuiColor, ThemeColor } from "../utils/daisyui-colors";

type GeneralNodeRS = BasicGraphNodeRS & { dist?: NumberOrInfinity };
type GeneralLinkRS = BasicGraphLinkRS & { weight: number };
export type NodeTS = IUserNode & { dist?: NumberOrInfinity; name?: string }; // one type used across different algorithms
export type LinkTS = IUserEdge & { weight: number }; // one type used across different algorithms

const themeGreen = getDaisyuiColor(ThemeColor.SUCCESS);

export interface GeneralVisualisationStateRS {
	graph: GraphRS<GeneralNodeRS, GeneralLinkRS>;
	startNode?: number;
	distance?: Record<string, number | "INF" | "-INF">;
	predecessor?: Record<string, number | null>;
}

export interface GeneralVisualisationStateTS<NumberOrInfinity> {
	graph: GraphTS<NodeTS, LinkTS>;
	startNode?: number;
	distance?: { [node: number]: NumberOrInfinity };
}

// Adapter functions

/**
 * Rust visState to TypeScript visState
 * @param visState The visualisation state received from Rust
 * @param graphinGraph Optional GraphinData used to preserve styles like node size, position, etc.
 * @returns A converted TypeScript-friendly visualisation state for the UI
 */

function toTSVisState(
	visState: GeneralVisualisationStateRS,
	graphinGraph?: GraphinData
): GeneralVisualisationStateTS<number> {
	const processedDistance =
		visState.distance !== undefined
			? Object.fromEntries(Object.entries(visState.distance).map(([k, v]) => [k, jsonToF64(v)]))
			: undefined;

	return {
		...visState,
		distance: processedDistance,
		graph: toTSGraph(
			{
				nodes: visState.graph.nodes.map((node: GeneralNodeRS) => {
					return {
						...node,
						dist:
							node.dist !== undefined
								? node.dist
								: processedDistance === undefined
									? undefined
									: processedDistance[node.id] === Infinity ||
										  processedDistance[node.id] === -Infinity
										? infinityToUnicode(processedDistance[node.id])
										: processedDistance[node.id],
					};
				}),
				links: visState.graph.links,
			},
			false, // edges are directed
			graphinGraph
		),
	};
}

/**
 * TypeScript visState to Rust visState
 * @param visState The frontend (TypeScript) visualisation state
 * @returns A converted Rust-compatible visualisation state
 */

function toRSVisState(visState: GeneralVisualisationStateTS<number>): GeneralVisualisationStateRS {
	return {
		...visState,
		distance:
			visState.distance !== undefined
				? Object.fromEntries(Object.entries(visState.distance).map(([k, v]) => [k, f64ToJson(v)]))
				: undefined,
		graph: toRSGraph(visState.graph),
	};
}

/**
 * Rust graph to TypeScript graph
 * @param graph The graph structure received from Rust
 * @param areEdgesUndirected Whether to render edges as undirected (i.e. hide arrows)
 * @param graphinData Optional GraphinData used to preserve original styles for nodes and edges
 * @returns A fully constructed TS graph with visual metadata
 */

function toTSGraph<N extends GeneralNodeRS, L extends GeneralLinkRS>(
	graph: GraphRS<N, L>,
	areEdgesUndirected?: boolean,
	graphinData?: GraphinData
): GraphTS<NodeTS, LinkTS> {
	const edgeMap = new Map<string, number>();
	graph.links.forEach((link: L) => edgeMap.set(`${link.source}-${link.target}`, link.weight));

	// Build maps for node and edge style reuse
	const graphinNodeMap = new Map<string, IUserNode>();
	graphinData?.nodes?.forEach((node) => {
		graphinNodeMap.set(String(node.id), node);
	});

	const graphinEdgeMap = new Map<string, IUserEdge>();
	graphinData?.edges?.forEach((edge) => {
		const key = `${edge.source}-${edge.target}`;
		graphinEdgeMap.set(key, edge);
	});

	const rawEdges: IUserEdge[] = graph.links.map((link: L) => {
		const source = link.source.toString();
		const target = link.target.toString();
		const edgeKey = `${source}-${target}`;
		const graphinEdge = graphinEdgeMap.get(edgeKey);

		return {
			source,
			target,
			style: {
				...(graphinEdge?.style ?? {
					label: { value: link.weight.toString() },
					keyshape: {
						...(areEdgesUndirected !== false ? { endArrow: { path: "none" } } : {}),
					},
				}),
			},
		};
	});
	const processedEdges: IUserEdge[] = Utils.processEdges(rawEdges);
	return {
		nodes: graph.nodes.map((node: N) => {
			const nodeIdStr = node.id.toString();
			const graphinNode = graphinNodeMap.get(nodeIdStr);

			return {
				...node,
				id: nodeIdStr,
				name: node.name ?? nodeIdStr,
				dist: node.dist === Infinity || node.dist === -Infinity ? infinityToUnicode(node.dist) : node.dist,
				style: {
					...(graphinNode?.style ?? {
						label: {
							value: node.name,
						},
					}),
					badges:
						node.dist !== undefined
							? [
									{
										position: "RT",
										type: "text",
										value: node.dist,
										fill: themeGreen,
										size: [20, 20],
										color: "#fff",
									},
								]
							: undefined,
				},
			};
		}),
		edges: processedEdges.map((edge) => ({
			...edge,
			weight: edgeMap.get(`${edge.source}-${edge.target}`)!,
		})),
		description: graph.description,
	};
}
/**
 * TypeScript graph to Rust graph
 * @param graph The graph from the UI, including positions and styles
 * @returns A backend-compatible graph, with styling stripped and values converted
 */
function toRSGraph<N extends NodeTS, L extends LinkTS>(graph: GraphTS<N, L>): GraphRS<GeneralNodeRS, GeneralLinkRS> {
	return {
		nodes: graph.nodes.map((node: N) => ({
			id: parseInt(node.id),
			name: node.name ?? node.id.toString(),
		})),
		links: graph.edges.map((link: L) => ({
			...link,
			source: parseInt(link.source),
			target: parseInt(link.target),
			weight: link.weight ?? Number.parseInt(link.style?.label?.value as string),
		})),
	};
}

export { toRSGraph, toRSVisState, toTSGraph, toTSVisState };
