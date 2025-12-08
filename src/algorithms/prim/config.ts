import { produce } from "immer";
import * as defaults from "./../config";
import { BasicGraphLinkRS, BasicGraphNodeRS, GraphRS, GraphTS } from "../../utils/graphs";
import { IConfig, IGraphGeneratorOptions, IVisualisationState } from "../algorithm-interfaces";
import { LinkTS, NodeTS } from "../adapter";
import { getDaisyuiColor, ThemeColor } from "../../utils/daisyui-colors";

export type PrimNodeRS = BasicGraphNodeRS;
export type PrimLinkRS = BasicGraphLinkRS & { weight: number };

export interface IPrimConfig extends IConfig {
	colors: {
		unvisitedEdgeColor: string;
		treeEdgesColor: string;
		outgoingEdgeColor: string;
		bestOutgoingEdgeColor: string;
		highlightedEdgesColor: string;
		activeEdgeColor: string;
		exploredNodeColor: string;
		unvisitedNodeColor: string;
	};
}

interface PrimVisualisationState extends IVisualisationState {
	startNode: number;
	treeEdges: Array<[number, number]>;
	treeNodes: number[];
	outgoingEdges: Array<[number, number]>;
	bestOutgoing: [number, number] | null;
}

export type VisualisationStateTS = PrimVisualisationState & {
	graph: GraphTS<NodeTS, LinkTS>;
};
export type VisualisationStateRS = PrimVisualisationState & {
	graph: GraphRS<PrimNodeRS, PrimLinkRS>;
};
const colorBaseContent = getDaisyuiColor(ThemeColor.BASE_CONTENT);
const themeBlue = getDaisyuiColor(ThemeColor.INFO);
const themeOrange = getDaisyuiColor(ThemeColor.WARNING);
const themeRed = getDaisyuiColor(ThemeColor.ERROR);
const themeGreen = getDaisyuiColor(ThemeColor.SUCCESS);

export const config: IPrimConfig = produce(defaults.config as IPrimConfig, (draft) => {
	draft.colors = {
		unvisitedEdgeColor: colorBaseContent,
		treeEdgesColor: themeGreen,
		outgoingEdgeColor: themeRed,
		bestOutgoingEdgeColor: themeBlue,
		/* Used while finding MST in quick training, similar to Kruskal's for consistency */
		highlightedEdgesColor: themeOrange,
		activeEdgeColor: themeRed,
		exploredNodeColor: themeGreen,
		unvisitedNodeColor: colorBaseContent,
	};
});
export const randomDefaults: Partial<IGraphGeneratorOptions> = {
	minimumVertexDegree: 2,
	connected: true, // TODO: this is not yet enforced (but de facto basically always happens anyway)
	directed: false,
	negativeEdgeWeightsAllowed: true,
};
