import React, { useState, useEffect } from "react";
import { CircleCheck, CircleX, ArrowRight, RefreshCw } from "lucide-react";
import { Question, QuestionCategory, QuestionEvaluation } from "../../types/question-types";
import { getRandomQuestion, generateQuestionInstance } from "../../database/conceptQuestionsData";
import { GraphTS } from "../../utils/graphs";
import { LinkTS, NodeTS, toRSGraph, toTSGraph } from "../../algorithms/adapter";

interface QuestionDisplayProps {
	onGraphChange: (graph: GraphTS<NodeTS, LinkTS>) => void;
	onAnswerSubmit?: (isCorrect: boolean) => void;
	maxQuestions: number;
	categories: QuestionCategory[];
	difficulty?: "easy" | "medium" | "hard";
	score: { correct: number; total: number };
	setScore: React.Dispatch<React.SetStateAction<{ correct: number; total: number }>>;
	onAnswer: (record: QuestionEvaluation) => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
	onGraphChange,
	onAnswerSubmit,
	maxQuestions,
	categories,
	difficulty,
	score,
	setScore,
	onAnswer,
}) => {
	const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
	const [firstAttempt, setFirstAttempt] = useState(true);
	const [loading, setLoading] = useState(false);
	const [disabledAnswers, setDisabledAnswers] = useState<number[]>([]);
	const [usedCategories, setUsedCategories] = useState<QuestionCategory[]>([]);

	const generateNewQuestion = (): void => {
		setLoading(true);
		const template = getRandomQuestion(categories, usedCategories, difficulty);
		const question = generateQuestionInstance(template);
		setCurrentQuestion(question);
		onGraphChange({ ...toTSGraph(toRSGraph(question.graph)), directed: question.graph.directed });
		setSelectedAnswer(null);
		setIsAnswerCorrect(null);
		setFirstAttempt(true);
		setLoading(false);
		setDisabledAnswers([]);
	};

	useEffect(() => {
		generateNewQuestion();
	}, [categories, difficulty]);

	const handleAnswerSelect = (index: number): void => {
		if (isAnswerCorrect === null) {
			setSelectedAnswer(index);
		}
	};

	const handleSubmit = (): void => {
		if (selectedAnswer !== null && currentQuestion !== null) {
			const isCorrect = selectedAnswer === currentQuestion.correctAnswerIndex;
			setIsAnswerCorrect(isCorrect);

			if (firstAttempt) {
				onAnswer({
					category: currentQuestion.category.replace("_", " ") as QuestionCategory,
					isCorrect,
				});
			}

			if (isCorrect) {
				setScore((prev) => ({
					correct: prev.correct + (firstAttempt ? 1 : 0),
					total: prev.total + 1,
				}));
				onAnswerSubmit?.(true);
				setUsedCategories((prev) => {
					const updated = [...prev, currentQuestion.category];
					return updated.length === categories.length ? [] : updated;
				});
			} else {
				onAnswerSubmit?.(false);
				setFirstAttempt(false);
				setDisabledAnswers((prev) => [...prev, selectedAnswer]);
			}
		}
	};

	const handleNext = (): void => {
		generateNewQuestion();
	};

	if (loading || currentQuestion === null) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="animate-spin">
					<RefreshCw className="size-8" />
				</div>
			</div>
		);
	}

	return (
		<div className="card w-full bg-base-100 shadow-xl">
			<div className="card-body">
				{/* Progress bar */}
				<div className="mb-4">
					<div className="mb-1 flex justify-between font-medium">
						<span>Progress</span>
						<span>
							{score.total}/{maxQuestions}
						</span>
					</div>
					<progress
						className="progress progress-primary h-4 w-full"
						value={score.total}
						max={maxQuestions}
					></progress>
				</div>

				{/* Hint */}
				{!firstAttempt &&
					isAnswerCorrect !== true &&
					(() => {
						const map = {
							[QuestionCategory.CONNECTIVITY]:
								"Hint: A Graph G = (V,E) is called connected, if either |V| = 1 or there is a (u,v)-path for all u, v ∈ V.",
							[QuestionCategory.MAX_DEGREE]:
								"Hint: The degree of a vertex denotes the number of edges, which are incident to the vertex.",
							[QuestionCategory.MOST_DEGREE]:
								"Hint: The degree of a vertex denotes the number of edges, which are incident to the vertex.",
							[QuestionCategory.EDGE_COUNT]:
								"Hint: An edge {u,v} is an arc, which connects the vertices u and v.",
							[QuestionCategory.EDGE_SET]:
								"Hint: An edge {u,v} is an arc, which connects the vertices u and v.",
							[QuestionCategory.INCIDENT_EDGES]:
								"Hint: An edge {u,v} is incident to the vertices u and v.",
							[QuestionCategory.TREE]: "Hint: A connected graph is a tree, if it contains no cycle.",
							[QuestionCategory.VERTEX_COUNT]:
								"Hint: A vertex corresponds to a node in the graph, where edges begin or end.",
							[QuestionCategory.ADJACENT_VERTICES]:
								"Hint: Two vertices are adjacent, if they are connected via an edge.",
							[QuestionCategory.PATH]:
								"Hint: A path from s to t is an edge sequence e₁e₂...eₖ starting in s and ending in t.",
							[QuestionCategory.PERFECT_MATCHING]:
								"Hint: A perfect matching is a set of pairwise disjoint edges, where no two edges are incident to the same node and each node is incident to one edge in the matching",
							[QuestionCategory.ARC_SET]:
								"Hint: A directed arc (u,v) is an edge with direction, where u is the starting node and v is the ending node.",
						};
						const hintCategory = map[currentQuestion.category as keyof typeof map];

						return (
							<div className="alert alert-info">
								<span className="font-semibold">{hintCategory}</span>
							</div>
						);
					})()}

				{/* Header */}
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h2 className="card-title">Graph Theory Question</h2>
						<p className="text-sm opacity-70">Category: {currentQuestion.category.replace("_", " ")}</p>
					</div>
					<div className="badge badge-primary h-auto min-w-0 whitespace-nowrap px-2 text-xs">
						Score: {score.correct}/{score.total}
					</div>
				</div>

				{/* Question Text */}
				<div className="mb-6 text-lg font-medium">{currentQuestion.text}</div>

				{/* Options */}
				<div className="mb-6 space-y-3">
					{currentQuestion.options.map((option: string, index: number) => (
						<button
							key={index}
							className={`btn h-auto w-full justify-start py-3 normal-case ${
								isAnswerCorrect === true && index === currentQuestion.correctAnswerIndex
									? "border-success"
									: ""
							} ${selectedAnswer === index ? "btn-primary" : "btn-ghost"}`}
							onClick={() => handleAnswerSelect(index)}
							disabled={isAnswerCorrect !== null || disabledAnswers.includes(index)}
						>
							<span className="flex-1 text-left">{option}</span>
							{isAnswerCorrect === true && index === currentQuestion.correctAnswerIndex && (
								<CircleCheck className="ml-2 size-5 text-success" />
							)}
							{isAnswerCorrect === false &&
								index === selectedAnswer &&
								index !== currentQuestion.correctAnswerIndex && (
									<CircleX className="ml-2 size-5 text-error" />
								)}
						</button>
					))}
				</div>

				{/* Feedback Alert */}
				{isAnswerCorrect !== null && (
					<div
						className={`alert ${selectedAnswer === currentQuestion.correctAnswerIndex ? "alert-success" : "alert-error"} mb-6`}
					>
						<div>
							<h4 className="font-bold">
								{selectedAnswer === currentQuestion.correctAnswerIndex ? "Correct!" : "Incorrect"}
							</h4>
							<p className="text-sm">
								{selectedAnswer === currentQuestion.correctAnswerIndex
									? "Well done! You got it right."
									: "Please take a look at the hint and try again!"}
							</p>
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className="card-actions justify-end">
					{isAnswerCorrect === null ? (
						<button
							onClick={handleSubmit}
							disabled={selectedAnswer === null}
							className="btn btn-primary min-w-[100px]"
						>
							Submit
						</button>
					) : isAnswerCorrect ? (
						<button
							onClick={handleNext}
							className="btn btn-primary min-w-[100px]"
						>
							Next <ArrowRight className="ml-2 size-4" />
						</button>
					) : (
						<button
							onClick={() => {
								setSelectedAnswer(null);
								setIsAnswerCorrect(null);
							}}
							className="btn btn-primary min-w-[100px]"
						>
							Try Again
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default QuestionDisplay;
