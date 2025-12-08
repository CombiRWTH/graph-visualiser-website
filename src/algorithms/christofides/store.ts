import init, {
	dropState,
	getExampleGraph as getExampleGraphRS,
	getListLen,
	getPseudoCode,
	nextStep as nextStepRS,
	prevStep as prevStepRS,
	setGraph as setGraphRS,
} from "christofides";
import { create } from "zustand";
import { applyColorAndLayout, colorEdge, GraphTS, linkInEdgelist } from "../../utils/graphs";
import { LinkTS, NodeTS, toRSGraph, toRSVisState, toTSGraph, toTSVisState } from "../adapter";
import { config, IChristofidesConfig, VisualisationStateTS } from "./config";
import { IAlgorithmStore, LayoutAlgorithm, SetGraphOptions } from "../algorithm-interfaces";
import { getDaisyuiColor, ThemeColor } from "../../utils/daisyui-colors";

function layoutVisState(state: VisualisationStateTS | null): VisualisationStateTS | null {
	if (state == null) return null;

	return { ...state, graph: state.graph };
}

export interface ChristofidesState extends IAlgorithmStore {
	/**
	 * Specialise types for Christofides
	 */
	visState: VisualisationStateTS | null;
	config: IChristofidesConfig;
	getVisState: () => VisualisationStateTS | null;
	setConfig: (config: IChristofidesConfig) => void;
}

const themeGreen = getDaisyuiColor(ThemeColor.SUCCESS);

export const useChristofidesStore = create<ChristofidesState>()((set, get) => ({
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
			visState: toTSVisState(nextStepRS(toRSVisState(visState!))) as VisualisationStateTS,
		})),
	prevStep: () =>
		set(({ visState }) => ({
			visState: toTSVisState(prevStepRS(toRSVisState(visState!))) as VisualisationStateTS,
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
			dropState(toRSVisState(get().visState!));
			get().setGraph(get().initialGraph);
		}
	},
	getExampleGraph: (id: number) => {
		const exampleGraph = toTSGraph(getExampleGraphRS(id), false);

		// Map graph IDs to their specific node coordinates
		const positionsById: Record<number, Array<{ x: number; y: number }>> = {
			6: [
				{ x: 257, y: 404 },
				{ x: -7, y: 399 },
				{ x: 86, y: 293 },
				{ x: 135, y: 197 },
				{ x: -18, y: 112 },
				{ x: 240, y: 239 },
				{ x: 176, y: 54 },
				{ x: 366, y: 19 },
				{ x: 312, y: 120 },
				{ x: 405, y: 146 },
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

	setLayoutAlgorithm: (layout: LayoutAlgorithm) => set({ layoutAlgorithm: layout }),

	setConfig: (config: IChristofidesConfig) => set({ config }),
	setLayoutGraph: (graph: GraphTS<NodeTS, LinkTS>) => {
		set({ layoutGraph: graph });
	},
}));

init()
	.then(() => {
		const savedGraphString = localStorage.getItem("currentGraph");
		let initialGraph = toTSGraph(getExampleGraphRS(0));
		if (savedGraphString !== null && JSON.parse(savedGraphString) !== null) {
			initialGraph = JSON.parse(savedGraphString) as GraphTS<NodeTS, LinkTS>;
		}
		useChristofidesStore.setState({
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
		useChristofidesStore.setState({
			isInitialized: false,
		})
	);

function getShortestPathWeight(graph: GraphTS<NodeTS, LinkTS>, start: string, end: string): number {
	const distances: Map<string, number> = new Map(); // (node.id, distance)
	const visited: Set<string> = new Set();
	const queue: Array<{ node: string; distance: number }> = []; // (node.id, distance)

	// Initialize distances to Infinity
	for (const node of graph.nodes) {
		distances.set(node.id, Infinity);
	}
	distances.set(start.toString(), 0);
	queue.push({ node: start, distance: 0 });

	while (queue.length > 0) {
		// Get the node with the smallest tentative distance
		queue.sort((a, b) => a.distance - b.distance);
		const current = queue.shift();
		if (current == null) break;

		const { node: u, distance: currentDistance } = current;

		if (visited.has(u)) continue;
		visited.add(u);

		if (u === end) return currentDistance;

		// Explore neighbors
		for (const link of graph.edges) {
			let neighbor: string | null = null;
			if (link.source === u.toString()) neighbor = link.target;
			else if (link.target === u.toString()) neighbor = link.source;

			if (neighbor !== null && !visited.has(neighbor)) {
				const weight = link.weight;
				const newDist = currentDistance + weight;

				if (newDist < (distances.get(neighbor) ?? Infinity)) {
					distances.set(neighbor, newDist);
					queue.push({ node: neighbor, distance: newDist });
				}
			}
		}
	}

	// No path found
	return Infinity;
}

function colorAndLayoutGraph(
	state: VisualisationStateTS | null,
	colors: IChristofidesConfig["colors"],
	layoutGraph: GraphTS<NodeTS, LinkTS>
): VisualisationStateTS | null {
	if (state === null) return null;

	// recalculating this every single time is inefficient -> maybe set hamilton cycle in store?
	const hamilton: Array<[number, number]> = [];
	for (let i = 0; i < state.hamiltonCycle.length; i++) {
		const from = state.hamiltonCycle[i];
		const to = state.hamiltonCycle[(i + 1) % state.hamiltonCycle.length];
		hamilton.push([from, to]);

		// Check if the edge exists
		const edgeExists = state.graph.edges.some(
			(link) =>
				(link.source === from.toString() && link.target === to.toString()) ||
				(link.source === to.toString() && link.target === from.toString())
		);

		if (!edgeExists) {
			// if the edge doesn't exist, we introduce a virtual edge with the weight of the shortest path between the two vertices
			// this just means we assume the complete graph with these weights
			const weight = getShortestPathWeight(state.graph, from.toString(), to.toString());

			const newEdge: LinkTS = {
				id: `${from}-${to}-virtual-edge`,
				source: from.toString(),
				target: to.toString(),
				weight,
				style: {
					keyshape: {
						type: "line",
						lineDash: [4, 4],
					},
					label: {
						value: weight,
					},
				},
			};

			// Add each edge in the shortest path to the state.graph
			state.graph.edges.push(newEdge);
		}
	}

	state.graph = applyColorAndLayout(
		state.graph,
		layoutGraph,

		// Node styler
		(node) => {
			const nodeId = parseInt(node.id);

			// Label the start node
			if (nodeId === state.startNode) {
				node.style!.label = { value: "s" };
			} else if (node.style?.label?.value === "s") {
				node.style.label = { value: node.name ?? node.id };
			}

			// Show Euler tour order as badges
			if (state.eulerTour.length > 0) {
				const label = state.eulerTour.flatMap((id, index) => (id === nodeId ? [index] : [])).join(",");
				node.style!.badges = [
					{
						position: "RT",
						type: "text",
						value: label,
						fill: themeGreen,
						size: [20, 20],
						color: "#fff",
					},
				];
			} else {
				// Clear badge if not in Euler step
				node.style!.badges = [
					{
						value: "",
						fill: "",
					},
				];
			}

			if (hamilton.length > 0) {
				// Clear badges in Hamilton step
				node.style!.badges = [
					{
						value: "",
						fill: "",
					},
				];
			}
		},

		// Edge styler
		(edge) => {
			// Remove introduced edges during Hamiltonian cycle
			if (hamilton.length > 0) {
				const isIntroduced = state.introducedEdges.some(
					([source, target]) => String(source) === edge.source && String(target) === edge.target
				);
				if (isIntroduced) {
					const index = state.graph.edges.indexOf(edge);
					if (index !== -1) {
						state.graph.edges.splice(index, 1);
						return;
					}
				}
			}

			edge.style!.keyshape!.endArrow = { path: "none" };

			// Default color
			colorEdge(edge, colors.unvisitedEdgeColor);

			// for pseudocode line 1
			if (linkInEdgelist(edge, state.minimalSpanningTree)) {
				colorEdge(edge, colors.mstEdgesColor);
			}
			// Line 2
			if (linkInEdgelist(edge, state.minimalMatching, true)) {
				colorEdge(edge, colors.mmEdgesColor);
			}
			// Line 3
			if (state.eulerTour.length > 0 && linkInEdgelist(edge, state.minimalMatching, true)) {
				colorEdge(edge, colors.mstEdgesColor);
			}
			// Line 4
			if (hamilton.length > 0 && linkInEdgelist(edge, hamilton)) {
				colorEdge(edge, colors.hamiltonEdgesColor);
			}
			if (hamilton.length > 0 && !linkInEdgelist(edge, hamilton)) {
				colorEdge(edge, colors.unvisitedEdgeColor);
			}
		}
	);

	return state;
}

const createInitialVisState = (
	graph: GraphTS<NodeTS, LinkTS>,
	colors: IChristofidesConfig["colors"],
	options?: SetGraphOptions
): VisualisationStateTS | null => {
	const { startNode, graphinGraph } = options ?? {};
	const rsGraph = setGraphRS(toRSGraph(graph), startNode ?? parseInt(graph.nodes[0].id));
	const visState = toTSVisState(rsGraph, graphinGraph) as VisualisationStateTS;
	return colorAndLayoutGraph(visState, colors, (graphinGraph as GraphTS<NodeTS, LinkTS>) ?? {});
};
