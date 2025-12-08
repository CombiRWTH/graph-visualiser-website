import { LinkTS, NodeTS } from "../algorithms/adapter";
import { IGraphGeneratorOptions } from "../algorithms/algorithm-interfaces";
import { GraphTS } from "../utils/graphs";

export enum QuestionCategory {
	EDGE_SET = "EDGE_SET",
	VERTEX_COUNT = "VERTEX_COUNT",
	EDGE_COUNT = "EDGE_COUNT",
	TREE = "TREE",
	INCIDENT_EDGES = "INCIDENT_EDGES",
	CONNECTIVITY = "CONNECTIVITY",
	MAX_DEGREE = "MAX_DEGREE",
	MOST_DEGREE = "MOST_DEGREE",
	ADJACENT_VERTICES = "ADJACENT_VERTICES",
	PATH = "PATH",
	PERFECT_MATCHING = "PERFECT_MATCHING",
	ARC_SET = "ARC_SET",
}

export interface QuestionEvaluation {
	category: QuestionCategory;
	isCorrect: boolean;
}

export interface Question {
	text: string;
	category: QuestionCategory;
	graph: GraphTS<NodeTS, LinkTS>;
	options: string[];
	correctAnswerIndex: number;
	correctAnswer: string;
}

export interface BaseQuestionParams {
	// Base parameters that all questions might need
	graph: GraphTS<NodeTS, LinkTS>;
	text: string;
}

export interface VertexQuestionParams extends BaseQuestionParams {
	vertex: string; // For questions about specific vertices
}

export interface PathQuestionParams extends BaseQuestionParams {
	startVertex: string;
	endVertex: string; // For path-related questions
}

// Union type for all possible parameter types
export type QuestionParams = BaseQuestionParams | VertexQuestionParams | PathQuestionParams;

export interface QuestionTemplate<T extends QuestionParams = BaseQuestionParams> {
	id: number;
	category: QuestionCategory;
	text: string;
	graphGenerator: (options: Partial<IGraphGeneratorOptions>) => GraphTS<NodeTS, LinkTS>;

	// Update function signatures to include params
	calculateCorrectAnswer: (params: T) => string;
	optionGenerator: (params: T, correctAnswer: string) => string[];

	difficulty: "easy" | "medium" | "hard";
	graphOptions?: Partial<IGraphGeneratorOptions>;

	// Optional function to generate question params from a graph
	generateParams?: (graph: GraphTS<NodeTS, LinkTS>) => T;

	// Optional function to format the question text with params
	formatText?: (params: T) => string;
}
