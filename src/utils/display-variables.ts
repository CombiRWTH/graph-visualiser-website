import { VisualisationStateTS as VisStatePrim } from "../algorithms/prim/config";
import { VisualisationStateTS as VisStateDijkstra } from "../algorithms/dijkstra/config";
import { VisualisationStateTS as VisStateKruskal } from "../algorithms/kruskal/config";
import { VisualisationStateTS as VisStateFordFulkerson } from "../algorithms/ford_fulkerson/config";
import { VisualisationStateTS as VisStateChristofides } from "../algorithms/christofides/config";
import { VisualisationStateTS as VisStateMbf } from "../algorithms/mbf/config";

export function displayVariables(
	algorithmName: string | undefined,
	getVisState: () =>
		| VisStatePrim
		| VisStateDijkstra
		| VisStateKruskal
		| VisStateChristofides
		| VisStateFordFulkerson
		| VisStateMbf
		| null
): string {
	if (algorithmName === "Dijkstra") {
		return displayVariablesDijkstra(getVisState);
	} else if (algorithmName === "Kruskal") {
		return displayVariablesKruskal(getVisState);
	} else if (algorithmName === "Prim") {
		return displayVariablesPrim(getVisState);
	} else if (algorithmName === "Christofides") {
		return displayVariablesChristofides(getVisState);
	} else if (algorithmName === "Ford-Fulkerson" || algorithmName === "Edmonds-Karp") {
		return displayVariablesFordFulkerson(getVisState);
	} else if (algorithmName === "Moore-Bellman-Ford") {
		return displayVariablesMbf(getVisState);
	} else {
		return "variable display not implemented for this algorithm";
	}
}

export function displayVariablesDijkstra(
	getVisState: () =>
		| VisStatePrim
		| VisStateDijkstra
		| VisStateKruskal
		| VisStateChristofides
		| VisStateFordFulkerson
		| VisStateMbf
		| null
): string {
	const state = getVisState() as VisStateDijkstra;
	let currentVariables = "\n";

	currentVariables += "$V' = \\{";
	const unvisitedNodes = state.graph.nodes.filter((f) => !state.visitedNodes.includes(Number(f.id)));

	currentVariables += unvisitedNodes
		.map((n) => (n.id === state.startNode.toString() ? "s" : `\\text{${n.name ?? n.id}}`))
		.join(", ");

	currentVariables += "\\}$\n";

	let predecessorMap = "$s\\to s $,\n ";
	for (const node of state.graph.nodes) {
		const nodeName = node.name ?? node.id;
		if (node.id === state.startNode.toString()) {
			continue;
		}
		const pred = state.predecessor[Number(node.id)];

		if (pred !== undefined) {
			const predNode = state.graph.nodes.find((node) => node.id === pred.toString());
			if (predNode !== undefined) {
				let predName = predNode.name ?? predNode.id;
				if (pred === state.startNode) {
					predName = "s";
				}
				predecessorMap += "$" + nodeName + "\\to " + predName + "$,\n ";
			}
		} else {
			predecessorMap += "$" + nodeName + "\\to$ NULL,\n ";
		}
	}
	if (predecessorMap !== "" && state.lineOfCode !== undefined && state.lineOfCode >= 2) {
		currentVariables += "Predecessor mapping: \n$\\{$" + predecessorMap.slice(0, -3) + "$\\}$\n"; // remove last comma
	}

	for (const variable in state.variables) {
		currentVariables += "$" + String(variable) + " = " + String(state.variables[variable]) + "$\n";
	}

	for (const variable in state.variables) {
		currentVariables += "$" + String(variable) + " = " + String(state.variables[variable]) + "$\n";
	}
	currentVariables += "\n";
	return currentVariables;
}

export function displayVariablesMbf(
	getVisState: () =>
		| VisStatePrim
		| VisStateDijkstra
		| VisStateKruskal
		| VisStateChristofides
		| VisStateFordFulkerson
		| VisStateMbf
		| null
): string {
	const state = getVisState() as VisStateMbf;
	let currentVariables = "\n";

	let predecessorMap = "$s\\to s$,\n ";
	for (const node of state.graph.nodes) {
		const nodeName = node.name ?? node.id;
		if (node.id === state.startNode.toString()) {
			continue;
		}
		const pred = state.predecessor[Number(node.id)];

		if (pred !== undefined) {
			const predNode = state.graph.nodes.find((node) => node.id === pred.toString());
			if (predNode !== undefined) {
				let predName = predNode.name ?? predNode.id;
				if (pred === state.startNode) {
					predName = "s";
				}
				predecessorMap += "$" + nodeName + "\\to " + predName + "$,\n ";
			}
		} else {
			predecessorMap += "$" + nodeName + "\\to$ NULL,\n ";
		}
	}
	if (predecessorMap !== "" && state.lineOfCode !== undefined && state.lineOfCode >= 2) {
		currentVariables += "Predecessor mapping: \n$\\{$" + predecessorMap.slice(0, -3) + " $\\}\n$"; // remove last comma
	}

	for (const variable in state.variables) {
		currentVariables += "$" + String(variable) + " = " + String(state.variables[variable]) + "$\n";
	}
	currentVariables += "\n";
	return currentVariables;
}

export function displayVariablesFordFulkerson(
	getVisState: () =>
		| VisStatePrim
		| VisStateDijkstra
		| VisStateKruskal
		| VisStateChristofides
		| VisStateFordFulkerson
		| VisStateMbf
		| null
): string {
	const state = getVisState() as VisStateFordFulkerson;
	let currentVariables = "\n";

	if (state.lineOfCode >= 2) {
		currentVariables += "$p = \\{";
		const pathNodes = state.augmentedPath.map((n) => state.graph.nodes.find((m) => m.id === n.toString())?.name);

		currentVariables += String(pathNodes);
		currentVariables += "\\}$\n";
	}
	if (state.lineOfCode === 3 || state.lineOfCode === 4) {
		currentVariables += "$\\gamma = ";
		currentVariables += String(state.gammaValue);
		currentVariables += "$\n";
	}

	for (const variable in state.variables) {
		currentVariables += "$" + String(variable) + " = " + String(state.variables[variable]) + "$\n";
	}
	currentVariables += "\n";
	return currentVariables;
}

export function displayVariablesChristofides(
	getVisState: () =>
		| VisStatePrim
		| VisStateDijkstra
		| VisStateKruskal
		| VisStateChristofides
		| VisStateFordFulkerson
		| VisStateMbf
		| null
): string {
	const state = getVisState() as VisStateChristofides;

	let currentVariables = "\n";

	currentVariables += "$T = \\{";
	currentVariables += state.minimalSpanningTree.map(([u, v]) => `(${u}, ${v})`).join(", ");
	currentVariables += "\\}$\n";

	currentVariables += "$V_o = \\{";
	currentVariables += state.verticesOdd.join(", ");
	currentVariables += "\\}$\n";

	currentVariables += "$M = \\{";
	currentVariables += state.minimalMatching.map(([u, v]) => `(${u}, ${v})`).join(", ");
	currentVariables += "\\}$\n";

	currentVariables += "$Eu = [";
	currentVariables += state.eulerTour.join(" \\rightarrow ");
	currentVariables += "]$\n";

	currentVariables += "$H = [";
	currentVariables += state.hamiltonCycle.join(" \\rightarrow ");
	currentVariables += "]$\n";

	return currentVariables;
}

export function displayVariablesKruskal(
	getVisState: () =>
		| VisStatePrim
		| VisStateDijkstra
		| VisStateKruskal
		| VisStateChristofides
		| VisStateFordFulkerson
		| VisStateMbf
		| null
): string {
	const state = getVisState() as VisStateKruskal;
	let currentVariables = "\n";

	currentVariables += "$T = \\{";
	currentVariables += String(state.treeEdges.map((f) => `(${f[0]}, ${f[1]})`));
	currentVariables += "\\}$";

	if (state.activeEdge != null) {
		currentVariables += `\n$e_${state.indexVariable} = (${state.activeEdge[0]},${state.activeEdge[1]})$\n`;
	} else {
		currentVariables += "\n\n"; // Avoid too much jumping (could probably be done better)
	}
	currentVariables += "\n";
	return currentVariables;
}

export function displayVariablesPrim(
	getVisState: () =>
		| VisStatePrim
		| VisStateDijkstra
		| VisStateKruskal
		| VisStateChristofides
		| VisStateFordFulkerson
		| VisStateMbf
		| null
): string {
	const state = getVisState() as VisStatePrim;
	let currentVariables = "\n";

	currentVariables += "$T = \\{";
	currentVariables += String(state.treeEdges.map((f) => `(${f[0]}, ${f[1]})`));
	currentVariables += "\\}$\n";

	if (state.bestOutgoing != null) {
		currentVariables +=
			"$\\delta(V(T))= \\{" + String(state.outgoingEdges.map((f) => `(${f[0]}, ${f[1]})`)) + "\\}$\n";
		currentVariables += `$e= (${state.bestOutgoing[0]},${state.bestOutgoing[1]})$\n`;
	} else {
		currentVariables += "\n\n"; // Avoid too much jumping (could probably be done better)
	}
	currentVariables += "\n";

	return currentVariables;
}
