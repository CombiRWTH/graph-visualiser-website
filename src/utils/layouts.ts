import { ILayoutAlgorithm } from "../algorithms/algorithm-interfaces";

// https://graphin.antv.vision/en-US/graphin/layout/switching/
export const graphLayouts: Record<string, ILayoutAlgorithm> = {
	Circle: {
		type: "circular",
		options: {},
	},
	Force: {
		type: "graphin-force",
		options: {
			preventOverlap: true,
			linkDistance: 250,
			nodeStrength: 30,
			edgeStrength: 0.1,
			collideStrength: 0.8,
		},
	},
	Grid: {
		type: "grid",
		options: {},
	},
	Free: {
		type: "preset",
		options: {},
	},
	Dagre: {
		type: "dagre",
		options: {
			rankdir: "LR", // Left to Right
		},
	},
};
