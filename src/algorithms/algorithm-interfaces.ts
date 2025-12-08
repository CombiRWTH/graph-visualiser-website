import { VisualisationStateTS as VisStatePrim } from "./prim/config";
import { VisualisationStateTS as VisStateDijkstra } from "./dijkstra/config";
import { VisualisationStateTS as VisStateKruskal } from "./kruskal/config";
import { VisualisationStateTS as VisStateChristofides } from "./christofides/config";
import { VisualisationStateTS as VisStateFordFulkerson } from "./ford_fulkerson/config";
import { VisualisationStateTS as VisStateMbf } from "./mbf/config";
import { VisualisationStateTS as VisStateDinic } from "./dinic/config";
import { PseudocodeDescription } from "./pseudocode";
import { GraphinData, GraphinProps } from "@antv/graphin";
import { GraphTS } from "../utils/graphs";
import { LinkTS, NodeTS } from "./adapter";
import { JsonValue } from "type-fest";

export interface IVisualisationState {
	lineOfCode?: number;
	variables: { [variable: string]: JsonValue };
	helptext: string;
}

export interface SetGraphOptions {
	startNode?: number;
	graphinGraph?: GraphinData;
}

/**
 * Used by the frontend (AlgorithmPage & GraphPage) to communicate with the backend
 */
export interface IAlgorithmStore {
	/**
	 * Raw visualisation state, adheres to the backend implementation of visualisation states.
	 * This variable should never be used directly in frontend code, please use `getVisState` instead.
	 */
	visState:
		| VisStateDinic
		| VisStateFordFulkerson
		| VisStatePrim
		| VisStateDijkstra
		| VisStateKruskal
		| VisStateChristofides
		| VisStateMbf
		| null;
	/**
	 * Yields visualisation state
	 * @returns VisualisationState
	 */
	getVisState: () =>
		| VisStateDinic
		| VisStatePrim
		| VisStateDijkstra
		| VisStateKruskal
		| VisStateChristofides
		| VisStateFordFulkerson
		| VisStateMbf
		| null;
	nextStep: () => void;
	prevStep: () => void;
	/**
	 * Last graph that was given to the hook, used to revert calculation steps.
	 */
	initialGraph: GraphTS<NodeTS, LinkTS>;
	pseudoCode: PseudocodeDescription | null;
	isInitialized: boolean;
	/**
	 * Holds information about visuals, i.e. edge colors.
	 */
	config: IConfig;
	/**
	 * Sets the graph to execute the algorithm on. It will also affect `initialGraph`.
	 *
	 * @param graph The typed graph object to forward to the backend.
	 * @param options Optional settings:
	 *  - `startNode`: The node ID to use as the starting point for the algorithm.
	 *  - `graphinGraph`: The original Graphin graph used to preserve layout or styling information.
	 */
	setGraph: (graph: GraphTS<NodeTS, LinkTS>, options?: SetGraphOptions) => void;

	/**
	 * Replaces the graph entirely, without applying any previous layout or style information.
	 * Also saves the initial graph as LayoutGraph to save the layout for the next steps
	 *
	 * @param graph The typed graph object to forward to the backend.
	 * @param options Optional settings:
	 *  - `startNode`: The node ID to use as the starting point for the algorithm.
	 *  - `graphinGraph`: The original Graphin graph used to apply layout or styling information.
	 */
	setNewGraph: (graph: GraphTS<NodeTS, LinkTS>, options?: SetGraphOptions) => void;

	/**
	 * Get an example graph from the backend
	 * @param id ID of graph to retrieve
	 * @returns selected example graph
	 */
	getExampleGraph: (id: number) => GraphTS<NodeTS, LinkTS>;
	/**
	 * updates the configuration for this algorithm, e.g. to update colors
	 * @param config Configuration to be applied
	 */
	setConfig: (config: IConfig) => void;
	/**
	 * Graph containing layout and style information
	 */
	layoutGraph: GraphTS<NodeTS, LinkTS>;

	/**
	 * Sets the graph to execute the algorithm on. It will also affect `initialGraph`.
	 * @param graph Graph to set in frontend
	 */
	setLayoutGraph: (graph: GraphTS<NodeTS, LinkTS>) => void;
	layoutAlgorithm: LayoutAlgorithm;
	applyLayout: (layout: LayoutAlgorithm) => void;

	resetGraph: () => void;
	numberOfGraphs: number;
	setLayoutAlgorithm: (layout: LayoutAlgorithm) => void;
	switchBetweenGraphs?: () => void;
	resGraphActive?: boolean;
}

export interface IConfig extends Partial<GraphinProps> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	colors: any;
}

export interface IGraphGeneratorOptions {
	weightRange: [number, number];
	radius: number;
	center: [number, number];
	connected: boolean;
	complete: boolean;
	directed: boolean;
	minimumVertexDegree: number;
	minNodes: number;
	maxNodes: number;
	density: number;
	allowSelfLoops?: boolean;
	negativeEdgeWeightsAllowed: boolean;
}

export interface ILayoutAlgorithm {
	type: string;
	options: NonNullable<unknown>;
}

export enum LayoutAlgorithm {
	Circle = "Circle",
	Force = "Force",
	Grid = "Grid",
	Free = "Free",
	Dagre = "Dagre",
}
