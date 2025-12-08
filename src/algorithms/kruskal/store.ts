import init, {
	dropState,
	getExampleGraph as getExampleGraphRS,
	getListLen,
	getPseudoCode,
	nextStep as nextStepRS,
	prevStep as prevStepRS,
	setGraph as setGraphRS,
} from "kruskal";
import { create } from "zustand";
import { GraphTS, applyColorAndLayout, colorEdge, linkInEdgelist } from "../../utils/graphs";
import { LinkTS, NodeTS, toRSGraph, toRSVisState, toTSGraph, toTSVisState } from "../adapter";
import { config, IKruskalConfig, VisualisationStateTS } from "./config";
import { IAlgorithmStore, LayoutAlgorithm, SetGraphOptions } from "../algorithm-interfaces";

function layoutVisState(state: VisualisationStateTS | null): VisualisationStateTS | null {
	if (state == null) return null;

	return { ...state, graph: state.graph };
}

export interface KruskalState extends IAlgorithmStore {
	/**
	 * Specialise types for Dijkstra
	 */
	visState: VisualisationStateTS | null;
	config: IKruskalConfig;
	getVisState: () => VisualisationStateTS | null;
	setConfig: (config: IKruskalConfig) => void;
}

export const useKruskalStore = create<KruskalState>()((set, get) => ({
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
				{ x: 40, y: 100 }, // a
				{ x: 100, y: 40 }, // b
				{ x: 100, y: 160 }, // c
				{ x: 160, y: 100 }, // d
				{ x: 220, y: 40 }, // e
				{ x: 280, y: 100 }, // f
				{ x: 220, y: 160 }, // g
			],
			1: [
				{ x: 0, y: 120 },
				{ x: 0, y: 0 },
				{ x: 100, y: 120 },
				{ x: 100, y: 240 },
				{ x: 160, y: 180 },
				{ x: 220, y: 120 },
				{ x: 220, y: 240 },
			],
		};

		const positions = positionsById[id];

		if (positions !== undefined) {
			exampleGraph.nodes.forEach((node, idx) => {
				const pos = positions[idx];
				if (pos !== undefined) {
					node.x = pos.x;
					node.y = pos.y;
					node.name = String.fromCharCode(97 + idx); // 97 = 'a'
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
	setConfig: (config: IKruskalConfig) => set({ config }),
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
		useKruskalStore.setState({
			isInitialized: true,
			pseudoCode: getPseudoCode(),
			numberOfGraphs: getListLen(),
			visState: toTSVisState(setGraphRS(toRSGraph(initialGraph), -1)) as VisualisationStateTS,
			initialGraph,
		});
	})
	.catch(() =>
		useKruskalStore.setState({
			isInitialized: false,
		})
	);

function colorAndLayoutGraph(
	state: VisualisationStateTS | null,
	colors: IKruskalConfig["colors"],
	layoutGraph: GraphTS<NodeTS, LinkTS>
): VisualisationStateTS | null {
	if (state === null) {
		return null;
	}
	state.graph = applyColorAndLayout(
		state.graph,
		layoutGraph,

		// Node styler (Kruskal doesn't do anything with them)
		(_) => {
			console.log();
		},

		// Edge styler
		(edge) => {
			edge.style ??= { keyshape: {} };
			edge.style.keyshape!.endArrow = { path: "none" };

			if (linkInEdgelist(edge, state.treeEdges)) {
				colorEdge(edge, colors.treeEdgesColor);
			} else if (linkInEdgelist(edge, state.dismissedEdges)) {
				colorEdge(edge, colors.dismissedEdgesColor);
			} else if (state.activeEdge != null && linkInEdgelist(edge, [state.activeEdge])) {
				colorEdge(edge, colors.activeEdgeColor);
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
	colors: IKruskalConfig["colors"],
	options?: SetGraphOptions
): VisualisationStateTS | null => {
	const { graphinGraph } = options ?? {};
	const rsGraph = setGraphRS(toRSGraph(graph), -1); // kruskal should not have a start node
	const visState = toTSVisState(rsGraph, graphinGraph) as VisualisationStateTS;
	return colorAndLayoutGraph(visState, colors, (graphinGraph as GraphTS<NodeTS, LinkTS>) ?? {});
};
