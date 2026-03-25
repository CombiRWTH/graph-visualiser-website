import init, {
	dropState,
	getExampleGraph as getExampleGraphRS,
	getListLen,
	getPseudoCode,
	nextStep as nextStepRS,
	prevStep as prevStepRS,
	setGraph as setGraphRS,
} from "dijkstra";
import { create } from "zustand";
import { LinkTS, NodeTS, toRSGraph, toRSVisState, toTSGraph, toTSVisState } from "../adapter";
import { config, IDijkstraConfig, VisualisationStateTS } from "./config";
import { GraphTS, applyColorAndLayout, colorEdge, colorNode, linkInEdgelist } from "../../utils/graphs";
import { IAlgorithmStore, LayoutAlgorithm, SetGraphOptions } from "../algorithm-interfaces";

function layoutVisState(state: VisualisationStateTS | null): VisualisationStateTS | null {
	if (state == null) return null;

	return { ...state, graph: state.graph };
}

interface DijkstraState extends IAlgorithmStore {
	/**
	 * Specialise types for Dijkstra
	 */
	visState: VisualisationStateTS | null;
	config: IDijkstraConfig;
	getVisState: () => VisualisationStateTS | null;
	setConfig: (config: IDijkstraConfig) => void;
}

/**
 * Mirrors backend state as zustand store. It will automatically update react components when values change.
 * At the same time it provides a way to notify the backend state about frontend activities.
 */
export const useDijkstraStore = create<DijkstraState>()((set, get) => ({
	isInitialized: false,
	pseudoCode: null,
	visState: null,
	initialGraph: { nodes: [], edges: [] },
	layoutGraph: { nodes: [], edges: [] },
	numberOfGraphs: 0,
	config,
	getVisState: () => colorAndLayoutGraph(get().visState, get().config.colors, get().layoutGraph),
	nextStep: () => {
		set(({ visState }) => ({
			visState: toTSVisState(nextStepRS(toRSVisState(visState!)), get().layoutGraph) as VisualisationStateTS,
		}));
	},
	prevStep: () =>
		set(({ visState }) => ({
			visState: toTSVisState(prevStepRS(toRSVisState(visState!)), get().layoutGraph) as VisualisationStateTS,
		})),
	setLayoutGraph: (graph: GraphTS<NodeTS, LinkTS>) => {
		set({ layoutGraph: graph });
	},
	setGraph: (graph: GraphTS<NodeTS, LinkTS>, options?: SetGraphOptions) => {
		const initialVisState = createInitialVisState(graph, get().config.colors, options);
		set({ initialGraph: initialVisState!.graph, visState: initialVisState });
	},
	setNewGraph: (graph: GraphTS<NodeTS, LinkTS>, options?: SetGraphOptions) => {
		const initialVisState = createInitialVisState(graph, get().config.colors, options);
		set({ initialGraph: initialVisState!.graph, layoutGraph: initialVisState!.graph, visState: initialVisState });
	},
	// Calling the backend function set_graph here resets everything, graph, visualization state, line of code.
	resetGraph: () => {
		dropState(toRSVisState(get().visState!));
		get().setGraph(get().initialGraph);
	},
	getExampleGraph: (id: number) => {
		const exampleGraph = toTSGraph(getExampleGraphRS(id), false);

		// Map graph IDs to their specific node coordinates
		const positionsById: Record<number, Array<{ x: number; y: number }>> = {
			0: [
				{ x: 40, y: 100 },
				{ x: 100, y: 40 },
				{ x: 100, y: 160 },
				{ x: 220, y: 40 },
				{ x: 220, y: 160 },
				{ x: 280, y: 100 },
			],
			7: [
				{ x: 170, y: 320 }, // s
				{ x: 300, y: 320 }, // 1
				{ x: 40, y: 320 }, // 2
				{ x: 40, y: 180 }, // 3
				{ x: 300, y: 180 }, // 4
				{ x: 40, y: 40 }, // 5
				{ x: 300, y: 40 }, // 6
			],
		};

		const positions = positionsById[id];

		if (positions !== undefined) {
			exampleGraph.nodes.forEach((node, idx) => {
				const pos = positions[idx];
				if (pos !== undefined) {
					node.x = pos.x;
					node.y = pos.y;
				}
			});
		}
		const graphString = JSON.stringify(exampleGraph);
		localStorage.setItem("currentGraph", graphString);
		return exampleGraph;
	},

	layoutAlgorithm: LayoutAlgorithm.Circle,
	applyLayout: (layout: LayoutAlgorithm) =>
		set(({ visState }) => ({ visState: layoutVisState(visState), layoutAlgorithm: layout })),
	setConfig: (config: IDijkstraConfig) => set({ config }),
	setLayoutAlgorithm: (layout: LayoutAlgorithm) => set({ layoutAlgorithm: layout }),
}));

init()
	.then(() => {
		const savedGraphString = localStorage.getItem("currentGraph");
		let initialGraph = toTSGraph(getExampleGraphRS(0));
		if (savedGraphString !== null && JSON.parse(savedGraphString) !== null) {
			initialGraph = JSON.parse(savedGraphString) as GraphTS<NodeTS, LinkTS>;
		}
		useDijkstraStore.setState({
			isInitialized: true,
			pseudoCode: getPseudoCode(),
			numberOfGraphs: getListLen(),
			visState: toTSVisState(
				setGraphRS(toRSGraph(initialGraph), parseInt(initialGraph.nodes[0].id))
			) as VisualisationStateTS,
			initialGraph,
		});
	})
	.catch(() =>
		useDijkstraStore.setState({
			isInitialized: false,
		})
	);

/**
 * Applies algorithm-specific colors and re-applies layout-based styles to the graph's nodes and edges.
 *
 * This function is responsible for:
 * 1. Restoring node and edge styles from a given layout graph (used for preserving layout-related styling such as positions, badges, etc.).
 * 2. Overriding visual styles based on algorithm state — including visited nodes, active nodes, and highlighted edges like the shortest path.
 * 3. Updating node labels to mark the start node.
 *
 * Behavior:
 * - Nodes will inherit their layout styles, but their fill and stroke colors will be overwritten based on their algorithm state.
 * - Edges will inherit their layout styles, but the stroke color is conditionally set based on whether the edge is part of:
 *   - The shortest path
 *   - The set of used or active edges
 *   - None of the above, in which case the default edge color is applied
 *
 * This function assumes that edges can be matched using their `source` and `target` fields
 * and that layout edges are stored in a `Map` using a key format of "source-target".
 *
 * @param state - The current visualisation state (may be null).
 * @param colors - A set of color values used to style the graph based on algorithm state.
 * @param layoutGraph - A graph snapshot used to restore original layout styles.
 * @returns The updated visualisation state with colors and layout styling applied.
 */

function colorAndLayoutGraph(
	state: VisualisationStateTS | null,
	colors: IDijkstraConfig["colors"],
	layoutGraph: GraphTS<NodeTS, LinkTS>
): VisualisationStateTS | null {
	if (state === null) return null;

	state.graph = applyColorAndLayout(
		state.graph,
		layoutGraph,

		// Node styler
		(node) => {
			const nodeId = parseInt(node.id);
			const isVisited = state.visitedNodes.includes(nodeId);
			const isActive = state.activeNode === nodeId;

			if (isVisited) {
				colorNode(node, colors.visitedNodeColor);
			} else if (isActive) {
				colorNode(node, colors.activeNodeColor);
			} else {
				const fallback =
					typeof node.style?.keyshape?.fill === "string" && node.style.keyshape.fill !== ""
						? node.style.keyshape.fill
						: colors.unvisitedNodeColor;

				colorNode(node, fallback);
			}

			// Label if it's the start node
			if (nodeId === state.startNode) {
				node.style!.label = { value: "s" };
			} else if (node.style?.label?.value === "s") {
				node.style.label = { value: node.name ?? node.id };
			}
		},

		// Edge styler
		(edge) => {
			if (state.shortestPath != null && linkInEdgelist(edge, state.shortestPath, true)) {
				colorEdge(edge, colors.shortestPathColor);
			} else if (linkInEdgelist(edge, state.usedEdges, true)) {
				colorEdge(edge, colors.usedEdgeColor);
			} else if (linkInEdgelist(edge, state.activeEdges, true)) {
				colorEdge(edge, colors.activeEdgeColor);
			} else {
				const fallback =
					edge.style?.keyshape?.stroke !== undefined ? edge.style.keyshape.stroke : colors.defaultEdgeColor;
				colorEdge(edge, fallback);
			}
		}
	);

	return state;
}

const createInitialVisState = (
	graph: GraphTS<NodeTS, LinkTS>,
	colors: IDijkstraConfig["colors"],
	options?: SetGraphOptions
): VisualisationStateTS | null => {
	const { startNode, graphinGraph } = options ?? {};
	const rsGraph = setGraphRS(toRSGraph(graph), startNode ?? parseInt(graph.nodes[0].id));
	const visState = toTSVisState(rsGraph, graphinGraph) as VisualisationStateTS;
	return colorAndLayoutGraph(visState, colors, (graphinGraph as GraphTS<NodeTS, LinkTS>) ?? {});
};
