import { useState } from "react";
import { GraphTS } from "../../utils/graphs";
import { IUserEdge, IUserNode } from "@antv/graphin";
import QuestionDisplay from "./QuestionDisplay";
import SimpleGraph from "./SvgGraph";
import Feedback from "./Feedback";
import { QuestionCategory, QuestionEvaluation } from "../../types/question-types";
import CategorySelection from "./CategorySelection";

interface GraphConceptTrainingPageProps {
	className?: string;
	classNameLeft?: string;
	classNameRight?: string;
}

export const GraphConceptTrainingPage: React.FC<GraphConceptTrainingPageProps> = () => {
	const [graphState, setGraphState] = useState<GraphTS<IUserNode, IUserEdge>>({
		nodes: [],
		edges: [],
	});

	const [hasStarted, setHasStarted] = useState(false);
	const [maxQuestions, setMaxQuestions] = useState<number | null>(10);
	const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([]);
	const [score, setScore] = useState({ correct: 0, total: 0 });
	const [questionEvaluation, setQuestionEvaluation] = useState<QuestionEvaluation[]>([]);

	if (!hasStarted) {
		return (
			<CategorySelection
				onStart={(maxQuestions, categories) => {
					setMaxQuestions(maxQuestions);
					setSelectedCategories(categories);
					setHasStarted(true);
				}}
			/>
		);
	}

	if (score.total === maxQuestions) {
		return (
			<Feedback
				correctAnswers={score.correct}
				maxQuestions={maxQuestions}
				questionEvaluation={questionEvaluation}
			/>
		);
	}

	return (
		<div className="flex max-h-screen w-full flex-col gap-5 overflow-auto p-5 lg:flex-row">
			<div className="flex w-full justify-center lg:w-1/2">
				<QuestionDisplay
					onGraphChange={setGraphState}
					onAnswerSubmit={(isCorrect) => {
						console.log(`Answer was ${isCorrect ? "correct" : "incorrect"}`);
					}}
					maxQuestions={maxQuestions as number}
					categories={selectedCategories}
					score={score}
					setScore={setScore}
					onAnswer={(record: QuestionEvaluation) => {
						setQuestionEvaluation((prev) => [...prev, record]);
					}}
				/>
			</div>
			<div className="flex w-full items-center justify-center lg:w-1/2">
				<div className="mb-6 w-full">
					{/* {isInitialized && <Visualiser
                    data={graphState}
                    layoutAlgorithm={LayoutAlgorithm.Circle}
                />} */}
					<SimpleGraph
						graph={graphState}
						nodeRadius={15}
					/>
				</div>
			</div>
		</div>
	);
};
