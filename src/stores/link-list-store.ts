import { create } from "zustand";
import { GraphTS } from "../utils/graphs";
import { compareUndirectedEdges } from "../utils/compareEdges";
import { IKruskalConfig } from "../algorithms/kruskal/config";
import { IPrimConfig } from "../algorithms/prim/config";
import { LinkTS, NodeTS } from "../algorithms/adapter";

// Type union to work with both algorithms
export type MSTConfig = IKruskalConfig | IPrimConfig;

interface linkState {
	id: number;
	target: string;
	source: string;
	weight: number;
	isTreeMember?: boolean;
	isTreeMemberInput?: boolean;
	correctResult: boolean;
	color?: string;
	sourceName: string;
	targetName: string;
}

interface linkListState {
	linkList: linkState[];
	getLinkList: () => linkState[];
	setLinkList: (linkList: linkState[]) => void;
	updateLinkList: (
		graph: GraphTS<NodeTS, LinkTS>,
		isLinkCorrectResult: (edge: LinkTS) => boolean,
		isLinkTreeMember?: (edge: LinkTS) => boolean
	) => void;
	updateLinkListColors: (graph: GraphTS<NodeTS, LinkTS>) => void;
	updateColors: (graph: GraphTS<NodeTS, LinkTS>) => LinkTS[];
	colorLink: (
		config: MSTConfig
	) => (source: string) => (target: string) => (active: boolean, isShowingResults?: boolean) => void;
}

export const useLinkListStore = create<linkListState>((set, get) => ({
	linkList: [],
	getLinkList: () => get().linkList,
	setLinkList: (linkList: linkState[]) => {
		set(() => ({ linkList }));
	},
	updateLinkList: (
		graph: GraphTS<NodeTS, LinkTS>,
		isLinkCorrectResult: (edge: LinkTS) => boolean,
		isLinkTreeMember?: (edge: LinkTS) => boolean
	) => {
		const linkList: linkState[] = [];
		for (let i = 0; i < graph.edges.length; i++) {
			linkList.push({
				id: i + 1,
				target: graph.edges[i].target,
				source: graph.edges[i].source,
				weight: graph.edges[i].weight,
				isTreeMemberInput: false,
				isTreeMember: isLinkTreeMember?.(graph.edges[i]),
				correctResult: isLinkCorrectResult(graph.edges[i]),
				color: graph.edges[i].color,
				sourceName: graph.nodes.find((y) => y.id === graph.edges[i].source)?.name ?? graph.edges[i].source,
				targetName: graph.nodes.find((y) => y.id === graph.edges[i].target)?.name ?? graph.edges[i].target,
			});
		}
		set(() => ({ linkList }));
	},
	// this function updates all colours of links from a given new graph,
	// without reordering the linkList
	updateLinkListColors: (graph: GraphTS<NodeTS, LinkTS>) => {
		const linkList: linkState[] = get().linkList.map((link) => {
			const linkInNewGraph = graph.edges.find((graphLink) =>
				compareUndirectedEdges([graphLink.source, graphLink.target], [link.source, link.target])
			);
			return {
				...link,
				color: linkInNewGraph !== undefined ? linkInNewGraph.color : link.color,
			};
		});
		set(() => ({ linkList }));
	},
	// returns the links of a given graph, but with the colors as specified in linkList
	updateColors: (graph: GraphTS<NodeTS, LinkTS>) => {
		const links = graph.edges.map((e) => {
			const color = get().linkList.find((state) =>
				compareUndirectedEdges([e.source, e.target], [state.source, state.target])
			)?.color;
			return {
				...e,
				style: {
					keyshape: {
						...e.style?.keyshape,
						stroke: color,
					},
				},
			};
		});
		return links;
	},
	colorLink:
		(config: MSTConfig) =>
		(source: string) =>
		(target: string) =>
		(active: boolean, isShowingResults?: boolean) => {
			const newLinkList = get().linkList.map((state) => {
				if (compareUndirectedEdges([source, target], [state.source, state.target])) {
					const color = active
						? config.colors.highlightedEdgesColor
						: isShowingResults === true
							? state.isTreeMember === true
								? config.colors.treeEdgesColor
								: config.colors.unvisitedEdgeColor
							: state.isTreeMemberInput === true
								? config.colors.activeEdgeColor
								: config.colors.unvisitedEdgeColor;
					return { ...state, color };
				}
				return { ...state };
			});
			set(() => ({ linkList: newLinkList }));
		},
}));
