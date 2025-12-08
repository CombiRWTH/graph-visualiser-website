import { produce } from "immer";
import * as defaults from "../config";
import { BasicGraphLinkRS, BasicGraphNodeRS, GraphRS, GraphTS } from "../../utils/graphs";
import { IGraphGeneratorOptions, IVisualisationState } from "../algorithm-interfaces";
import { LinkTS, NodeTS } from "../adapter";
import { getDaisyuiColor, ThemeColor } from "../../utils/daisyui-colors";

export type EdmondsNodeRS = BasicGraphNodeRS;
export type EdmondsLinkRS = BasicGraphLinkRS & { weight: number };

export interface IEdmondsConfig {
	colors: {
		unvisitedEdgeColor: string;
		augmentingPathColor: string;
		blossomNodeColor: string;
		matchingColor: string;
		treeHighlightColor: string;
	};
}

interface EdmondsVisualisationState extends IVisualisationState {
	startNode: number;
	indexVariable: number;
	blossomNodes: number[];
	treeEdges: Array<[number, number]>;
	treeRoot: number;
	augmentingPath: number[];
	matching: Array<[number, number]>;
	auxMatching: Array<[number, number]>;
}

export type VisualisationStateTS = EdmondsVisualisationState & {
	graph: GraphTS<NodeTS, LinkTS>;
	originalGraph: GraphTS<NodeTS, LinkTS>;
};
export type VisualisationStateRS = EdmondsVisualisationState & {
	graph: GraphRS<EdmondsNodeRS, EdmondsLinkRS>;
	originalGraph: GraphRS<EdmondsNodeRS, EdmondsLinkRS>;
};
const colorBaseContent = getDaisyuiColor(ThemeColor.BASE_CONTENT);
const themeBlue = getDaisyuiColor(ThemeColor.INFO);
const themeOrange = getDaisyuiColor(ThemeColor.WARNING);
const themeRed = getDaisyuiColor(ThemeColor.ERROR);

export const config: IEdmondsConfig = produce(defaults.config as IEdmondsConfig, (draft) => {
	draft.colors = {
		unvisitedEdgeColor: colorBaseContent,
		augmentingPathColor: themeBlue,
		blossomNodeColor: themeRed,
		matchingColor: themeRed,
		treeHighlightColor: themeOrange,
	};
});

export const randomDefaults: Partial<IGraphGeneratorOptions> = {
	minimumVertexDegree: 2,
	connected: true, // TODO: this is not yet enforced (but de facto basically always happens anyway)
	directed: false,
	negativeEdgeWeightsAllowed: true,
};
