import React, { useEffect, useState } from "react";
import { VisualisationStateTS as VisStateDijkstra } from "../../algorithms/dijkstra/config";
import { useDijkstraStore } from "../../algorithms/dijkstra/store";
import "intro.js/introjs.css";
import { useForm } from "react-hook-form";
import { Spinner } from "../../components/Spinner";
import { GraphTS } from "../../utils/graphs";
import { getDistOptions } from "./OptionGeneration";
import { TrainingForm } from "../../components/TrainingForm";
import {
	TrainingFormNewGraphButton,
	TrainingFormResetButton,
	TrainingFormSubmitButton,
} from "../../components/TrainingFormButtons";
import { DistanceUpdateTable } from "./DistanceUpdateTable";
import { NumberOrInfinity, ReducedNodeState } from "./types";
import { AvailableAlgorithm, ITrainingPageProps } from "../../utils/available-algorithms";
import { useTrainingStagesStore } from "../../hooks/TrainingStagesStore";
import { Modal } from "../../components/Modal";
import { CircleHelp } from "lucide-react";
import { LinkTS, NodeTS } from "../../algorithms/adapter";
import { LayoutAlgorithm } from "../../algorithms/algorithm-interfaces";

const numberOfOptions = 4;
const errorModalId = "error-info-modal";

export const QuickTrainingPage: React.FC<ITrainingPageProps> = ({ setGraphState }) => {
	const { initialGraph, isInitialized, getVisState, nextStep, setNewGraph, resetGraph, setLayoutAlgorithm } =
		useDijkstraStore();
	const { resetStages, setStageList } = useTrainingStagesStore();

	const [nodeList, setNodeList] = useState<ReducedNodeState[]>();
	// used to store the Graph state that should be displayed when the user submits his solution
	const [solutionGraph, setSolutionGraph] = useState<GraphTS<NodeTS, LinkTS>>();
	const [isShowingResults, setShowingResults] = useState<boolean>(false);
	// Triggers an update of the component for a new exercise
	const [newGraphClicked, setNewGraphClicked] = useState<boolean>(false);
	const [readyToSubmit, setReadyToSubmit] = useState<boolean>(false);
	const [distOptions, setDistOptions] = useState<{ [id: number]: NumberOrInfinity[] }>({});

	const { handleSubmit } = useForm();

	// Check results and display them
	const checkResults = (): void => {
		setShowingResults(true);
		if (solutionGraph !== null && solutionGraph !== undefined) {
			setGraphState(solutionGraph);
		}
	};

	// Reset the states and graph to their initial state
	const reset = (): void => {
		setGraphState(initialGraph);
		if (nodeList !== null && nodeList !== undefined) {
			// Update correctResult for each node based on input value
			const updatedNodeList = nodeList.map((node) => ({
				...node,
				distInput: undefined,
			}));
			// Update the nodeList state with the updated list
			setNodeList(updatedNodeList);
		}
		setReadyToSubmit(false);
		setShowingResults(false);
	};

	// Generate a new random graph and update the state
	const generateNewGraph = (): void => {
		reset();
		setLayoutAlgorithm(LayoutAlgorithm.Circle);
		const newGraph = AvailableAlgorithm.Dijkstra.getRandomGraph();
		setNewGraph(newGraph);
		setGraphState(newGraph);
		setNewGraphClicked(true);
	};

	// Generate distance options for each node based on its solution distance
	const collectDistOptions = (nodes: ReducedNodeState[]): { [id: number]: NumberOrInfinity[] } => {
		const options: { [id: number]: NumberOrInfinity[] } = {};
		nodes.forEach((node) => {
			options[node.id] = getDistOptions(node.distSolution, numberOfOptions);
		});

		return options;
	};

	// Update the distance of a node by its ID in the nodeList State
	const updateDistById = (nodeId: number, newDist: NumberOrInfinity): void => {
		if (nodeList !== undefined) {
			const updatedList: ReducedNodeState[] = nodeList.map((nodeInList) => {
				if (nodeInList.id === nodeId) return { ...nodeInList, distInput: newDist };
				else return nodeInList;
			});
			setNodeList(updatedList);
			let allDistsEntered = true;
			nodeList.forEach((node) => {
				// set node list isn't fast enough thats why we explicitly ask for the current node
				allDistsEntered = allDistsEntered && (node.distInput !== undefined || node.id === nodeId);
			});
			if (allDistsEntered) setReadyToSubmit(true);
		}
	};

	// Provides detailed error feedback that is given to the user
	const getErrorFeedback = (nodeId: number): string => {
		// special case: shortest path from node 0 to itself
		if (nodeId === 0) {
			return `The shortest path from node 0 to itself is the empty path, which by definition has length 0.`;
		}
		const userInput = nodeList?.[nodeId].distInput?.toString();
		const shortestPath = extractShortestPath(nodeId);
		if (shortestPath.length > 1) {
			// read out shortest path to node from solutionVisState
			let pathString = "";
			let costString = "";
			let totalCost = 0;
			Array.from(Array(shortestPath.length).keys()).forEach((index) => {
				pathString += shortestPath[index] + "-";
				if (index !== shortestPath.length - 1) {
					const cost = solutionGraph?.edges.find(
						(edge) => edge.source === shortestPath[index] && edge.target === shortestPath[index + 1]
					)?.weight;
					costString += `${cost !== undefined ? cost : "undefined"}+`;
					totalCost += cost !== undefined ? cost : 0;
				}
			});
			// cut off the end
			pathString = pathString.substring(0, pathString.length - 1);
			costString =
				costString.substring(0, costString.length - 1) +
				(shortestPath.length > 2 ? "=" + totalCost.toString() : "");

			// put together feedback
			return `The shortest path from node 0 to node ${nodeId} runs along the nodes ${pathString} and has lenght ${costString} ≠ ${userInput !== undefined ? userInput : "undefined"}.`;
		} else {
			// if the given node is unreachable
			return `There is no directed path from node 0 to node ${nodeId}. So the correct distance is ∞ ≠ ${userInput !== undefined ? userInput : "undefined"}.`;
		}
	};

	// extracts shortest path (node indeces) from 0 to nodeId
	// doing this here isn't the best solution. it would be nice if this function was provided by the dijkstra store
	const extractShortestPath = (nodeId: number): string[] => {
		const path = [nodeId.toString()];
		do {
			let pred = solutionGraph?.nodes[+path[0]].pred;
			pred ??= -1;
			path.unshift(pred?.toString());
		} while (path[0] !== "-1" && path[0] !== path[1]);

		return path.slice(1, path.length);
	};

	// Initial set up when a new exercise is generated
	useEffect(() => {
		setGraphState(initialGraph);
		// Run through the whole algorithm to get the solution for Quick Mode
		while (getVisState()?.lineOfCode !== undefined) {
			nextStep();
		}
		const solutionVisState = getVisState() as VisStateDijkstra;
		// From the state extract the distance solutions and store them in a list
		const tempNodeList: ReducedNodeState[] = [];
		Object.entries(solutionVisState.distance).forEach(([index, value]) =>
			tempNodeList.push({
				id: parseInt(index),
				distSolution: value,
				distInput: undefined,
			})
		);
		// Set the computed solution for the nodeList and the solutionGraph
		setNodeList(tempNodeList);
		setSolutionGraph(solutionVisState.graph);
		setNewGraphClicked(false);
		// Set the Dist Options displayed for each node
		setDistOptions(collectDistOptions(tempNodeList));
	}, [newGraphClicked]);

	// On first load of the component set the stages
	useEffect(() => {
		setStageList([{ stageId: 0, title: "Insert Minimal Distances to Starting Node 0" }]);

		// Reset the graph when the component is unmounted
		return () => {
			resetGraph();
			resetStages();
		};
	}, []);

	return (
		<>
			{nodeList?.map((node) => (
				<Modal
					id={errorModalId + "-" + node.id.toString()}
					className="overflow-visible"
					body={
						<>
							<h3 className="text-lg font-bold text-primary">
								<CircleHelp />
							</h3>
							<p className="py-4">{getErrorFeedback(node.id)}</p>
						</>
					}
				/>
			))}
			{isInitialized && getVisState() !== null && nodeList !== undefined ? (
				<TrainingForm
					// eslint-disable-next-line @typescript-eslint/no-misused-promises
					onSubmit={handleSubmit(checkResults)}
					useAlgorithmStore={useDijkstraStore}
					controls={
						<>
							<TrainingFormResetButton onClick={reset} />
							<TrainingFormNewGraphButton onClick={generateNewGraph} />
							<TrainingFormSubmitButton disabled={!readyToSubmit || isShowingResults} />
						</>
					}
				>
					<DistanceUpdateTable
						nodeList={nodeList}
						updateDist={updateDistById}
						updateDistOptions={distOptions}
						isShowingResults={isShowingResults}
						modalId={errorModalId}
					/>
				</TrainingForm>
			) : (
				<Spinner />
			)}
		</>
	);
};
