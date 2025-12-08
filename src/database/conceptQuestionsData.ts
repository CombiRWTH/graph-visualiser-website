import {
	getConnectivityGraph,
	getRandomGraph,
	getRandomTree,
	generalGraphOptionsDefaults,
} from "../utils/graphGenerators";
import {
	calculateVertexDegrees,
	findMaxDegree,
	findMostFrequentDegree,
	isTree,
	findUndirectedPath,
	hasAnyUndirectedPath,
	isValidUndirectedPath,
	findPerfectMatching,
} from "./conceptFunctions";
import { IUserNode } from "@antv/graphin";
import { LinkTS, NodeTS } from "../algorithms/adapter";
import {
	Question,
	QuestionCategory,
	QuestionParams,
	QuestionTemplate,
	VertexQuestionParams,
	PathQuestionParams,
} from "../types/question-types";
import { getEdgesAsStringArray, GraphTS, isConnected, GraphWithPathMeta } from "../utils/graphs";
import { IGraphGeneratorOptions } from "../algorithms/algorithm-interfaces";

// Before changing the graph options, make sure that the wrong options make sense.
export const questionTemplates: QuestionTemplate[] = [
	{
		id: 1,
		category: QuestionCategory.EDGE_SET,
		text: "What is the set E in the following graph G = (V, E), with V = {$vertices}?",
		graphGenerator: (params) => getRandomGraph(params),
		calculateCorrectAnswer: (params) => `{${getEdgesAsStringArray(params.graph).join(", ")}}`,
		optionGenerator: (params, correctAnswer) => {
			const graph = params.graph;
			const vertices = graph.nodes.map((n) => n.id);
			const correctEdgesArray = graph.edges.map((e) =>
				e.source < e.target ? `{${e.source},${e.target}}` : `{${e.target},${e.source}}`
			);

			// Get all possible valid edges between nodes (maintaining source < target)
			const getAllPossibleEdges = (): string[] => {
				const possibleEdges = [];
				for (let i = 0; i < vertices.length; i++) {
					for (let j = i + 1; j < vertices.length; j++) {
						possibleEdges.push(`{${vertices[i]},${vertices[j]}}`);
					}
				}
				return possibleEdges;
			};

			const wrongOptions = new Set<string>();
			const allPossibleEdges = getAllPossibleEdges();
			const unusedEdges = allPossibleEdges.filter((edge) => !correctEdgesArray.includes(edge));

			// Try Option 1 first: Remove one edge and add a different valid edge
			for (let i = 0; i < correctEdgesArray.length && wrongOptions.size < 3; i++) {
				for (let j = 0; j < unusedEdges.length && wrongOptions.size < 3; j++) {
					const edgeArrayCopy = [...correctEdgesArray];
					edgeArrayCopy.splice(i, 1);
					edgeArrayCopy.push(unusedEdges[j]);
					const newOption = `{${edgeArrayCopy.sort(() => Math.random() - 0.5).join(", ")}}`;
					if (newOption !== correctAnswer) {
						wrongOptions.add(newOption);
					}
				}
			}

			// If we still need more options, fall back to Option 2: Remove one edge
			if (wrongOptions.size < 3 && graph.edges.length > 1) {
				for (let i = 0; i < correctEdgesArray.length && wrongOptions.size < 3; i++) {
					const edgeArrayCopy = [...correctEdgesArray];
					edgeArrayCopy.splice(i, 1);
					const newOption = `{${edgeArrayCopy.sort(() => Math.random() - 0.5).join(", ")}}`;
					if (newOption !== correctAnswer) {
						wrongOptions.add(newOption);
					}
				}
			}

			// If we still don't have enough options, duplicate the last one
			const finalWrongOptions = Array.from(wrongOptions);
			while (finalWrongOptions.length < 3) {
				finalWrongOptions.push(
					finalWrongOptions[finalWrongOptions.length - 1] !== ""
						? finalWrongOptions[finalWrongOptions.length - 1]
						: correctAnswer
				);
			}

			const allOptions = [correctAnswer, ...finalWrongOptions.slice(0, 3)];
			return allOptions.sort(() => Math.random() - 0.5);
		},
		formatText: (params) => {
			return params.text.replace("$vertices", `{${params.graph.nodes.map((n: IUserNode) => n.id).join(", ")}}`);
		},
		difficulty: "easy",
	},
	{
		id: 2,
		category: QuestionCategory.VERTEX_COUNT,
		text: "How many vertices does the following graph have?",
		graphGenerator: (params) => getRandomGraph(params),
		calculateCorrectAnswer: (params) => params.graph.nodes.length.toString(),
		optionGenerator: (graph, correctAnswer) => {
			const correctCount = parseInt(correctAnswer);
			return generateOptions(correctCount);
		},
		difficulty: "easy",
		graphOptions: {
			minNodes: 4,
			maxNodes: 8,
			density: 0.5,
		},
	},
	{
		id: 3,
		category: QuestionCategory.EDGE_COUNT,
		text: "How many edges does the following graph have?",
		graphGenerator: (params) => getRandomGraph(params),
		calculateCorrectAnswer: (params) => params.graph.edges.length.toString(),
		optionGenerator: (params, correctAnswer) => {
			const correctCount = parseInt(correctAnswer);
			return generateOptions(correctCount);
		},
		difficulty: "easy",
	},
	{
		id: 4,
		category: QuestionCategory.TREE,
		text: "Is the following graph a tree?",
		graphGenerator: (params) => {
			let numNodes;
			if (params.maxNodes !== undefined && params.minNodes !== undefined) {
				numNodes = Math.floor(Math.random() * (params.maxNodes - params.minNodes)) + params.minNodes;
			} else {
				numNodes = Math.floor(Math.random() * (8 - 4)) + 4;
			}
			const tree: boolean = Math.random() > 0.5;
			if (tree) {
				return getRandomTree(numNodes);
			} else {
				return getRandomGraph(params);
			}
		},
		calculateCorrectAnswer: (params) => {
			return isTree(params.graph) ? "Yes" : "No";
		},
		optionGenerator: () => {
			const allOptions = ["Yes", "No"];
			return allOptions.sort(() => Math.random() - 0.5);
		},
		difficulty: "easy",
	},
	{
		id: 5,
		category: QuestionCategory.INCIDENT_EDGES,
		text: "What are the edges incident to vertex $vertex in this graph?",
		graphGenerator: (params) => getRandomGraph(params),
		calculateCorrectAnswer: (params) => {
			const graph = params.graph;
			const vertex = (params as VertexQuestionParams).vertex;
			const incidentEdges = graph.edges
				.filter((e) => e.source === vertex || e.target === vertex)
				.map((e) => `{${e.source},${e.target}}`);
			return `{${incidentEdges.join(", ")}}`;
		},
		optionGenerator: (params, correctAnswer) => {
			// Get all edges
			const allEdges = getEdgesAsStringArray(params.graph);

			// Generate incorrect options by selecting different subsets of edges
			const wrongOptions = new Set<string>();

			// Option 1: Include one wrong edge
			const nonIncidentEdges = allEdges.filter((edge) => !correctAnswer.includes(edge));
			if (nonIncidentEdges.length > 0) {
				const incorrectEdges = correctAnswer.split(", ").slice(1, -1);
				incorrectEdges.push(nonIncidentEdges[0]);
				wrongOptions.add(`{${incorrectEdges.join(", ")}}`);
			}

			// Option 2: Remove one correct edge
			const correctEdges = correctAnswer.slice(1, -1).split(", ");
			if (correctEdges.length > 1) {
				wrongOptions.add(`{${correctEdges.slice(1).join(", ")}}`);
			}

			// Option 3: Add multiple wrong edges
			if (nonIncidentEdges.length >= 2) {
				const incorrectSet = [...nonIncidentEdges.slice(0, 2)];
				wrongOptions.add(`{${incorrectSet.join(", ")}}`);
			}

			const allOptions = [correctAnswer, ...Array.from(wrongOptions)];

			return allOptions.slice(0, 4).sort(() => Math.random() - 0.5);
		},
		generateParams: (graph) => {
			// Randomly select a vertex from the graph
			const vertices = graph.nodes.map((n) => n.id);
			const vertex = vertices[Math.floor(Math.random() * vertices.length)];
			return { graph, vertex, text: "" };
		},

		formatText: (params) => {
			const vertex = (params as VertexQuestionParams).vertex;
			return `What are the edges incident to vertex ${vertex} in this graph?`;
		},
		difficulty: "medium",
		graphOptions: {
			minNodes: 4,
			maxNodes: 6,
			density: 0.6,
		},
	},
	{
		id: 6,
		category: QuestionCategory.CONNECTIVITY,
		text: "Is the following graph connected?",
		graphGenerator: (params) => {
			if (Math.random() > 0.5) {
				return getConnectivityGraph(params); // Around (50% - epsilon) of the answers should be not connected
			} else {
				return getRandomGraph(params);
			}
		},
		calculateCorrectAnswer: (params) => (isConnected(params.graph) ? "Yes" : "No"),
		optionGenerator: () => {
			const allOptions = ["Yes", "No"];
			return allOptions.sort(() => Math.random() - 0.5);
		},
		difficulty: "easy",
	},
	{
		id: 7,
		category: QuestionCategory.MAX_DEGREE,
		text: "What is the maximum degree in the following graph?",
		graphGenerator: (params) => {
			const options: Partial<IGraphGeneratorOptions> = {
				weightRange: [2, 9],
				radius: 150,
				center: [150, 150],
				minimumVertexDegree: 1,
				directed: false,
			};
			return getRandomGraph({ ...options, ...params });
		},
		calculateCorrectAnswer: (params) => {
			const degrees = calculateVertexDegrees(params.graph);
			return findMaxDegree(degrees).toString();
		},
		optionGenerator: (params, correctAnswer) => {
			const maxDegree = parseInt(correctAnswer);
			return generateOptions(maxDegree);
		},
		difficulty: "medium",
		graphOptions: {
			minNodes: 5,
			maxNodes: 8,
			density: 0.7,
		},
	},
	{
		id: 8,
		category: QuestionCategory.MOST_DEGREE,
		text: "What degree appears most often in the following graph? If there are multiple, choose the smaller one.",
		graphGenerator: (params) => {
			const options: Partial<IGraphGeneratorOptions> = {
				weightRange: [2, 9],
				radius: 150,
				center: [150, 150],
				minimumVertexDegree: 1,
				directed: false,
			};
			return getRandomGraph({ ...options, ...params });
		},
		calculateCorrectAnswer: (params) => {
			const degrees = calculateVertexDegrees(params.graph);
			return findMostFrequentDegree(degrees).toString();
		},
		optionGenerator: (params, correctAnswer) => {
			const mostFrequentDegree = parseInt(correctAnswer);
			return generateOptions(mostFrequentDegree);
		},
		difficulty: "medium",
		graphOptions: {
			minNodes: 5,
			maxNodes: 8,
			density: 0.8,
		},
	},
	{
		id: 9,
		category: QuestionCategory.ADJACENT_VERTICES,
		text: "What are the vertices adjacent to vertex $vertex in this graph?",

		graphGenerator: (params) => getRandomGraph(params),
		calculateCorrectAnswer: (params) => {
			const graph = params.graph;
			const vertex = (params as VertexQuestionParams).vertex;
			const adjacentVertices = graph.edges
				.filter((e) => e.source === vertex || e.target === vertex)
				.map((e) => (e.source === vertex ? e.target : e.source));
			return adjacentVertices.sort().join(", ");
		},

		optionGenerator: (params, correctAnswer) => {
			const vertices = params.graph.nodes.map((n) => n.id);

			const correctVertices = correctAnswer.split(", ");

			const vertex = (params as VertexQuestionParams).vertex;

			const wrongOptions = new Set<string>();

			/* Create incorrect answers by taking the correct answer and replacing an adjacent vertex with a non-adjacent vertex.
			   If there are no more non-adjacent vertices, just delete some vertices from the correct answer without replacing them. 
			   If the searched vertex has only 1 or 2 adjacent vertices, then no vertices are deleted for some incorrect options and 
			   only incorrect ones are added. */
			const wrongVertices = vertices.filter((v) => v !== vertex && !correctVertices.includes(v));

			const createWrongOption = (deleteIndex: number, replacingVertex?: string): string => {
				const incompleteAnswer = correctVertices.filter((_, i) => i !== deleteIndex);
				return replacingVertex !== undefined
					? [...incompleteAnswer, replacingVertex].sort().join(", ")
					: incompleteAnswer.join(", ");
			};

			if (wrongVertices.length >= 3) {
				wrongOptions.add(createWrongOption(1, wrongVertices[0]));
				wrongOptions.add(createWrongOption(0, wrongVertices[1]));
				wrongOptions.add(createWrongOption(2, wrongVertices[2]));
			} else if (wrongVertices.length === 2) {
				wrongOptions.add(createWrongOption(1, wrongVertices[0]));
				wrongOptions.add(createWrongOption(0, wrongVertices[1]));
				wrongOptions.add(createWrongOption(2));
			} else if (wrongVertices.length === 1) {
				wrongOptions.add(createWrongOption(1, wrongVertices[0]));
				wrongOptions.add(createWrongOption(0));
				wrongOptions.add(createWrongOption(2));
			} else {
				wrongOptions.add(createWrongOption(0));
				wrongOptions.add(createWrongOption(1));
				wrongOptions.add(createWrongOption(2));
			}

			const allOptions = [correctAnswer, ...Array.from(wrongOptions)];

			return allOptions.slice(0, 4).sort(() => Math.random() - 0.5);
		},

		generateParams: (graph) => {
			const vertices = graph.nodes.map((n) => n.id);
			const vertex = vertices[Math.floor(Math.random() * vertices.length)];
			return { graph, vertex, text: "" };
		},

		formatText: (params) => {
			const vertex = (params as VertexQuestionParams).vertex;
			return `What are the vertices adjacent to vertex ${vertex} in this graph?`;
		},

		difficulty: "easy",

		graphOptions: {
			minNodes: 6,
			maxNodes: 8,
			density: 0.5,
		},
	},
	{
		id: 10,
		category: QuestionCategory.PATH,
		text: "Which of these paths from $start to $end is correct?",

		graphGenerator: (params) => {
			const graph = getRandomGraph(params);
			const vertices = graph.nodes.map((n) => n.id);
			const shuffled = [...vertices].sort(() => Math.random() - 0.5);

			// If a path exists, return the graph
			let path = hasAnyUndirectedPath(graph, shuffled);
			if (path.found) {
				(graph as GraphWithPathMeta).meta = {
					startVertex: path.start as string,
					endVertex: path.end as string,
				};
				return graph;
			}

			// If no path exists, add edges until a path exists
			for (let i = 0; i < vertices.length; i++) {
				for (let j = i + 1; j < vertices.length; j++) {
					if (
						!graph.edges.some(
							(edge) =>
								(edge.source === vertices[i] && edge.target === vertices[j]) ||
								(edge.source === vertices[j] && edge.target === vertices[i])
						)
					) {
						graph.edges.push({ source: vertices[i], target: vertices[j], weight: 0 });
						path = hasAnyUndirectedPath(graph, shuffled);
						if (path.found) {
							(graph as GraphWithPathMeta).meta = {
								startVertex: path.start as string,
								endVertex: path.end as string,
							};
							return graph;
						}
					}
				}
			}
			return graph;
		},

		calculateCorrectAnswer: (params) => {
			const { startVertex, endVertex } = params as PathQuestionParams;
			const path = findUndirectedPath(params.graph, startVertex, endVertex);
			return path !== null ? path.join(" → ") : "";
		},

		optionGenerator: (params, correctAnswer) => {
			const graph = params.graph;
			const vertices = graph.nodes.map((n) => n.id);
			const startVertex = (params as PathQuestionParams).startVertex;
			const endVertex = (params as PathQuestionParams).endVertex;

			const getNeighbors = (v: string): string[] => {
				return graph.edges
					.filter((e) => e.source === v || e.target === v)
					.map((e) => (e.source === v ? e.target : e.source));
			};

			const wrongOptions = new Set<string>();

			let attempts = 0;
			/* Create for every wrong option a path, which has 3 correct edges and only 1 wrong edge at a random index.
			   Each vertex only occurs once in the wrong path. */
			while (wrongOptions.size < 3 && attempts < 1000) {
				attempts += 1;
				const path = [startVertex];
				const used = new Set<string>([startVertex, endVertex]);

				const errorIndex = Math.floor(Math.random() * 4) + 1;

				let current = startVertex;
				let isWrongPathPossible = true;

				for (let i = 1; i <= 3; i++) {
					if (i === errorIndex) {
						const nonNeighbors = vertices.filter(
							(v) => v !== current && !getNeighbors(current).includes(v) && !used.has(v)
						);
						if (nonNeighbors.length === 0) {
							isWrongPathPossible = false;
							break;
						}
						const wrong = nonNeighbors[Math.floor(Math.random() * nonNeighbors.length)];
						path.push(wrong);
						used.add(wrong);
						current = wrong;
					} else {
						const neighbors = getNeighbors(current).filter((v) => !used.has(v) && v !== endVertex);
						if (neighbors.length === 0) {
							isWrongPathPossible = false;
							break;
						}
						const next = neighbors[Math.floor(Math.random() * neighbors.length)];
						path.push(next);
						used.add(next);
						current = next;
					}
				}

				if (!isWrongPathPossible) continue;

				path.push(endVertex);

				/* Ensure, that there is exactly 1 wrong edge in the path. This is needed because at the end the end vertex is
				   added and it can happen that 2 edges or no edge is wrong. */
				const invalidEdges = path.slice(1).filter((v, i) => {
					const from = path[i];
					return !getNeighbors(from).includes(v);
				});
				if (invalidEdges.length !== 1) continue;

				const optionString = path.join(" → ");
				wrongOptions.add(optionString);
			}

			/* Fallback: Create random wrong paths without restrictions. This loop always terminates, because with a density 
			   which is rather low (0.5 or less) there are many different ways to form wrong paths without restrictions. */
			while (wrongOptions.size < 3) {
				const wrongPath = [startVertex];
				const allRemainingVertices = vertices.filter((v) => v !== startVertex && v !== endVertex);
				while (wrongPath.length !== 5) {
					const randomVertex = allRemainingVertices[Math.floor(Math.random() * vertices.length)];
					if (!wrongPath.includes(randomVertex)) {
						wrongPath.push(randomVertex);
					}
				}
				const optionString = wrongPath.join(" → ");

				if (!isValidUndirectedPath(graph, wrongPath)) {
					wrongOptions.add(optionString);
				}
			}
			const allOptions = [correctAnswer, ...Array.from(wrongOptions)];
			return allOptions.slice(0, 4).sort(() => Math.random() - 0.5);
		},

		generateParams: (graph) => {
			const { startVertex, endVertex } = (graph as GraphWithPathMeta).meta;
			return { graph, startVertex, endVertex, text: "" };
		},

		formatText: (params) => {
			const { startVertex, endVertex } = params as PathQuestionParams;
			return `Find a path between ${startVertex} and ${endVertex}.`;
		},

		difficulty: "medium",

		/* The graph should not be complete, otherwise there are no false paths. That's why the density should be kept low.
		   Since only paths of length 4 are accepted, the number of vertices in the graph should be high (at least 8). */
		graphOptions: {
			minNodes: 8,
			maxNodes: 10,
			density: 0.5,
		},
	},
	{
		id: 11,
		category: QuestionCategory.PERFECT_MATCHING,
		text: "Which set is a perfect matching in the following graph?",

		graphGenerator: (params) => {
			const graph = getRandomGraph(params);
			const vertices = graph.nodes.map((n) => n.id);
			// If a perfect matching exists, return the graph
			const matching = findPerfectMatching(graph);
			if (matching !== null) {
				return graph;
			}
			// If no perfect matching exists, add edges until a perfect matching exists
			for (let i = 0; i < vertices.length; i++) {
				for (let j = i + 1; j < vertices.length; j++) {
					if (
						!graph.edges.some(
							(edge) =>
								(edge.source === vertices[i] && edge.target === vertices[j]) ||
								(edge.source === vertices[j] && edge.target === vertices[i])
						)
					) {
						graph.edges.push({ source: vertices[i], target: vertices[j], weight: 0 });
						const matching = findPerfectMatching(graph);
						if (matching !== null) {
							return graph;
						}
					}
				}
			}
			return graph;
		},

		calculateCorrectAnswer: (params) => {
			const matching = findPerfectMatching(params.graph);
			return matching !== null ? `{${matching.map(([a, b]) => `{${a},${b}}`).join(", ")}}` : "";
		},

		optionGenerator: (params, correctAnswer) => {
			const graph = params.graph;
			const vertices = graph.nodes.map((n) => n.id);
			const existingEdges = getEdgesAsStringArray(graph);

			const wrongOptions = new Set<string>();

			/* Create for every wrong option 4 random pairs. This loop always terminates, because with a density which is rather low
			   there are many different ways to form 4 different random pairs which doesn't build a perfect matching. */
			while (wrongOptions.size < 3) {
				const shuffled = [...vertices].sort(() => Math.random() - 0.5);

				const wrongMatching: Array<[string, string]> = [];
				for (let i = 0; i < shuffled.length; i += 2) {
					wrongMatching.push([shuffled[i], shuffled[i + 1]]);
				}

				const hasInvalidEdge = wrongMatching.some(([a, b]) => {
					const key1 = `{${a},${b}}`;
					const key2 = `{${b},${a}}`;
					return !existingEdges.includes(key1) && !existingEdges.includes(key2);
				});
				if (!hasInvalidEdge) continue;

				// If there is by chance a connection between two pairs, then insert them at the beginning of the set
				wrongMatching.sort((pairA, pairB) => {
					const keyA1 = `{${pairA[0]},${pairA[1]}}`;
					const keyA2 = `{${pairA[1]},${pairA[0]}}`;
					const keyB1 = `{${pairB[0]},${pairB[1]}}`;
					const keyB2 = `{${pairB[1]},${pairB[0]}}`;

					const aExists = existingEdges.includes(keyA1) || existingEdges.includes(keyA2);
					const bExists = existingEdges.includes(keyB1) || existingEdges.includes(keyB2);
					if (aExists && !bExists) return -1;
					if (!aExists && bExists) return 1;
					return 0;
				});

				const optionString = `{${wrongMatching
					.map(([a, b]) => {
						const [first, second] = a < b ? [a, b] : [b, a];
						return `{${first},${second}}`;
					})
					.join(", ")}}`;

				wrongOptions.add(optionString);
			}

			const allOptions = [correctAnswer, ...Array.from(wrongOptions)];
			return allOptions.sort(() => Math.random() - 0.5);
		},

		difficulty: "medium",

		/* The graph should not be complete, otherwise there are only perfect matchings. 
		   The number of vertices must always be an even number. 
		   The density should be rather low. */
		graphOptions: {
			minNodes: 8,
			maxNodes: 8,
			density: 0.5,
		},
	},
	{
		id: 12,
		category: QuestionCategory.ARC_SET,
		text: "What is the set A in the following digraph G = (V, A), with V = {$vertices}?",
		graphGenerator: (params) => getRandomGraph(params),
		calculateCorrectAnswer: (params) =>
			`{${params.graph.edges.map((e) => `(${e.source},${e.target})`).join(", ")}}`,
		optionGenerator: (params, correctAnswer) => {
			const graph = params.graph;
			const vertices = graph.nodes.map((n) => n.id);
			const correctArcsArray = graph.edges.map((e) => `(${e.source},${e.target})`);

			// Get all possible valid arcs between nodes
			const getAllPossibleArcs = (): string[] => {
				const possibleArcs = [];
				for (let i = 0; i < vertices.length; i++) {
					for (let j = 0; j < vertices.length; j++) {
						if (i !== j) {
							possibleArcs.push(`(${vertices[i]},${vertices[j]})`);
						}
					}
				}
				return possibleArcs;
			};

			const wrongOptions = new Set<string>();
			const allPossibleArcs = getAllPossibleArcs();
			const unusedArcs = allPossibleArcs.filter((arc) => !correctArcsArray.includes(arc));

			// Try Option 1 first: Remove one arc and add a different valid arc
			for (let i = 0; i < correctArcsArray.length && wrongOptions.size < 3; i++) {
				for (let j = 0; j < unusedArcs.length && wrongOptions.size < 3; j++) {
					const arcArrayCopy = [...correctArcsArray];
					arcArrayCopy.splice(i, 1);
					arcArrayCopy.push(unusedArcs[j]);
					const newOption = `{${arcArrayCopy.sort(() => Math.random() - 0.5).join(", ")}}`;
					if (newOption !== correctAnswer) {
						wrongOptions.add(newOption);
					}
				}
			}

			// If we still need more options, fall back to Option 2: Remove one arc
			if (wrongOptions.size < 3 && graph.edges.length > 1) {
				for (let i = 0; i < correctArcsArray.length && wrongOptions.size < 3; i++) {
					const arcArrayCopy = [...correctArcsArray];
					arcArrayCopy.splice(i, 1);
					const newOption = `{${arcArrayCopy.sort(() => Math.random() - 0.5).join(", ")}}`;
					if (newOption !== correctAnswer) {
						wrongOptions.add(newOption);
					}
				}
			}

			// If we still don't have enough options, duplicate the last one
			const finalWrongOptions = Array.from(wrongOptions);
			while (finalWrongOptions.length < 3) {
				finalWrongOptions.push(
					finalWrongOptions[finalWrongOptions.length - 1] !== ""
						? finalWrongOptions[finalWrongOptions.length - 1]
						: correctAnswer
				);
			}

			const allOptions = [correctAnswer, ...finalWrongOptions.slice(0, 3)];
			return allOptions.sort(() => Math.random() - 0.5);
		},

		formatText: (params) => {
			return params.text.replace("$vertices", `${params.graph.nodes.map((n: IUserNode) => n.id).join(", ")}`);
		},

		difficulty: "easy",

		graphOptions: {
			minNodes: 4,
			maxNodes: 5,
			density: 0.3,
			directed: true,
		},
	},
	// Add more questions based on PDF...
];

// Function to generate the options for the questions where the answer is only a number
function generateOptions(correctNumber: number): string[] {
	const allOptions = new Set<number>();
	const totalOptions = 4;
	allOptions.add(correctNumber);

	while (allOptions.size < totalOptions) {
		const offset = Math.floor(Math.random() * 7) - 3;
		if (offset !== 0 && correctNumber + offset > 0) {
			allOptions.add(correctNumber + offset);
		}
	}

	return Array.from(allOptions)
		.sort((a, b) => a - b)
		.map(String);
}

// Utility function to get only chosen categories
export const getRandomQuestion = (
	categories: QuestionCategory[],
	usedCategories: QuestionCategory[],
	difficulty?: "easy" | "medium" | "hard"
): QuestionTemplate => {
	const remainingCategories = categories.filter((category) => !usedCategories.includes(category));
	const randomCategory = remainingCategories[Math.floor(Math.random() * remainingCategories.length)];
	let filteredQuestions = questionTemplates.filter((q) => q.category === randomCategory);

	if (difficulty !== undefined && difficulty !== null) {
		filteredQuestions = filteredQuestions.filter((q) => q.difficulty === difficulty);
	}

	return filteredQuestions[0];
};

// Helper function to handle params generation
function getParams<T extends QuestionParams>(template: QuestionTemplate<T>, graph: GraphTS<NodeTS, LinkTS>): T {
	if (template.generateParams !== null && template.generateParams !== undefined) {
		return { ...template.generateParams(graph), text: template.text };
	}
	// If no generateParams provided, return graph as BaseQuestionParams
	const params: T = { graph: { ...graph }, text: template.text } as unknown as T;
	return params;
}

// Utility function to generate question instance
export const generateQuestionInstance = (template: QuestionTemplate): Question => {
	const graph = template.graphGenerator(
		template.graphOptions !== null && template.graphOptions !== undefined
			? template.graphOptions
			: generalGraphOptionsDefaults
	);
	const params = getParams(template, graph);
	const correctAnswer = template.calculateCorrectAnswer(params);
	const options = template.optionGenerator(params, correctAnswer);
	const correctAnswerIndex = options.indexOf(correctAnswer);
	const text =
		template.formatText !== null && template.formatText !== undefined ? template.formatText(params) : template.text;

	return {
		...template,
		graph,
		options,
		correctAnswerIndex,
		correctAnswer,
		text,
	};
};
