import React from "react";
import { useDijkstraStore } from "../algorithms/dijkstra/store";
import { IAlgorithmStore, IGraphGeneratorOptions } from "../algorithms/algorithm-interfaces";
import { useKruskalStore } from "../algorithms/kruskal/store";
import { usePrimStore } from "../algorithms/prim/store";
import { useChristofidesStore } from "../algorithms/christofides/store";
import { useMbfStore } from "../algorithms/mbf/store";

import { QuickTrainingPage as DijkstraQuickTraining } from "../routes/dijkstra/QuickTrainingPage";
import { StepTrainingPage as DijkstraStepTraining } from "../routes/dijkstra/stepMode/StepTrainingPage";
import { RandomTrainingPage as DijkstraRandomTraining } from "../routes/dijkstra/RandomTrainingPage";

import { QuickTrainingPage as KruskalQuickTraining } from "../routes/kruskal/QuickTrainingPage";
import { StepTrainingPage as KruskalStepTraining } from "../routes/kruskal/StepTrainingPage";

import { QuickTrainingPage as PrimQuickTraining } from "../routes/prim/QuickTrainingPage";
import { StepTrainingPage as PrimStepTraining } from "../routes/prim/StepTrainingPage";

import { GraphTS } from "./graphs";
import { LinkTS, NodeTS } from "../algorithms/adapter";
import { getRandomGraph } from "./graphGenerators";
import { randomDefaults as randomKruskalDefaults } from "../algorithms/kruskal/config";
import { randomDefaults as randomPrimDefaults } from "../algorithms/prim/config";
import { randomDefaults as randomDijkstraDefaults } from "../algorithms/dijkstra/config";
import { randomDefaults as randomChristofidesDefaults } from "../algorithms/christofides/config";
import { randomDefaults as randomFordFulkersonDefaults } from "../algorithms/ford_fulkerson/config";
import { randomDefaults as randomMbfDefaults } from "../algorithms/mbf/config";
import { GetGraphProperties } from "../components/GraphProperties";
import { useFordFulkersonStore } from "../algorithms/ford_fulkerson/store";
import { useEdmondsKarpStore } from "../algorithms/edmonds_karp/store";
import { useDinicStore } from "../algorithms/dinic/store";

export enum AlgorithmCategory {
	SHORTEST_PATH = "Shortest Path",
	MINIMUM_SPANNING_TREE = "Minimum Spanning Tree",
	HAMILTON_CYCLE = "Hamilton Cycle",
	MAX_FLOW = "Maximum Flow",
}

export interface ITrainingPageProps {
	graphState: GraphTS<NodeTS, LinkTS>;
	setGraphState: (state: GraphTS<NodeTS, LinkTS>) => void;
}

interface IAlgorithmFeatures {
	// If a new training mode is added, remember to add it to the availableTrainingModes object with the same name
	availableTrainingModes?: {
		quick?: React.FC<ITrainingPageProps>;
		step?: React.FC<ITrainingPageProps>;
		random?: React.FC<ITrainingPageProps>;
	};
}

export interface IAlgorithmRequirements {
	noDirectedEdge?: boolean;
	noUndirectedEdge?: boolean;
	noSelfLoop?: boolean;
	noNegativeWeights?: boolean;
	connected?: boolean;
	complete?: boolean;
}

export interface IAlgorithmInformation {
	name: string;
	description: string;
	category: AlgorithmCategory;
	features: IAlgorithmFeatures;
	requirements: IAlgorithmRequirements;
	useAlgorithmStore: (fn: (state: IAlgorithmStore) => IAlgorithmStore) => IAlgorithmStore;
	hasStartNode: boolean;
	getRandomGraph: (options?: Partial<IGraphGeneratorOptions>) => GraphTS<NodeTS, LinkTS>;
}

const Dijkstra: IAlgorithmInformation = {
	name: "Dijkstra",
	description:
		"Dijkstra's algorithm is an algorithm for finding the shortest paths between nodes in a weighted graph. It was conceived by computer scientist Edsger W. Dijkstra in 1956 and published three years later.",
	category: AlgorithmCategory.SHORTEST_PATH,
	features: {
		availableTrainingModes: {
			quick: DijkstraQuickTraining,
			step: DijkstraStepTraining,
			random: DijkstraRandomTraining,
		},
	},
	requirements: {
		noNegativeWeights: true,
		noUndirectedEdge: true,
	},
	useAlgorithmStore: useDijkstraStore,
	hasStartNode: true,
	getRandomGraph: (options?: Partial<IGraphGeneratorOptions>) =>
		getRandomGraph({ ...randomDijkstraDefaults, ...options }),
};

const Kruskal: IAlgorithmInformation = {
	name: "Kruskal",
	description:
		"Kruskal's algorithm finds a minimum spanning forest of an undirected edge-weighted graph. If the graph is connected, it finds a minimum spanning tree. This algorithm was first published by Joseph Kruskal in 1956 and was rediscovered soon afterward by Loberman & Weinberger.",
	category: AlgorithmCategory.MINIMUM_SPANNING_TREE,
	features: {
		availableTrainingModes: {
			quick: KruskalQuickTraining,
			step: KruskalStepTraining,
		},
	},
	requirements: {
		noDirectedEdge: true,
		connected: true,
		noSelfLoop: true,
	},
	useAlgorithmStore: useKruskalStore,
	hasStartNode: false,
	getRandomGraph: (options?: Partial<IGraphGeneratorOptions>) =>
		getRandomGraph({ ...randomKruskalDefaults, ...options }),
};

const Prim: IAlgorithmInformation = {
	name: "Prim",
	description:
		"Prim's algorithm is a greedy algorithm that finds a minimum spanning tree for a weighted undirected graph. The algorithm was developed in 1930 by Czech mathematician Vojtěch Jarník and later rediscovered and republished by computer scientists Robert C. Prim in 1957 and Edsger W. Dijkstra in 1959.",
	category: AlgorithmCategory.MINIMUM_SPANNING_TREE,
	features: {
		availableTrainingModes: {
			quick: PrimQuickTraining,
			step: PrimStepTraining,
		},
	},
	requirements: {
		noDirectedEdge: true,
		connected: true,
		noSelfLoop: true,
	},
	useAlgorithmStore: usePrimStore,
	hasStartNode: true,
	getRandomGraph: (options?: Partial<IGraphGeneratorOptions>) =>
		getRandomGraph({ ...randomPrimDefaults, ...options }),
};

const Christofides: IAlgorithmInformation = {
	name: "Christofides",
	description:
		"The Christofides algorithm is an algorithm for finding approximate solutions to the travelling salesman problem, on instances where the distances form a metric space (they are symmetric and obey the triangle inequality). It is an approximation algorithm that guarantees that its solutions will be within a factor of 3/2 of the optimal solution length, and is named after Nicos Christofides, who published the algorithm in 1976.",
	category: AlgorithmCategory.HAMILTON_CYCLE,
	features: {
		// Implementation of training modes is yet to be done
	},
	requirements: {
		noDirectedEdge: true,
		connected: true,
		complete: false,
		noSelfLoop: true,
	},
	useAlgorithmStore: useChristofidesStore,
	hasStartNode: false,
	getRandomGraph: (options?: Partial<IGraphGeneratorOptions>) =>
		getRandomGraph({ ...randomChristofidesDefaults, ...options }),
};

const FordFulkerson: IAlgorithmInformation = {
	name: "Ford-Fulkerson",
	description:
		"The Ford-Fulkerson algorithm computes a maximum flow in a flow network. It was published in 1956 by L. R. Ford Jr. and D. R. Fulkerson.",
	category: AlgorithmCategory.MAX_FLOW,
	features: {
		// Implementation of training modes is yet to be done
	},
	requirements: {
		noDirectedEdge: false,
		connected: true,
		complete: false,
		noSelfLoop: true,
	},
	useAlgorithmStore: useFordFulkersonStore,
	hasStartNode: false,
	getRandomGraph: (options?: Partial<IGraphGeneratorOptions>) =>
		getRandomGraph({ ...randomFordFulkersonDefaults, ...options }),
};

const EdmondsKarp: IAlgorithmInformation = {
	name: "Edmonds-Karp",
	description:
		"The Edmonds-Karp algorithm specifies the choice of the augmenting paths in the Ford-Fulkerson Algorithm and through that achieves a run-time only depending on the number of arcs and vertices (not on the capacities)",
	category: AlgorithmCategory.MAX_FLOW,
	features: {
		// Implementation of training modes is yet to be done
	},
	requirements: {
		noDirectedEdge: false,
		connected: true,
		complete: false,
		noSelfLoop: true,
	},
	useAlgorithmStore: useEdmondsKarpStore,
	hasStartNode: false,
	getRandomGraph: (options?: Partial<IGraphGeneratorOptions>) =>
		getRandomGraph({ ...randomFordFulkersonDefaults, ...options }),
};
const Dinic: IAlgorithmInformation = {
	name: "Dinic",
	description: "An algorithm calculating the maximum flow using level graphs and blocking flows",
	category: AlgorithmCategory.MAX_FLOW,
	features: {
		// Implementation of training modes is yet to be done
	},
	requirements: {
		noDirectedEdge: false,
		connected: true,
		complete: false,
		noSelfLoop: true,
	},
	useAlgorithmStore: useDinicStore,
	hasStartNode: false,
	getRandomGraph: (options?: Partial<IGraphGeneratorOptions>) =>
		getRandomGraph({ ...randomFordFulkersonDefaults, ...options }),
};

const Mbf: IAlgorithmInformation = {
	name: "Moore-Bellman-Ford",
	description:
		"This algorithm was published independently by Richard Bellman, Lester Ford and Edward Moore published in 1958, 1956 and 1957 to compute a shortest path tree in a graph with negative costs or to compute a negative cycle.",
	category: AlgorithmCategory.SHORTEST_PATH,
	features: {
		// Implementation of training modes is yet to be done
	},
	requirements: {
		noUndirectedEdge: true,
	},
	useAlgorithmStore: useMbfStore,
	hasStartNode: true,
	getRandomGraph: (options?: Partial<IGraphGeneratorOptions>) => getRandomGraph({ ...randomMbfDefaults, ...options }),
};

export function generalCompatibilityCheck(
	graph: GraphTS<NodeTS, LinkTS>,
	requirements: IAlgorithmRequirements
): boolean {
	const givenProperties = GetGraphProperties(graph);
	if (givenProperties === null) {
		return false;
	}
	for (const key in requirements) {
		// Ensure the property is defined in subset and does not mismatch in superset
		if (
			requirements[key as keyof IAlgorithmRequirements] !== givenProperties[key as keyof IAlgorithmRequirements]
		) {
			return false;
		}
	}
	return true;
}

function getMissingRequirements(
	graph: GraphTS<NodeTS, LinkTS>,
	requirements: IAlgorithmRequirements
): Partial<IAlgorithmRequirements> {
	const givenProperties = GetGraphProperties(graph);
	if (givenProperties === null) {
		return requirements; // If no properties are available, all requirements are missing
	}

	const missingRequirements: Partial<IAlgorithmRequirements> = {};

	for (const key in requirements) {
		// If a required property is not in givenProperties or mismatches, add to missing
		if (
			requirements[key as keyof IAlgorithmRequirements] !== givenProperties[key as keyof IAlgorithmRequirements]
		) {
			missingRequirements[key as keyof IAlgorithmRequirements] =
				requirements[key as keyof IAlgorithmRequirements];
		}
	}

	return missingRequirements;
}

export const formatMissingRequirements = (
	graph: GraphTS<NodeTS, LinkTS>,
	requirements: IAlgorithmRequirements
): string[] => {
	// Format the missing requirements as human-readable messages
	const missing = getMissingRequirements(graph, requirements);
	const formattedMessages: string[] = [];

	for (const key in missing) {
		switch (key) {
			case "noDirectedEdge":
				formattedMessages.push("The graph must not have any directed edges.");
				break;
			case "noUndirectedEdge":
				formattedMessages.push("The graph must not have any undirected edges.");
				break;
			case "noSelfLoop":
				formattedMessages.push("The graph must not have self loops.");
				break;
			case "noNegativeWeights":
				formattedMessages.push("The graph must not have negative weights.");
				break;
			case "connected":
				formattedMessages.push("The graph must be connected.");
				break;
			default:
				formattedMessages.push(`The graph must satisfy the ${key} requirement.`);
		}
	}

	return formattedMessages;
};

export const AvailableAlgorithm = {
	Dijkstra,
	Kruskal,
	Prim,
	Christofides,
	FordFulkerson,
	Mbf,
	EdmondsKarp,
	Dinic,
};
