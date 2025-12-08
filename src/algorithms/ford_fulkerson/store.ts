import init, {
	dropState,
	getExampleGraph as getExampleGraphRS,
	getListLen,
	getPseudoCode,
	nextStep as nextStepRS,
	prevStep as prevStepRS,
	setGraph as setGraphRS,
} from "ford_fulkerson";
import { create } from "zustand";
import { applyColorAndLayout, colorEdge, GraphTS } from "../../utils/graphs";
import { LinkTS, NodeTS, toRSGraph, toRSVisState, toTSGraph, toTSVisState } from "../adapter";
import { config, IFordFulkersonConfig, VisualisationStateRS, VisualisationStateTS } from "./config";
import { IAlgorithmStore, LayoutAlgorithm, SetGraphOptions } from "../algorithm-interfaces";

function layoutVisState(state: VisualisationStateTS | null): VisualisationStateTS | null {
	if (state == null) return null;

	return { ...state, graph: state.graph };
}

export interface FordFulkersonState extends IAlgorithmStore {
	/**
	 * Specialise types for FordFulkerson
	 */
	visState: VisualisationStateTS | null;
	config: IFordFulkersonConfig;
	getVisState: () => VisualisationStateTS | null;
	setConfig: (config: IFordFulkersonConfig) => void;
	resGraphActive: boolean;
}

export const useFordFulkersonStore = create<FordFulkersonState>()((set, get) => ({
	isInitialized: false,
	pseudoCode: null,
	visState: null,
	initialGraph: { nodes: [], edges: [] },
	layoutGraph: { nodes: [], edges: [] },
	numberOfGraphs: 0,
	config,
	getVisState: () => {
		const state = get();
		const visState = state.visState;

		if (visState == null) return null;

		// If residual graph is active, swap them before passing to layout function
		const activeVisState =
			state.resGraphActive && visState.residualGraph.edges !== undefined
				? {
						...visState,
						graph: visState.residualGraph,
						residualGraph: visState.graph,
					}
				: visState;

		return colorAndLayoutGraph(activeVisState, state.config.colors, state.layoutGraph, get().resGraphActive);
	},
	nextStep: () =>
		set(({ visState }) => ({
			visState: buildFFVisState(nextStepRS(buildFFRSVisState(visState!))) as VisualisationStateTS,
		})),
	prevStep: () =>
		set(({ visState }) => ({
			visState: buildFFVisState(prevStepRS(buildFFRSVisState(visState!))) as VisualisationStateTS,
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
		if (get().visState?.graph !== get().initialGraph) {
			dropState(buildFFRSVisState(get().visState!));
			get().setGraph(get().initialGraph);
		}
	},
	getExampleGraph: (id: number) => {
		const exampleGraph = toTSGraph(getExampleGraphRS(id), false);

		// Map graph IDs to their specific node coordinates
		const positionsById: Record<number, Array<{ x: number; y: number }>> = {
			0: [
				{ x: -20, y: 100 }, // s
				{ x: 80, y: 0 }, // a
				{ x: 80, y: 200 }, // b
				{ x: 220, y: 0 }, // c
				{ x: 220, y: 200 }, // d
				{ x: 150, y: 70 }, // e
				{ x: 320, y: 100 }, // t
			],
			1: [
				{ x: -100, y: 100 }, // s
				{ x: 0, y: 100 }, // a
				{ x: 100, y: 100 }, // t
			],
			2: [
				{ x: -20, y: 100 }, // s
				{ x: 150, y: 0 }, // a
				{ x: 150, y: 200 }, // b
				{ x: 320, y: 100 }, // t
			],
			3: [
				{ x: -20, y: 100 }, // s
				{ x: 150, y: 0 }, // a
				{ x: 150, y: 200 }, // b
				{ x: 320, y: 100 }, // t
			],
			4: [
				{ x: -20, y: 100 }, // s
				{ x: 150, y: 0 }, // a
				{ x: 150, y: 200 }, // b
				{ x: 320, y: 100 }, // t
			],
			5: [
				{ x: -20, y: 100 }, // s
				{ x: 150, y: 0 }, // a
				{ x: 150, y: 200 }, // b
				{ x: 320, y: 100 }, // t
			],
			6: [
				{ x: -20, y: 100 }, // s
				{ x: 80, y: 0 }, // a
				{ x: 80, y: 200 }, // b
				{ x: 220, y: 0 }, // c
				{ x: 220, y: 200 }, // d
				{ x: 320, y: 100 }, // t
			],
			7: [
				{ x: -20, y: 100 }, // s
				{ x: 80, y: 0 }, // a
				{ x: 80, y: 200 }, // b
				{ x: 220, y: 0 }, // c
				{ x: 220, y: 200 }, // d
				{ x: 320, y: 100 }, // t
			],
			8: [
				{ x: -20, y: 100 }, // s
				{ x: 80, y: 0 }, // a
				{ x: 80, y: 200 }, // b
				{ x: 220, y: 0 }, // c
				{ x: 220, y: 200 }, // d
				{ x: 320, y: 100 }, // t
			],
		};
		const positions = positionsById[id];

		if (positions !== undefined) {
			exampleGraph.nodes.forEach((node, idx) => {
				const pos = positions[idx];
				if (pos !== undefined) {
					node.x = pos.x;
					node.y = pos.y;
					node.name = String.fromCharCode(96 + idx); // 97 = 'a'
					if (idx === 0) {
						node.name = "s";
					}
					if (idx === 6) {
						node.name = "t";
					}
				}
			});
		}
		const graphString = JSON.stringify(exampleGraph);
		localStorage.setItem("currentGraph", graphString);
		return exampleGraph;
	},
	layoutAlgorithm: LayoutAlgorithm.Circle, // dagre for future maybe
	applyLayout: (layout: LayoutAlgorithm) =>
		set(({ visState }) => ({ visState: layoutVisState(visState), layoutAlgorithm: layout })),

	setLayoutAlgorithm: (layout: LayoutAlgorithm) => set({ layoutAlgorithm: layout }),

	setConfig: (config: IFordFulkersonConfig) => set({ config }),
	setLayoutGraph: (graph: GraphTS<NodeTS, LinkTS>) => {
		set({ layoutGraph: graph });
	},
	switchBetweenGraphs: () => {
		set({ resGraphActive: !get().resGraphActive });
	},
	resGraphActive: false,
}));

init()
	.then(() => {
		const savedGraphString = localStorage.getItem("currentGraph");
		let initialGraph = toTSGraph(getExampleGraphRS(0));
		if (savedGraphString !== null && JSON.parse(savedGraphString) !== null) {
			initialGraph = JSON.parse(savedGraphString) as GraphTS<NodeTS, LinkTS>;
		}
		useFordFulkersonStore.setState({
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
		useFordFulkersonStore.setState({
			isInitialized: false,
		})
	);

function keyLinkToString(a: string, b: string): string {
	return "(" + a.toString() + "," + b.toString() + ")";
}

export function colorAndLayoutGraph(
	state: VisualisationStateTS | null,
	colors: IFordFulkersonConfig["colors"],
	layoutGraph: GraphTS<NodeTS, LinkTS>,
	resGraphActive?: boolean
): VisualisationStateTS | null {
	if (state === null) return null;

	state.graph = applyColorAndLayout(
		state.graph,
		layoutGraph,

		// Node styler
		(node) => {
			const nodeId = parseInt(node.id);

			// Label the source node
			if (nodeId === state.sourceNode) {
				node.style!.label = { value: "s" };
				node.name = "s";
			}
			if (nodeId === state.targetNode) {
				node.style!.label = { value: "t" };
				node.name = "t";
			}
		},

		// Edge styler
		(edge) => {
			// Default color
			colorEdge(edge, colors.unvisitedEdgeColor);

			// Color edges in augmenting path
			if (resGraphActive === true) {
				for (let i = 0; i < state.augmentedPath.length - 1; i++) {
					const from = state.augmentedPath[i].toString();
					const to = state.augmentedPath[i + 1].toString();

					// Match direction
					if (from === edge.source && to === edge.target) {
						colorEdge(edge, colors.augmentedPathColor);
					}
					if (edge.style?.keyshape?.endArrow !== undefined) {
						delete edge.style.keyshape.endArrow;
					}
				}
				edge.style!.label = { value: edge.weight.toString() };
			} else {
				const flow = state.flow[keyLinkToString(edge.source, edge.target)];
				if (flow !== undefined && flow > 0) {
					edge.style!.label = { value: flow.toString() + "/" + edge.weight.toString() };
					colorEdge(edge, colors.flowColor);
				}
			}
			// sometimes this randomly is defined TODO find out why
			if (edge.style?.keyshape?.endArrow !== undefined) {
				delete edge.style.keyshape.endArrow;
			}
		}
	);

	return state;
}

export const createInitialVisState = (
	graph: GraphTS<NodeTS, LinkTS>,
	colors: IFordFulkersonConfig["colors"],
	options?: SetGraphOptions
): VisualisationStateTS | null => {
	const { startNode, graphinGraph } = options ?? {};
	const rsGraph = setGraphRS(toRSGraph(graph), startNode ?? parseInt(graph.nodes[0].id));
	const visState = toTSVisState(rsGraph, graphinGraph) as VisualisationStateTS;
	return colorAndLayoutGraph(visState, colors, (graphinGraph as GraphTS<NodeTS, LinkTS>) ?? {});
};

export const buildFFVisState = (visState: VisualisationStateRS): VisualisationStateTS | null => {
	const tsVisState = toTSVisState(visState) as VisualisationStateTS;

	tsVisState.residualGraph = toTSGraph(visState.residualGraph);

	return tsVisState;
};

export function buildFFRSVisState(visState: VisualisationStateTS): VisualisationStateRS {
	const rsVisState = toRSVisState(visState) as VisualisationStateRS;
	if (visState.residualGraph.edges !== undefined) {
		rsVisState.residualGraph = toRSGraph(visState.residualGraph);
	}
	return rsVisState;
}
