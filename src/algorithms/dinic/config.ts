import { produce } from "immer";
import * as defaults from "./../config";
import { BasicGraphLinkRS, BasicGraphNodeRS, GraphRS, GraphTS } from "../../utils/graphs";
import { IConfig, IGraphGeneratorOptions, IVisualisationState } from "../algorithm-interfaces";
import { LinkTS, NodeTS } from "../adapter";
import { getDaisyuiColor, ThemeColor } from "../../utils/daisyui-colors";

export type DinicNodeRS = BasicGraphNodeRS;
export type DinicLinkRS = BasicGraphLinkRS & { weight: number; flowValue?: number };

export interface IDinicConfig extends IConfig {
	colors: {
		unvisitedEdgeColor: string;
		flowColor: string;
		blockingFlowColor: string;
	};
}

interface DinicVisualisationState extends IVisualisationState {
	lineOfCode: number;
	startNode: number;
	sourceNode: number;
	targetNode: number;
	flow: { [keyLink: string]: number }; // Map<String, number>;
	blockingFlow: { [keyLink: string]: number }; // Map<String, number>;
}

export type VisualisationStateTS = DinicVisualisationState & {
	graph: GraphTS<NodeTS, LinkTS>;
	residualGraph: GraphTS<NodeTS, LinkTS>;
};
export type VisualisationStateRS = DinicVisualisationState & {
	graph: GraphRS<DinicNodeRS, DinicLinkRS>;
	residualGraph: GraphRS<DinicNodeRS, DinicLinkRS>;
};
const colorBaseContent = getDaisyuiColor(ThemeColor.BASE_CONTENT);
const themeBlue = getDaisyuiColor(ThemeColor.INFO);
const themeRed = getDaisyuiColor(ThemeColor.ERROR);
export const config: IDinicConfig = produce(defaults.config as IDinicConfig, (draft) => {
	draft.colors = {
		unvisitedEdgeColor: colorBaseContent,
		flowColor: themeBlue,
		blockingFlowColor: themeRed,
	};
});
export const randomDefaults: Partial<IGraphGeneratorOptions> = {
	minimumVertexDegree: 2,
	connected: true, // TODO: this is not yet enforced (but de facto basically always happens anyway)
	directed: true,
	complete: false,
	negativeEdgeWeightsAllowed: false,
};
