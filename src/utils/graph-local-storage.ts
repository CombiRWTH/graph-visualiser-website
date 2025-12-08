import { IGraphStorage } from "../types/graph";
import { Utils } from "@antv/graphin";

let graphLocator: string[] = JSON.parse(localStorage.getItem("graphLocator") ?? "[]");

function addToGraphLocator(id: string): void {
	if (!graphLocator.includes(id)) {
		graphLocator = [...graphLocator, id];
	}
	localStorage.setItem("graphLocator", JSON.stringify(graphLocator));
}

function removeFromGraphLocator(id: string): void {
	graphLocator = graphLocator.filter((item) => item !== id);
	localStorage.setItem("graphLocator", JSON.stringify(graphLocator));
}

export function saveGraphToStorage(graph: IGraphStorage): void {
	const graphString = JSON.stringify(graph);
	localStorage.setItem(graph.id, graphString);

	addToGraphLocator(graph.id);
}

export function getGraphFromStorage(id: string | null): IGraphStorage | undefined {
	if (id === null) {
		return undefined;
	}

	const graphString = localStorage.getItem(id);

	if (graphString === null) {
		return undefined;
	}

	return JSON.parse(graphString) as IGraphStorage;
}

export function getAllGraphsFromStorage(): IGraphStorage[] {
	const graphs: IGraphStorage[] = [];
	graphLocator?.forEach((id) => {
		const graph = getGraphFromStorage(id);
		if (graph !== undefined) {
			graphs.push(graph);
		}
	});
	return graphs;
}

export function removeGraphFromStorage(id: string | undefined): void {
	if (id !== undefined) {
		localStorage.removeItem(id);
		removeFromGraphLocator(id);
	}
}

export function createGraphForStorage(algorithm?: string | undefined): IGraphStorage {
	return {
		id: Utils.uuid(),
		graph: {
			nodes: [],
			edges: [],
			combos: [],
		},
		restrictedToAlgorithm: algorithm,
		name: `Graph-${new Date().toLocaleString()}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}
