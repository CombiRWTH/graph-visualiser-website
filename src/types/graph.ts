import { GraphinData } from "@antv/graphin";

export interface IGraphStorage {
	id: string;
	graph: GraphinData;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	restrictedToAlgorithm: string | undefined;
	description?: string;
}
