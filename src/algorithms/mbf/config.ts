import { BasicGraphLinkRS, BasicGraphNodeRS, GraphRS, GraphTS } from "../../utils/graphs";
import { IGraphGeneratorOptions, IVisualisationState } from "../algorithm-interfaces";
import { LinkTS, NodeTS } from "../adapter";
import { getDaisyuiColor, ThemeColor } from "../../utils/daisyui-colors";

export type MbfNodeRS = BasicGraphNodeRS & { dist: number | "∞"; pred: number };
export type MbfLinkRS = BasicGraphLinkRS & { weight: number };

export interface IMbfConfig {
	colors: {
		defaultEdgeColor: string;
		usedEdgeColor: string;
		activeEdgeColor: string;
		shortestPathTreeColor: string;
	};
}

interface MbfVisualisationState<f64> extends IVisualisationState {
	distance: { [node: number]: f64 };
	predecessor: { [node: number]: number };
	startNode: number;
	activeEdge: number[];
	usedEdges: number[][];
	shortestPathTree: number[][];

	// private detail of the Rust code
	stateMachineHandle?: number;
}

export type VisualisationStateTS = MbfVisualisationState<number> & {
	graph: GraphTS<NodeTS, LinkTS>;
};
export type VisualisationStateRS = MbfVisualisationState<number | "INF" | "-INF"> & {
	graph: GraphRS<MbfNodeRS, MbfLinkRS>;
};
const colorBaseContent = getDaisyuiColor(ThemeColor.BASE_CONTENT);
const themeBlue = getDaisyuiColor(ThemeColor.INFO);
const themeGreen = getDaisyuiColor(ThemeColor.SUCCESS);
const themeRed = getDaisyuiColor(ThemeColor.ERROR);
export const config: IMbfConfig = {
	colors: {
		defaultEdgeColor: colorBaseContent,
		usedEdgeColor: themeGreen,
		activeEdgeColor: themeRed,
		shortestPathTreeColor: themeBlue,
	},
};

export const randomDefaults: Partial<IGraphGeneratorOptions> = {
	minimumVertexDegree: 1,
	connected: true,
	directed: true,
	allowSelfLoops: true,
	negativeEdgeWeightsAllowed: true,
};
