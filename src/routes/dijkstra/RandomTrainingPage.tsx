import { useState, useEffect } from "react";
import { GraphTS } from "../../utils/graphs";
import { useDijkstraStore } from "../../algorithms/dijkstra/store";
import { TrainingForm } from "../../components/TrainingForm";
import { getRandomInt } from "../../utils/randomInt";
import { TrainingFormNextQuestionButton } from "../../components/TrainingFormButtons";
import { Spinner } from "../../components/Spinner";
import { useForm } from "react-hook-form";
import { AvailableAlgorithm, ITrainingPageProps } from "../../utils/available-algorithms";
import { useTrainingStagesStore } from "../../hooks/TrainingStagesStore";
import { Feedback, FeedbackAlert } from "../../components/FeedbackAlert";
import { LinkTS, NodeTS } from "../../algorithms/adapter";
import { LayoutAlgorithm } from "../../algorithms/algorithm-interfaces";

enum TrainingStages {
	Initialization,
	ChooseVertex,
	DistanceUpdate,
	PredecessorUpdate,
	SpaceComplexity,
	Queue,
	Runtime,
}

export const RandomTrainingPage: React.FC<ITrainingPageProps> = ({ setGraphState }) => {
	const { getVisState, nextStep, resetGraph, setNewGraph, initialGraph, setLayoutAlgorithm } = useDijkstraStore();
	const { resetStages, setStageList, setCurrentStage, getCurrentStage } = useTrainingStagesStore();

	// Contains the 4 calculated answer options for a given type of Question
	const [answerOptions, setAnswerOptions] = useState<IAnswer[]>([]);
	// Index of the answer the user selected
	const [chosenAnswerIndex, setChosenAnswerIndex] = useState<number | null>(null);
	// Index of the correct answer
	const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
	// State to update the component if a new exercise should be computed
	const [newGraphClicked, setNewGraphClicked] = useState<boolean>(false);
	// The graph that should be displayed after the user has selected an answer
	const [solutionGraph, setSolutionGraph] = useState<GraphTS<NodeTS, LinkTS>>();
	// Displayed Feedback for wrong answers
	const [feedback, setFeedback] = useState<Feedback>({ isAnswerCorrect: true });

	const { handleSubmit } = useForm();

	// Constant arrays of question types currently implemented in Random Mode
	const allQuestions: string[] = ["init", "nextVertex", "distance", "predecessor", "runtime", "queue", "space"];
	// Static questions are general questions independent of any graph
	const staticQuestions: string[] = ["init", "runtime", "queue", "space"];
	const previousSelectedQuestions: string[] = [];

	// Interface for the answers that are displayed as options for each question
	interface IAnswer {
		answerText: string;
		isCorrect: boolean;
	}

	/**
	 * Static Questions
	 */
	const runtimeAnswers: IAnswer[] = [
		{ answerText: "|E| + |V| log |V|", isCorrect: true },
		{ answerText: "|V| + |E| log |E|", isCorrect: false },
		{ answerText: "|V| + |E|", isCorrect: false },
		{ answerText: "|E| log |V|", isCorrect: false },
		{ answerText: "|V| log |E|", isCorrect: false },
		{ answerText: "|V|²", isCorrect: false },
		{ answerText: "|E|²", isCorrect: false },
	];

	const spaceAnswers: IAnswer[] = [
		{ answerText: "|V|", isCorrect: true },
		{ answerText: "|E|", isCorrect: false },
		{ answerText: "log |V|", isCorrect: false },
		{ answerText: "log |E|", isCorrect: false },
		{ answerText: "|V|²", isCorrect: false },
		{ answerText: "|E|²", isCorrect: false },
		{ answerText: "|V| + |E|", isCorrect: false },
	];

	// In the script it says Fibonacci Heap which is a data structure for priority queues
	const queueAnswers: IAnswer[] = [
		{ answerText: "Priority queue", isCorrect: true },
		{ answerText: "Stack", isCorrect: false },
		{ answerText: "Queue", isCorrect: false },
		{ answerText: "Hash table", isCorrect: false },
		{ answerText: "Array", isCorrect: false },
		{ answerText: "Linked list", isCorrect: false },
		{ answerText: "Binary search tree", isCorrect: false },
	];

	const initAnswers: IAnswer[] = [
		{ answerText: "Set all distances to infinity", isCorrect: true },
		{ answerText: "Set all distances to 0", isCorrect: false },
		{ answerText: "Set all distances to 1", isCorrect: false },
		{ answerText: "Set distance of S to 0", isCorrect: true },
		{ answerText: "Set distance of S to infinity", isCorrect: false },
		{ answerText: `Set distance of S to ${getRandomInt(1, 10)}`, isCorrect: false },
		{ answerText: "Set all predecessors to Null", isCorrect: true },
		{ answerText: "Set all predecessors to S", isCorrect: false },
		{ answerText: "Set all predecessors to nearest neighbour", isCorrect: false },
		{ answerText: "Set predecessor of S to S", isCorrect: true },
		{ answerText: "Set predecessor of S to nearest neighbour", isCorrect: false },
	];

	/**
	 * Dynamic Questions which are filled with values according to the current graph
	 */
	const vertexAnswers: IAnswer[] = [
		{ answerText: "Choose vertex ", isCorrect: true },
		{ answerText: "Algorithm is finished", isCorrect: false },
	];
	const distanceAnswers: IAnswer[] = [
		{ answerText: "Update distance of Vertex vertex_id to new_distance", isCorrect: true },
		{ answerText: "No distances need to be updated", isCorrect: false },
	];

	const predecessorAnswers: IAnswer[] = [
		{ answerText: "Update predecessor of Vertex vertex_id to new_predecessor", isCorrect: true },
		{ answerText: "No predecessors need to be updated", isCorrect: false },
	];

	/**
	 * Chooses a random question type based on following criteria:
	 * - 1: Static Questions should hava a "cooldown" of 10 rounds before they can be selected again
	 * - 2: The same type of question should not be chosen two times in a row
	 *
	 * @returns Randomly selected question type
	 */
	const chooseRandomOption = (): string => {
		// Filters the allQuestions list according to the above criteria
		const filteredQuestions = allQuestions.filter((question) => {
			// Criterion 1
			if (question === previousSelectedQuestions[previousSelectedQuestions.length - 1]) return false;
			// Criterion  2
			if (previousSelectedQuestions.includes(question) && staticQuestions.includes(question)) return false;
			// If element does not break one of the criteria it is added to the filteredQuestions list
			return true;
		});

		// Select a random question type from the filtered List
		const randomIndex: number = Math.floor(Math.random() * filteredQuestions.length);
		const chosenAnswer: string = filteredQuestions[randomIndex];

		// We keep track of the last 10 selected questions and remove the first element if the list gets larger
		if (previousSelectedQuestions.length > 10) previousSelectedQuestions.shift();
		// Add the newly chosen type to the end of the list
		previousSelectedQuestions.push(chosenAnswer);

		return chosenAnswer;
	};

	/**
	 * Selects four random answers from a given array of answer options
	 *
	 * @param answers The array of answer options for the selected type of question
	 * @returns Returns one true and three false answers
	 */
	const selectRandomAnswers = (answers: IAnswer[]): IAnswer[] => {
		const selectedAnswers: IAnswer[] = [];

		// Split given answers between correct and incorrect
		const trueAnswers = answers.filter((answer) => answer.isCorrect);
		const falseAnswers = answers.filter((answer) => !answer.isCorrect);

		// Add one randomly selected correct answer
		selectedAnswers.push(trueAnswers[getRandomInt(0, trueAnswers.length - 1)]);

		// Add three random false answers
		for (let i = 0; i < 3; i++) {
			const selectedIndex = getRandomInt(0, falseAnswers.length - 1);
			selectedAnswers.push(falseAnswers[selectedIndex]);
			falseAnswers.splice(selectedIndex, 1);
		}

		// "Shuffle" answers so that correct answer is at a random position
		selectedAnswers.sort(() => Math.random() - 0.5);

		return selectedAnswers;
	};

	/**
	 * Vertex Exercise: Calculates the solution and specific answer options for a given graph
	 */
	const selectVertexExercise = (): void => {
		console.time("selectVertexExercise");
		// Represents marked vertices in correct order
		const activeNodes: number[] = [];
		const exerciseGraphs: Array<GraphTS<NodeTS, LinkTS>> = [];
		let currentActiveNode = -1;

		while (getVisState()?.lineOfCode !== undefined) {
			const visState = getVisState();
			if (visState !== undefined && visState !== null) {
				const activeNode = visState.activeNode;
				if (activeNode !== null && currentActiveNode !== activeNode) {
					activeNodes.push(activeNode);
					currentActiveNode = activeNode;
				}

				if (visState.lineOfCode === 4) {
					exerciseGraphs.push(visState.graph);
				}
			}

			nextStep();
		}

		const randomVertexCount = getRandomInt(0, activeNodes.length - 3);
		setGraphState(exerciseGraphs[randomVertexCount]);
		setSolutionGraph(exerciseGraphs[randomVertexCount + 1]);

		// Prepare answers for current exercise
		const tempAnswers = [...vertexAnswers];

		const nextVertex = activeNodes[randomVertexCount];
		const wrongNodes = activeNodes.slice(randomVertexCount + 1);

		// Add correct vertex as answer
		let tempAnswer: IAnswer = { ...tempAnswers[0] };
		// chosen node is only null when no vertices are marked already -> then 0 is always the correct answer
		// TODO: inspect if chosenNode can be set to 0 in the code above
		tempAnswer.answerText += nextVertex.toString();
		tempAnswers.push(tempAnswer);
		// Add false answers for all not marked vertices
		wrongNodes.forEach((node) => {
			tempAnswer = { ...tempAnswers[0] };
			tempAnswer.answerText += node.toString();
			tempAnswer.isCorrect = false;
			tempAnswers.push(tempAnswer);
		});

		tempAnswers.shift();

		setAnswerOptions(selectRandomAnswers(tempAnswers));
		console.timeEnd("selectVertexExercise");
	};

	interface distanceUpdate {
		node: number;
		newDistance: number;
	}

	/**
	 * Distance Exercise: Calculates the solution and specific answer options for a given graph
	 */
	const updateDistanceExercise = (): void => {
		const distanceUpdates: distanceUpdate[][] = [];
		const exerciseGraphs: Array<GraphTS<NodeTS, LinkTS>> = [];
		// Represents marked vertices in correct order
		let updates: distanceUpdate[] = [];
		while (getVisState()?.lineOfCode !== undefined) {
			const visState = getVisState();
			if (visState !== undefined && visState !== null) {
				if (visState.lineOfCode === 8) {
					updates.push(getDistanceUpdate(visState.helptext));
				}

				if (visState.lineOfCode === 4) {
					distanceUpdates.push(updates);
					updates = [];
					exerciseGraphs.push(visState.graph);
				}
			}

			nextStep();
		}

		const randomUpdateIndex = getRandomInt(1, distanceUpdates.length - 2);

		setGraphState(exerciseGraphs[randomUpdateIndex - 1]);
		setSolutionGraph(exerciseGraphs[randomUpdateIndex]);

		// Prepare answers for current exercise
		const tempAnswers = [...distanceAnswers];
		const correctUpdates = distanceUpdates[randomUpdateIndex];

		// Handle case when no updates are done
		if (correctUpdates.length === 0) {
			tempAnswers[1].isCorrect = true;
		}

		// Add correct updates as answers
		correctUpdates.forEach((update) => {
			const tempAnswer: IAnswer = { ...tempAnswers[0] };
			tempAnswer.answerText = tempAnswer.answerText.replace("vertex_id", update.node.toString());
			tempAnswer.answerText = tempAnswer.answerText.replace("new_distance", update.newDistance.toString());
			tempAnswers.push(tempAnswer);
		});

		// Add false unswers for right node but wrong distance
		correctUpdates.forEach((update) => {
			const tempAnswer: IAnswer = { ...tempAnswers[0] };
			tempAnswer.answerText = tempAnswer.answerText.replace("vertex_id", update.node.toString());
			let randomOffset = getRandomInt(-update.newDistance, 10);
			if (randomOffset === 0) randomOffset = randomOffset + 5;
			const falseDistance = update.newDistance + randomOffset;
			tempAnswer.answerText = tempAnswer.answerText.replace("new_distance", falseDistance.toString());
			tempAnswer.isCorrect = false;
			tempAnswers.push(tempAnswer);
		});

		// Add false answers for wrong node and wrong answer
		const visState = getVisState();
		const nodeNumber = visState !== null ? visState.graph.nodes.length : -1;
		const allNodes = Array.from({ length: nodeNumber }, (_, i) => i);
		const existingNodes = new Set(distanceUpdates[randomUpdateIndex].map((update) => update.node));
		const notUpdatedNodes = allNodes.filter((node) => !existingNodes.has(node));

		notUpdatedNodes.forEach((node) => {
			const tempAnswer: IAnswer = { ...tempAnswers[0] };
			tempAnswer.answerText = tempAnswer.answerText.replace("vertex_id", node.toString());
			tempAnswer.answerText = tempAnswer.answerText.replace("new_distance", getRandomInt(0, 20).toString());
			tempAnswer.isCorrect = false;
			tempAnswers.push(tempAnswer);
		});

		tempAnswers.shift();

		setAnswerOptions(selectRandomAnswers(tempAnswers));
	};

	const getDistanceUpdate = (input: string): distanceUpdate => {
		const regex = /node (\d+).*?=.*?(\d+)/;
		const match = input.match(regex);

		if (match !== null) {
			// Extract the node number and result from the match groups
			const node = parseInt(match[1], 10);
			const newDistance = parseInt(match[2], 10);
			return { node, newDistance };
		}

		return { node: -1, newDistance: -1 };
	};

	interface predecessorUpdate {
		node: number;
		newPredecessor: number;
	}

	/**
	 * Predecessor Exercise: Calculates the solution and specific answer options for a given graph
	 */
	const updatePredecessorExercise = (): void => {
		const predecessorUpdates: predecessorUpdate[][] = [];
		const exerciseGraphs: Array<GraphTS<NodeTS, LinkTS>> = [];
		// Represents marked vertices in correct order
		let updates: predecessorUpdate[] = [];
		while (getVisState()?.lineOfCode !== undefined) {
			const visState = getVisState();
			if (visState !== undefined && visState !== null) {
				if (visState.lineOfCode === 9) {
					updates.push(getPredecessorUpdate(visState.helptext));
				}

				if (visState.lineOfCode === 4) {
					predecessorUpdates.push(updates);
					updates = [];
					exerciseGraphs.push(visState.graph);
				}
			}

			nextStep();
		}

		const randomUpdateIndex = getRandomInt(1, predecessorUpdates.length - 2);

		setGraphState(exerciseGraphs[randomUpdateIndex - 1]);
		setSolutionGraph(exerciseGraphs[randomUpdateIndex]);

		// Prepare answers for current exercise
		const tempAnswers = [...predecessorAnswers];
		const correctUpdates = predecessorUpdates[randomUpdateIndex];

		// Handle case when no updates are done
		if (correctUpdates.length === 0) {
			tempAnswers[1].isCorrect = true;
		}

		// Add correct updates as answers
		correctUpdates.forEach((update) => {
			const tempAnswer: IAnswer = { ...tempAnswers[0] };
			tempAnswer.answerText = tempAnswer.answerText.replace("vertex_id", update.node.toString());
			tempAnswer.answerText = tempAnswer.answerText.replace("new_predecessor", update.newPredecessor.toString());
			tempAnswers.push(tempAnswer);
		});

		const visState = getVisState();
		const nodeNumber = visState !== null ? visState.graph.nodes.length : -1;
		const allNodes = Array.from({ length: nodeNumber }, (_, i) => i);
		const existingNodes = new Set(correctUpdates.map((update) => update.node));
		const notUpdatedNodes = allNodes.filter((node) => !existingNodes.has(node));

		// Add false unswers for right node but wrong distance
		correctUpdates.forEach((update) => {
			const tempAnswer: IAnswer = { ...tempAnswers[0] };
			tempAnswer.answerText = tempAnswer.answerText.replace("vertex_id", update.node.toString());
			const randomIndex = getRandomInt(0, notUpdatedNodes.length - 1);
			tempAnswer.answerText = tempAnswer.answerText.replace(
				"new_predecessor",
				notUpdatedNodes[randomIndex].toString()
			);
			tempAnswer.isCorrect = false;
			tempAnswers.push(tempAnswer);
		});

		// Add false answers for wrong node and wrong answer
		notUpdatedNodes.forEach((notUpdatedNode) => {
			const tempAnswer: IAnswer = { ...tempAnswers[0] };
			tempAnswer.answerText = tempAnswer.answerText.replace("vertex_id", notUpdatedNode.toString());
			const randomIndex = getRandomInt(0, allNodes.length - 1);
			const node = allNodes[randomIndex] === notUpdatedNode ? 0 : allNodes[randomIndex];
			tempAnswer.answerText = tempAnswer.answerText.replace("new_predecessor", node.toString());
			tempAnswer.isCorrect = false;
			tempAnswers.push(tempAnswer);
		});

		tempAnswers.shift();

		setAnswerOptions(selectRandomAnswers(tempAnswers));
	};

	const getPredecessorUpdate = (input: string): predecessorUpdate => {
		const regex = /node (\d+) to (\d+)/;
		const match = input.match(regex);

		if (match !== null) {
			// Extract the node number and result from the match groups
			const node = parseInt(match[1], 10);
			const newPredecessor = parseInt(match[2], 10);
			return { node, newPredecessor };
		}

		return { node: -1, newPredecessor: -1 };
	};

	/**
	 * Calculates a new random graph for the next exercise
	 *
	 * Resets the states for chosen and correct answer indices
	 */
	const newExercise = (): void => {
		setLayoutAlgorithm(LayoutAlgorithm.Circle);
		const newGraph = AvailableAlgorithm.Dijkstra.getRandomGraph();
		setNewGraph(newGraph);
		setGraphState(newGraph);
		setNewGraphClicked(true);

		setChosenAnswerIndex(null);
		setCorrectAnswerIndex(null);
	};

	const setFeedbackMessage = (isSolutionCorrect: boolean): void => {
		const currentStage = getCurrentStage();
		if (currentStage !== undefined) {
			if (currentStage.stageId === TrainingStages.ChooseVertex) {
				setFeedback({
					isAnswerCorrect: isSolutionCorrect,
					feedbackText: "Select the unmarked vertex with the smallest distance",
				});
			}
			if (currentStage.stageId === TrainingStages.PredecessorUpdate) {
				setFeedback({
					isAnswerCorrect: isSolutionCorrect,
					feedbackText:
						"Set the predecessor of the current node to the node from which the shortest path is found",
				});
			}
			if (currentStage.stageId === TrainingStages.DistanceUpdate) {
				setFeedback({
					isAnswerCorrect: isSolutionCorrect,
					feedbackText: "Update the distance of the node if a shorter path is found through the current node",
				});
			}
			if (currentStage.stageId === TrainingStages.Initialization) {
				setFeedback({
					isAnswerCorrect: isSolutionCorrect,
					feedbackText:
						"In the initialization all distances are set to infinity and all predecessors to Null. The node s starts with distance 0 and predecessor s",
				});
			}
			if (currentStage.stageId === TrainingStages.Runtime) {
				setFeedback({
					isAnswerCorrect: isSolutionCorrect,
					feedbackText:
						"In total, at most m update steps are made and choosing the next vertex costs in total n · log n by using Fibonacci Heaps",
				});
			}
			if (currentStage.stageId === TrainingStages.SpaceComplexity) {
				setFeedback({
					isAnswerCorrect: isSolutionCorrect,
					feedbackText: "When using a priority queue the space complexity is bound by |V|",
				});
			}
			if (currentStage.stageId === TrainingStages.Queue) {
				setFeedback({
					isAnswerCorrect: isSolutionCorrect,
					feedbackText:
						"Dijkstra's algorithm uses a priority queue to efficiently select the next vertex with the smallest tentative distance",
				});
			}
		}
	};

	useEffect(() => {
		setSolutionGraph(initialGraph);
		setStageList([
			{
				stageId: TrainingStages.Initialization,
				title: "Choose the correct step in initialization",
			},
			{
				stageId: TrainingStages.ChooseVertex,
				title: "Choose the next vertex",
			},
			{
				stageId: TrainingStages.DistanceUpdate,
				title: "Choose the correct distance update",
			},
			{
				stageId: TrainingStages.PredecessorUpdate,
				title: "Choose the predecessor update",
			},
			{
				stageId: TrainingStages.SpaceComplexity,
				title: "What is the space complexity of Dijkstra's algorithm?",
			},
			{
				stageId: TrainingStages.Queue,
				title: "What data structure does Dijkstra's algorithm use?",
			},
			{
				stageId: TrainingStages.Runtime,
				title: "What is the runtime of Dijkstra's Algorithm?",
			},
		]);
		return () => {
			resetGraph();
			resetStages();
		};
	}, []);

	useEffect(() => {
		resetGraph();

		// Selects a random question type and calls the corresponding method to calculate the solution and answer options
		switch (chooseRandomOption()) {
			case "init": {
				while (getVisState()?.lineOfCode !== 4) nextStep();
				const solutionVisState = getVisState();
				setSolutionGraph(solutionVisState?.graph);
				setAnswerOptions(selectRandomAnswers(initAnswers));
				setCurrentStage(TrainingStages.Initialization);
				break;
			}
			case "nextVertex": {
				selectVertexExercise();
				setCurrentStage(TrainingStages.ChooseVertex);
				break;
			}
			case "distance": {
				updateDistanceExercise();
				setCurrentStage(TrainingStages.DistanceUpdate);
				break;
			}
			case "predecessor": {
				updatePredecessorExercise();
				setCurrentStage(TrainingStages.PredecessorUpdate);
				break;
			}
			case "space": {
				setAnswerOptions(selectRandomAnswers(spaceAnswers));
				setCurrentStage(TrainingStages.SpaceComplexity);
				break;
			}
			case "queue": {
				setAnswerOptions(selectRandomAnswers(queueAnswers));
				setCurrentStage(TrainingStages.Queue);
				break;
			}
			case "runtime": {
				setAnswerOptions(selectRandomAnswers(runtimeAnswers));
				setCurrentStage(TrainingStages.Runtime);
				break;
			}
		}
		setNewGraphClicked(false);
	}, [newGraphClicked]);

	return (
		<TrainingForm
			// not sure what to put here, we dont really use a form this time
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			onSubmit={handleSubmit(() => console.log())}
			useAlgorithmStore={useDijkstraStore}
			controls={
				<TrainingFormNextQuestionButton
					onClick={newExercise}
					disabled={newGraphClicked}
				></TrainingFormNextQuestionButton>
			}
			feedback={
				<FeedbackAlert
					feedback={feedback}
					isFeedbackVisible={chosenAnswerIndex != null}
				/>
			}
		>
			<div className="mb-10 flex w-full flex-col items-center">
				{answerOptions.length > 0 ? (
					answerOptions.map((answer, index) => (
						<button
							key={index}
							title="answer_options"
							type="button"
							className={`btn btn-neutral mb-2 flex w-64 items-center gap-4 text-xs hover:btn-secondary sm:text-sm md:text-base
								${correctAnswerIndex !== null ? "pointer-events-none hover:btn-secondary hover:opacity-100" : ""} 
								${correctAnswerIndex === index ? "btn-success" : chosenAnswerIndex === index ? "btn-error" : ""} btn-sm md:btn-md`}
							onClick={() => {
								const correctAnswer = answerOptions.findIndex((answer) => answer.isCorrect);
								setChosenAnswerIndex(index);
								setCorrectAnswerIndex(correctAnswer);
								if (solutionGraph !== undefined) setGraphState(solutionGraph);
								setFeedbackMessage(correctAnswer === index);
							}}
						>
							{answer !== undefined ? answer.answerText : ""}
						</button>
					))
				) : (
					<Spinner />
				)}
			</div>
		</TrainingForm>
	);
};
