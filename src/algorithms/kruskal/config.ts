import { produce } from "immer";
import * as defaults from "./../config";
import { BasicGraphLinkRS, BasicGraphNodeRS, GraphRS, GraphTS } from "../../utils/graphs";
import { IGraphGeneratorOptions, IVisualisationState } from "../algorithm-interfaces";
import { LinkTS, NodeTS } from "../adapter";
import { getDaisyuiColor, ThemeColor } from "../../utils/daisyui-colors";

export type KruskalNodeRS = BasicGraphNodeRS;
export type KruskalLinkRS = BasicGraphLinkRS & { weight: number };

export interface IKruskalConfig {
	colors: {
		unvisitedEdgeColor: string;
		treeEdgesColor: string;
		activeEdgeColor: string;
		dismissedEdgesColor: string;
		highlightedEdgesColor: string;
	};
}

interface KruskalVisualisationState extends IVisualisationState {
	startNode: number;
	indexVariable: number;
	treeEdges: Array<[number, number]>;
	dismissedEdges: Array<[number, number]>;
	activeEdge: [number, number] | null;
}

export type VisualisationStateTS = KruskalVisualisationState & {
	graph: GraphTS<NodeTS, LinkTS>;
};
export type VisualisationStateRS = KruskalVisualisationState & {
	graph: GraphRS<KruskalNodeRS, KruskalLinkRS>;
};
const colorBaseContent = getDaisyuiColor(ThemeColor.BASE_CONTENT);
const themeBlue = getDaisyuiColor(ThemeColor.INFO);
const themeOrange = getDaisyuiColor(ThemeColor.WARNING);
const themeRed = getDaisyuiColor(ThemeColor.ERROR);

export const config: IKruskalConfig = produce(defaults.config as IKruskalConfig, (draft) => {
	draft.colors = {
		unvisitedEdgeColor: colorBaseContent,
		treeEdgesColor: themeBlue,
		activeEdgeColor: themeRed,
		dismissedEdgesColor: "grey",
		highlightedEdgesColor: themeOrange,
	};
});

export const randomDefaults: Partial<IGraphGeneratorOptions> = {
	minimumVertexDegree: 2,
	connected: true, // TODO: this is not yet enforced (but de facto basically always happens anyway)
	directed: false,
	negativeEdgeWeightsAllowed: true,
};
