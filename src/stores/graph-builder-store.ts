import { create } from "zustand";
import { GraphinContextType } from "@antv/graphin";
import { zoomInGraphCanvas, zoomOutGraphCanvas } from "../utils/graph";

interface GraphBuilderStore {
	graph: GraphinContextType | null;

	activateClickSelect: boolean;
	activateAddNode: boolean;
	activateAddUndirectedEdge: boolean;
	activateAddDirectedEdge: boolean;
	activateEraser: boolean;

	activateCanvasMove: boolean;
	activateCanvasLassoSelect: boolean;
	activateCanvasAreaSelect: boolean;

	highlightNegativeEdges: boolean;
	allowParallelEdges: boolean;
	showErrors: boolean;

	manualSaveRequested: boolean;

	allowDirectedEdges: boolean;
	allowUndirectedEdges: boolean;
	allowNegativeWeights: boolean;
	allowDisconnectivity: boolean;
	allowSelfEdge: boolean;

	hasNegativeEdge: boolean;
	hasSelfLoop: boolean;
	hasUndirectedEdge: boolean;
	hasDirectedEdge: boolean;

	isConnected: boolean;
	isComplete: boolean;
	isContextMenuOpen: boolean;
	graphInfoTrigger: boolean;

	hasUncompletedEdge: boolean;

	nodeColor: string;
	nodeSize: number;
	edgeColor: string;
	edgeWidth: number;
}

interface GraphBuilderStoreActions {
	setActivateClickSelect: (activate: boolean) => void;
	setActivateAddNode: (activate: boolean) => void;
	setActivateAddUndirectedEdge: (activate: boolean) => void;
	setActivateAddDirectedEdge: (activate: boolean) => void;
	setActivateEraser: (activate: boolean) => void;

	setActivateCanvasMove: (activate: boolean) => void;
	setActivateCanvasLassoSelect: (activate: boolean) => void;
	setActivateCanvasAreaSelect: (activate: boolean) => void;

	setAllowDirectedEdges: (activate: boolean) => void;
	setAllowUndirectedEdges: (activate: boolean) => void;
	setAllowNegativeWeights: (activate: boolean) => void;
	setAllowDisconnectivity: (activate: boolean) => void;
	setAllowSelfEdge: (activate: boolean) => void;

	setHasNegativeEdge: (activate: boolean) => void;
	setHasSelfLoop: (activate: boolean) => void;
	setHasUndirectedEdge: (activate: boolean) => void;
	setHasDirectedEdge: (activate: boolean) => void;

	setIsConnected: (value: boolean) => void;
	setIsComplete: (value: boolean) => void;

	setContextMenuOpen: (activate: boolean) => void;
	setGraph: (graph: GraphinContextType) => void;
	setGraphInfoTrigger: (activate: boolean) => void;

	setHasUncompletedEdge: (activate: boolean) => void;

	zoomIn: () => void;
	zoomOut: () => void;
	autoLayout: () => void;
	fitAll: () => void;
	setManualSaveFlag: (value: boolean) => void;

	setNodeColor: (value: string) => void;
	setNodeSize: (value: number) => void;
	setEdgeColor: (value: string) => void;
	setEdgeWidth: (value: number) => void;
}

export const useGraphBuilderStore = create<GraphBuilderStore & GraphBuilderStoreActions>((set, get) => ({
	graph: null,

	activateClickSelect: false,
	activateAddNode: true,
	activateAddUndirectedEdge: false,
	activateAddDirectedEdge: false,
	activateEraser: false,

	activateCanvasMove: true,
	activateCanvasLassoSelect: false,
	activateCanvasAreaSelect: false,

	highlightNegativeEdges: false,
	allowParallelEdges: false,
	showErrors: false,
	manualSaveRequested: false,

	allowDirectedEdges: true,
	allowUndirectedEdges: true,
	allowNegativeWeights: true,
	allowDisconnectivity: true,
	allowSelfEdge: true,

	hasNegativeEdge: false,
	hasSelfLoop: false,
	hasUndirectedEdge: false,
	hasDirectedEdge: false,

	isConnected: false,
	isComplete: false,

	isContextMenuOpen: false,

	hasUncompletedEdge: false,

	graphInfoTrigger: false,

	nodeColor: "#100C08",
	nodeSize: 50,
	edgeColor: "#100C08",
	edgeWidth: 1,

	setActivateClickSelect: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { activateClickSelect: activate };

		if (activate) {
			state.activateAddDirectedEdge = false;
			state.activateAddUndirectedEdge = false;
			state.activateAddNode = false;
			state.activateEraser = false;
		}

		set(state);
	},
	setActivateAddNode: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { activateAddNode: activate };

		if (activate) {
			state.activateEraser = false;
			state.activateClickSelect = false;
		}

		set(state);
	},
	setActivateAddUndirectedEdge: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { activateAddUndirectedEdge: activate };

		if (activate) {
			state.activateClickSelect = false;
			state.activateAddDirectedEdge = false;
			state.activateEraser = false;
		}

		set(state);
	},
	setActivateAddDirectedEdge: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { activateAddDirectedEdge: activate };

		if (activate) {
			state.activateClickSelect = false;
			state.activateAddUndirectedEdge = false;
			state.activateEraser = false;
		}

		set(state);
	},
	setActivateEraser: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { activateEraser: activate };

		if (activate) {
			state.activateClickSelect = false;
			state.activateAddNode = false;
			state.activateAddUndirectedEdge = false;
			state.activateAddDirectedEdge = false;
		}

		set(state);
	},

	setActivateCanvasMove: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { activateCanvasMove: activate };

		if (activate) {
			state.activateCanvasLassoSelect = false;
			state.activateCanvasAreaSelect = false;
		}

		set(state);
	},
	setActivateCanvasLassoSelect: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { activateCanvasLassoSelect: activate };

		if (activate) {
			state.activateCanvasAreaSelect = false;
			state.activateCanvasMove = false;
		}

		set(state);
	},
	setActivateCanvasAreaSelect: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { activateCanvasAreaSelect: activate };

		if (activate) {
			state.activateCanvasLassoSelect = false;
			state.activateCanvasMove = false;
		}

		set(state);
	},

	setGraph: (graph: GraphinContextType) => {
		set({ graph });
	},

	setHighlightNegativeEdges: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { highlightNegativeEdges: activate };

		set(state);
	},

	setAllowParallelEdges: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { allowParallelEdges: activate };

		set(state);
	},

	setShowErrors: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { showErrors: activate };

		set(state);
	},

	setAllowDirectedEdges: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { allowDirectedEdges: activate };

		if (!activate) {
			state.allowUndirectedEdges = true;
			state.hasDirectedEdge = false;
		}

		set(state);
	},

	setAllowUndirectedEdges: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { allowUndirectedEdges: activate };

		if (!activate) {
			state.allowDirectedEdges = true;
			state.hasUndirectedEdge = false;
		}

		set(state);
	},

	setAllowNegativeWeights: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { allowNegativeWeights: activate };

		if (!activate) {
			state.hasNegativeEdge = false;
		}

		set(state);
	},

	setAllowDisconnectivity: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { allowDisconnectivity: activate };

		set(state);
	},

	setAllowSelfEdge: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { allowSelfEdge: activate };

		if (!activate) {
			state.hasSelfLoop = false;
		}

		set(state);
	},

	setHasNegativeEdge: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { hasNegativeEdge: activate };

		set(state);
	},

	setHasSelfLoop: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { hasSelfLoop: activate };

		set(state);
	},

	setHasUndirectedEdge: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { hasUndirectedEdge: activate };

		set(state);
	},

	setHasDirectedEdge: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { hasDirectedEdge: activate };

		set(state);
	},

	setIsConnected: (value: boolean) => {
		const state: Partial<GraphBuilderStore> = { isConnected: value };

		set(state);
	},

	setIsComplete: (value: boolean) => {
		const state: Partial<GraphBuilderStore> = { isComplete: value };

		set(state);
	},

	setContextMenuOpen: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { isContextMenuOpen: activate };

		set(state);
	},

	setHasUncompletedEdge: (activate: boolean | undefined) => {
		const state: Partial<GraphBuilderStore> = { hasUncompletedEdge: activate };

		set(state);
	},

	setGraphInfoTrigger: (activate: boolean) => {
		const state: Partial<GraphBuilderStore> = { graphInfoTrigger: activate };

		set(state);
	},

	setNodeColor(value: string) {
		const state: Partial<GraphBuilderStore> = { nodeColor: value };

		set(state);
	},

	setNodeSize(value: number) {
		const state: Partial<GraphBuilderStore> = { nodeSize: value };

		set(state);
	},

	setEdgeColor(value: string) {
		const state: Partial<GraphBuilderStore> = { edgeColor: value };

		set(state);
	},

	setEdgeWidth(value: number) {
		const state: Partial<GraphBuilderStore> = { edgeWidth: value };

		set(state);
	},

	zoomIn: () => {
		if (get().graph !== null) {
			zoomInGraphCanvas(get().graph as GraphinContextType);
		}
	},
	zoomOut: () => {
		if (get().graph !== null) {
			zoomOutGraphCanvas(get().graph as GraphinContextType);
		}
	},
	autoLayout: () => {
		const graph = (get().graph as GraphinContextType).graph;
		if (graph !== null) {
			graph.updateLayout("grid");
			graph.layout();
		}
	},
	fitAll: () => {
		const graph = (get().graph as GraphinContextType).graph;
		graph.fitView(100, {}, true);
	},
	setManualSaveFlag: (value: boolean) => {
		set({ manualSaveRequested: value });
	},
}));
