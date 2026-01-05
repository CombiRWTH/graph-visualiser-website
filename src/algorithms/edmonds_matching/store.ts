import init, {
	dropState,
	getExampleGraph as getExampleGraphRS,
	getListLen,
	getPseudoCode,
	nextStep as nextStepRS,
	prevStep as prevStepRS,
	setGraph as setGraphRS,
} from "edmonds_matching";
import { create } from "zustand";
import {
	GraphTS,
	applyColorAndLayout,
	colorEdge,
	colorNode,
	highlightEdge,
	linkInEdgelist,
	linkInPath,
} from "../../utils/graphs";
import { LinkTS, NodeTS, toRSGraph, toRSVisState, toTSGraph, toTSVisState } from "../adapter";
import { config, IEdmondsConfig, VisualisationStateTS } from "./config";
import { IAlgorithmStore, LayoutAlgorithm, SetGraphOptions } from "../algorithm-interfaces";

function layoutVisState(state: VisualisationStateTS | null): VisualisationStateTS | null {
	if (state === null) return null;

	return { ...state, graph: state.graph };
}

export interface EdmondsState extends IAlgorithmStore {
	/**
	 * Specialise types for EdmondsMatching
	 */
	visState: VisualisationStateTS | null;
	config: IEdmondsConfig;
	getVisState: () => VisualisationStateTS | null;
	setConfig: (config: IEdmondsConfig) => void;
}

export const useEdmondsStore = create<EdmondsState>()((set, get) => ({
	isInitialized: false,
	pseudoCode: null,
	visState: null,
	initialGraph: { nodes: [], edges: [] },
	layoutGraph: { nodes: [], edges: [] },
	numberOfGraphs: 0,
	config,
	getVisState: () => colorAndLayoutGraph(get().visState, get().config.colors, get().layoutGraph),
	nextStep: () =>
		set(({ visState }) => ({
			visState: toTSVisState(nextStepRS(toRSVisState(visState!)), get().layoutGraph) as VisualisationStateTS,
		})),
	prevStep: () =>
		set(({ visState }) => ({
			visState: toTSVisState(prevStepRS(toRSVisState(visState!)), get().layoutGraph) as VisualisationStateTS,
		})),
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
				{ x: 80, y: 200 }, // 1
				{ x: 200, y: 120 }, // 2
				{ x: 200, y: 280 }, // 3
				{ x: 360, y: 120 }, // 4
				{ x: 360, y: 280 }, // 5
				{ x: 520, y: 120 }, // 6
				{ x: 520, y: 240 }, // 7
				{ x: 520, y: 360 }, // 8
				{ x: 680, y: 120 }, // 9
				{ x: 680, y: 280 }, // 10
				{ x: 840, y: 360 }, // 11
			],
			1: [
				{ x: 80, y: 200 }, // 1
				{ x: 200, y: 120 }, // 2
				{ x: 200, y: 280 }, // 3
				{ x: 360, y: 120 }, // 4
				{ x: 360, y: 280 }, // 5
				{ x: 360, y: 440 }, // 6
				{ x: 520, y: 280 }, // 7
				{ x: 520, y: 440 }, // 8
				{ x: 640, y: 280 }, // 9
				{ x: 640, y: 360 }, // 10
				{ x: 640, y: 440 }, // 11
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
	setConfig: (config: IEdmondsConfig) => set({ config }),
	setLayoutGraph: (graph: GraphTS<NodeTS, LinkTS>) => {
		set({ layoutGraph: graph });
	},
	setLayoutAlgorithm: (layout: LayoutAlgorithm) => set({ layoutAlgorithm: layout }),
}));

init()
	.then(() => {
		const savedGraphString = localStorage.getItem("currentGraph");
		let initialGraph = toTSGraph(getExampleGraphRS(0));
		if (savedGraphString !== null && JSON.parse(savedGraphString) !== null) {
			initialGraph = JSON.parse(savedGraphString) as GraphTS<NodeTS, LinkTS>;
		}
		useEdmondsStore.setState({
			isInitialized: true,
			pseudoCode: getPseudoCode(),
			numberOfGraphs: getListLen(),
			visState: toTSVisState(setGraphRS(toRSGraph(initialGraph), -1)) as VisualisationStateTS,
			initialGraph,
		});
	})
	.catch(() =>
		useEdmondsStore.setState({
			isInitialized: false,
		})
	);

function colorAndLayoutGraph(
	state: VisualisationStateTS | null,
	colors: IEdmondsConfig["colors"],
	layoutGraph: GraphTS<NodeTS, LinkTS>
): VisualisationStateTS | null {
	if (state === null) {
		return null;
	}
	state.graph = applyColorAndLayout(
		state.graph,
		layoutGraph,

		// Node styler (Edmonds doesn't do anything with them)
		(node) => {
			const nodeId = parseInt(node.id);

			if (state.blossomNodes.includes(nodeId)) {
				colorNode(node, colors.blossomNodeColor);
			} else if (
				state.treeRoot === nodeId &&
				(state.lineOfCode === 1 || state.lineOfCode === 2 || state.lineOfCode === 3 || state.lineOfCode === 7)
			) {
				colorNode(node, colors.treeHighlightColor);
			} else {
				const fallback =
					typeof node.style?.keyshape?.fill === "string" && node.style.keyshape.fill !== ""
						? node.style.keyshape.fill
						: colors.unvisitedEdgeColor;

				colorNode(node, fallback);
			}

			// Label if it's a blossom node
			const name = `bl.${nodeId}`;

			if (state.blossomNodes.includes(nodeId)) {
				node.style!.label = { value: name };
			} else if (node.style?.label?.value === name) {
				node.style.label = { value: node.name ?? node.id };
			}
		},

		// Edge styler
		(edge) => {
			edge.style ??= { keyshape: {} };
			edge.style.keyshape!.endArrow = { path: "none" };
			edge.style.label = { value: "" };

			if (
				linkInEdgelist(edge, state.treeEdges) &&
				(state.lineOfCode === 2 || state.lineOfCode === 3 || state.lineOfCode === 7)
			) {
				highlightEdge(edge, colors.treeHighlightColor);
			}
			if (linkInPath(edge, state.augmentingPath) && (state.lineOfCode === 4 || state.lineOfCode === 5)) {
				highlightEdge(edge, colors.augmentingPathColor);
			}
			if (linkInEdgelist(edge, state.matching)) {
				colorEdge(edge, colors.matchingColor);
			} else {
				const fallback =
					edge.style.keyshape?.stroke !== undefined ? edge.style.keyshape.stroke : colors.unvisitedEdgeColor;
				colorEdge(edge, fallback);
			}
		}
	);
	return state;
}

const createInitialVisState = (
	graph: GraphTS<NodeTS, LinkTS>,
	colors: IEdmondsConfig["colors"],
	options?: SetGraphOptions
): VisualisationStateTS | null => {
	const { graphinGraph } = options ?? {};
	const rsGraph = setGraphRS(toRSGraph(graph), -1); // Edmonds should not have a start node
	const visState = toTSVisState(rsGraph, graphinGraph) as VisualisationStateTS;
	return colorAndLayoutGraph(visState, colors, (graphinGraph as GraphTS<NodeTS, LinkTS>) ?? {});
};
