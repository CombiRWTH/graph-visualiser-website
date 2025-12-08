import { produce } from "immer";
import * as defaults from "./../config";
import { BasicGraphLinkRS, BasicGraphNodeRS, GraphRS, GraphTS } from "../../utils/graphs";
import { IConfig, IGraphGeneratorOptions, IVisualisationState } from "../algorithm-interfaces";
import { LinkTS, NodeTS } from "../adapter";
import { getDaisyuiColor, ThemeColor } from "../../utils/daisyui-colors";

export type FordFulkersonNodeRS = BasicGraphNodeRS;
export type FordFulkersonLinkRS = BasicGraphLinkRS & { weight: number; flowValue?: number };

export interface IFordFulkersonConfig extends IConfig {
	colors: {
		unvisitedEdgeColor: string;
		flowColor: string;
		augmentedPathColor: string;
	};
}

interface FordFulkersonVisualisationState extends IVisualisationState {
	lineOfCode: number;
	startNode: number;
	sourceNode: number;
	targetNode: number;
	flow: { [keyLink: string]: number }; // Map<String, number>;
	augmentedPath: number[];
	gammaValue: number;
}

export type VisualisationStateTS = FordFulkersonVisualisationState & {
	graph: GraphTS<NodeTS, LinkTS>;
	residualGraph: GraphTS<NodeTS, LinkTS>;
};
export type VisualisationStateRS = FordFulkersonVisualisationState & {
	graph: GraphRS<FordFulkersonNodeRS, FordFulkersonLinkRS>;
	residualGraph: GraphRS<FordFulkersonNodeRS, FordFulkersonLinkRS>;
};
const colorBaseContent = getDaisyuiColor(ThemeColor.BASE_CONTENT);
const themeBlue = getDaisyuiColor(ThemeColor.INFO);
const themeRed = getDaisyuiColor(ThemeColor.ERROR);
export const config: IFordFulkersonConfig = produce(defaults.config as IFordFulkersonConfig, (draft) => {
	draft.colors = {
		unvisitedEdgeColor: colorBaseContent,
		flowColor: themeBlue,
		augmentedPathColor: themeRed,
	};
});
export const randomDefaults: Partial<IGraphGeneratorOptions> = {
	minimumVertexDegree: 2,
	connected: true, // TODO: this is not yet enforced (but de facto basically always happens anyway)
	directed: true,
	complete: false,
	negativeEdgeWeightsAllowed: false,
};
