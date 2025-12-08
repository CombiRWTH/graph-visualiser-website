import { BasicGraphLinkRS, BasicGraphNodeRS, GraphRS, GraphTS } from "../../utils/graphs";
import { IGraphGeneratorOptions, IVisualisationState } from "../algorithm-interfaces";
import { LinkTS, NodeTS } from "../adapter";
import { getDaisyuiColor, ThemeColor } from "../../utils/daisyui-colors";

export type DijkstraNodeRS = BasicGraphNodeRS & { dist: number | "∞"; pred: number };
export type DijkstraLinkRS = BasicGraphLinkRS & { weight: number };

export interface IDijkstraConfig {
	colors: {
		defaultEdgeColor: string;
		unvisitedNodeColor: string;
		usedEdgeColor: string;
		activeNodeColor: string;
		activeEdgeColor: string;
		visitedNodeColor: string;
		shortestPathColor: string;
		highlightColor: string;
	};
}

interface DijkstraVisualisationState<f64> extends IVisualisationState {
	distance: { [node: number]: f64 };
	predecessor: { [node: number]: number };
	startNode: number;
	neighbors: number[];
	activeNode: number | null;
	activeEdges: number[][];
	usedEdges: number[][];
	visitedNodes: number[];
	shortestPath: number[][] | null;

	// private detail of the Rust code
	stateMachineHandle?: number;
}

export type VisualisationStateTS = DijkstraVisualisationState<number> & {
	graph: GraphTS<NodeTS, LinkTS>;
};
export type VisualisationStateRS = DijkstraVisualisationState<number | "INF" | "-INF"> & {
	graph: GraphRS<DijkstraNodeRS, DijkstraLinkRS>;
};
const colorBaseContent = getDaisyuiColor(ThemeColor.BASE_CONTENT);
const themeBlue = getDaisyuiColor(ThemeColor.INFO);
const themeGreen = getDaisyuiColor(ThemeColor.SUCCESS);
const themeRed = getDaisyuiColor(ThemeColor.ERROR);
const themeOrange = getDaisyuiColor(ThemeColor.WARNING);
export const config: IDijkstraConfig = {
	colors: {
		defaultEdgeColor: colorBaseContent,
		unvisitedNodeColor: colorBaseContent,
		usedEdgeColor: themeBlue,
		activeNodeColor: themeRed,
		activeEdgeColor: themeRed,
		visitedNodeColor: themeBlue,
		shortestPathColor: themeGreen, // this never shows up...
		highlightColor: themeOrange,
	},
};

export const randomDefaults: Partial<IGraphGeneratorOptions> = {
	minimumVertexDegree: 1,
	connected: true,
	directed: true,
	allowSelfLoops: true,
	negativeEdgeWeightsAllowed: false,
};
