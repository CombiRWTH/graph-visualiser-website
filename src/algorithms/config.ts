import { IConfig, IGraphGeneratorOptions } from "./algorithm-interfaces";

export const config: IConfig = {
	colors: undefined,
	node: {
		// Here default properties for nodes could be defined.
		// TODO add example of how this could look like
	},
	link: {
		// Here default properties for edges(called links for Graphin) could be defined.
		// TODO add example of how this could look like
	},
};

export const genericGraphGeneratorDefaults: IGraphGeneratorOptions = {
	weightRange: [1, 9],
	radius: 150,
	center: [150, 150],
	minimumVertexDegree: 2,
	connected: true,
	directed: false,
	minNodes: 5,
	maxNodes: 8,
	density: 0.4,
	complete: false,
	negativeEdgeWeightsAllowed: false,
};
