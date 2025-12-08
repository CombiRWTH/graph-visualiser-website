import { produce } from "immer";
import * as defaults from "./../config";
import { BasicGraphLinkRS, BasicGraphNodeRS, GraphRS, GraphTS } from "../../utils/graphs";
import { IConfig, IGraphGeneratorOptions, IVisualisationState } from "../algorithm-interfaces";
import { LinkTS, NodeTS } from "../adapter";
import { getDaisyuiColor, ThemeColor } from "../../utils/daisyui-colors";

export type ChristofidesNodeRS = BasicGraphNodeRS;
export type ChristofidesLinkRS = BasicGraphLinkRS & { weight: number };

export interface IChristofidesConfig extends IConfig {
	colors: {
		unvisitedEdgeColor: string;
		mstEdgesColor: string;
		mmEdgesColor: string;
		hamiltonEdgesColor: string;
	};
}

interface ChristofidesVisualisationState extends IVisualisationState {
	lineOfCode: number;
	startNode: number;
	minimalSpanningTree: Array<[number, number]>;
	verticesOdd: number[];
	minimalMatching: Array<[number, number]>;
	introducedEdges: Array<[number, number]>;
	eulerTour: number[];
	hamiltonCycle: number[];
}

export type VisualisationStateTS = ChristofidesVisualisationState & {
	graph: GraphTS<NodeTS, LinkTS>;
};
export type VisualisationStateRS = ChristofidesVisualisationState & {
	graph: GraphRS<ChristofidesNodeRS, ChristofidesLinkRS>;
};
const colorBaseContent = getDaisyuiColor(ThemeColor.BASE_CONTENT);
const themeBlue = getDaisyuiColor(ThemeColor.INFO);
const themeGreen = getDaisyuiColor(ThemeColor.SUCCESS);
const themeRed = getDaisyuiColor(ThemeColor.ERROR);
export const config: IChristofidesConfig = produce(defaults.config as IChristofidesConfig, (draft) => {
	draft.colors = {
		unvisitedEdgeColor: colorBaseContent,
		mstEdgesColor: themeRed,
		mmEdgesColor: themeGreen,
		hamiltonEdgesColor: themeBlue,
	};
});
export const randomDefaults: Partial<IGraphGeneratorOptions> = {
	minimumVertexDegree: 2,
	connected: true, // TODO: this is not yet enforced (but de facto basically always happens anyway)
	directed: false,
	complete: false,
	negativeEdgeWeightsAllowed: false,
};
