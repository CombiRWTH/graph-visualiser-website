import React, { useEffect, useState } from "react";
import { usePrimStore } from "../../algorithms/prim/store";
import { TrainingForm } from "../../components/TrainingForm";
import { useForm } from "react-hook-form";
import { compareUndirectedEdges } from "../../utils/compareEdges";
import { AvailableAlgorithm, ITrainingPageProps } from "../../utils/available-algorithms";
import { useTrainingStagesStore } from "../../hooks/TrainingStagesStore";
import { Feedback, FeedbackAlert } from "../../components/FeedbackAlert";
import { Footer } from "./stepMode/Footer";
import { Content } from "./stepMode/Content";
import { TrainingFormNewGraphButton } from "../../components/TrainingFormButtons";
import { TrainingEvaluation } from "../../components/TrainingEvaluation";
import { LayoutAlgorithm } from "../../algorithms/algorithm-interfaces";

interface Edge {
	node1: string;
	node2: string;
}

export interface FormValues {
	action: "addEdge" | "done" | undefined;
	edge: Edge;
}

const defaultFormValues: FormValues = {
	action: undefined,
	edge: { node1: "-", node2: "-" },
};

export enum AlgorithmStages {
	EdgeSelection,
	Results,
}

export const StepTrainingPage: React.FC<ITrainingPageProps> = ({ setGraphState }) => {
	const { getVisState, nextStep, resetGraph, initialGraph, setNewGraph, setLayoutAlgorithm } = usePrimStore(
		(state) => ({
			...state,
		})
	);
	const {
		handleSubmit,
		setValue,
		reset,
		watch,
		control,
		formState: { isSubmitSuccessful },
	} = useForm<FormValues>({ defaultValues: defaultFormValues });
	const { resetStages, setStageList, currentStage, increaseWrongAnswersBy, increaseTotalAnswersBy } =
		useTrainingStagesStore();
	const [feedback, setFeedback] = useState<Feedback>();

	const isAlgorithmTerminated: boolean = getVisState()?.treeNodes.length === getVisState()?.graph.nodes.length;
	const isEdgeSelectionStage: boolean = currentStage === AlgorithmStages.EdgeSelection;
	const isResultsStage: boolean = currentStage === AlgorithmStages.Results;
	const isTrainingCompleted = getVisState()?.lineOfCode === undefined;

	useEffect(() => {
		initFeedback();
		initGraphState();
		initAlgorithmStages();
		return () => {
			resetGraph();
			resetStages();
		};
	}, [initialGraph]);

	useEffect(() => {
		reset();
	}, [isSubmitSuccessful]);

	const onAnswer = (data: FormValues): void => {
		forwardVisStateToEdgeChoice();
		evaluateAnswer(data);
		forwardVisStateToNextActionSelection();

		highlightEdges();
	};

	const forwardToPseudocodeLine = (line: number): void => {
		do {
			if (getVisState()?.lineOfCode === 5 || getVisState()?.lineOfCode === undefined) break;
			nextStep();
		} while (getVisState()?.lineOfCode !== line);
	};
	const forwardVisStateToEdgeChoice = (): void => {
		forwardToPseudocodeLine(2);
	};
	const forwardVisStateToNextActionSelection = (): void => {
		forwardToPseudocodeLine(3);
	};

	const highlightEdges = (): void => {
		setGraphState(getVisState()!.graph);
	};

	const evaluateAnswer = (data: FormValues): void => {
		const feedback: Feedback = isAnswerCorrect(data);

		setFeedback(feedback);
		updateScore(feedback.isAnswerCorrect);
	};

	const isAnswerCorrect = (data: FormValues): Feedback => {
		const chosenEdge: [string, string] = [data.edge.node1, data.edge.node2];
		const correctEdge = getVisState()?.bestOutgoing?.map((node) => node.toString()) as [string, string];
		const isCorrectEdgeChosen = data.action === "addEdge" && compareUndirectedEdges(chosenEdge, correctEdge);

		if (isAlgorithmTerminated) {
			return { isAnswerCorrect: data.action === "done", feedbackText: "Wrong! Correct is done." };
		}

		return { isAnswerCorrect: isCorrectEdgeChosen, feedbackText: `Wrong! Correct is (${correctEdge.toString()}).` };
	};

	const updateScore = (isActionCorrect: boolean): void => {
		increaseTotalAnswersBy(1);

		if (!isActionCorrect) {
			increaseWrongAnswersBy(1);
		}
	};

	const initFeedback = (): void => {
		setFeedback(undefined);
	};

	const initGraphState = (): void => {
		setGraphState(getVisState()!.graph);
	};

	const initAlgorithmStages = (): void => {
		setStageList([
			{
				stageId: AlgorithmStages.EdgeSelection,
				shortTitle: "Edge Selection",
				title: "Choose Edge",
				info: "Select an edge by choosing two nodes and click 'ADD EDGE'. Alternatively click 'DONE'.",
				wrongAnswers: 0,
				answers: 0, // increases implicitly during the training
			},
			{
				stageId: AlgorithmStages.Results,
				shortTitle: "Results",
				title: "Algorithm finished",
				info: "If you click on new graph, you can repeat the training mode with a random graph.",
			},
		]);
	};

	const onNewGraph = (): void => {
		setLayoutAlgorithm(LayoutAlgorithm.Circle);
		const newGraph = AvailableAlgorithm.Prim.getRandomGraph();
		setNewGraph(newGraph);
	};

	return (
		<TrainingForm
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			onSubmit={handleSubmit(onAnswer)}
			useAlgorithmStore={usePrimStore}
			controls={
				isResultsStage ? (
					<TrainingFormNewGraphButton onClick={onNewGraph} />
				) : (
					<Footer
						isTrainingCompleted={isTrainingCompleted}
						setValue={setValue}
						watch={watch}
					/>
				)
			}
			feedback={feedback !== undefined && !isResultsStage && <FeedbackAlert feedback={feedback} />}
		>
			{isEdgeSelectionStage && (
				<Content
					isDisabled={isTrainingCompleted}
					control={control}
				/>
			)}
			{isResultsStage && <TrainingEvaluation />}
		</TrainingForm>
	);
};
