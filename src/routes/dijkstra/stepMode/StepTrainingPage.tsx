import React, { ReactNode, useEffect, useState } from "react";
import "intro.js/introjs.css";
import { GraphTS } from "../../../utils/graphs";
import { VisualisationStateTS as VisStateDijkstra } from "../../../algorithms/dijkstra/config";
import { StepInitialization } from "./StepInitialization";
import { useDijkstraStore } from "../../../algorithms/dijkstra/store";
import { TrainingForm } from "../../../components/TrainingForm";
import { useForm } from "react-hook-form";

import { StepDistanceUpdates } from "./StepDistanceUpdates";
import { NodeState, NumberOrInfinity, NumberOrNull } from "../types";
import { StepVertexSelection } from "./StepVertexSelection";
import { Spinner } from "../../../components/Spinner";
import { getDistOptions, getPredOptions } from "../OptionGeneration";
import { TrainingEvaluation } from "../../../components/TrainingEvaluation";
import { AvailableAlgorithm, ITrainingPageProps } from "../../../utils/available-algorithms";
import { useTrainingStagesStore } from "../../../hooks/TrainingStagesStore";
import {
	TrainingFormContinueButton,
	TrainingFormNewGraphButton,
	TrainingFormResetButton,
	TrainingFormSubmitButton,
} from "../../../components/TrainingFormButtons";
import { ChevronRight } from "lucide-react";
import { LinkTS, NodeTS } from "../../../algorithms/adapter";
import { LayoutAlgorithm } from "../../../algorithms/algorithm-interfaces";

const sizeDropdowns = 4;

export enum AlgorithmStages {
	Initialization,
	VertexSelection,
	DistanceUpdates,
	End,
}

export const StepTrainingPage: React.FC<ITrainingPageProps> = ({ graphState, setGraphState }) => {
	const { initialGraph, isInitialized, getVisState, nextStep, resetGraph, setNewGraph, config, setLayoutAlgorithm } =
		useDijkstraStore();
	const { setStageList, setCurrentStage, getCurrentStage, resetStages, getStage, increaseWrongAnswersBy } =
		useTrainingStagesStore();

	const { handleSubmit } = useForm();

	const [nodeList, setNodeList] = useState<NodeState[]>([]);
	const [isShowingResults, setShowingResults] = useState<boolean>(false);
	const [solutionGraph, setSolutionGraph] = useState<GraphTS<NodeTS, LinkTS>>(initialGraph);
	// id node that is currently selected by the USER for next iteration. initialized as -1 => undefined
	const [selectedNodeId, setSelectedNodeId] = useState<number>(-1);
	// id node that is currently selected by the ALGORITHM for next iteration. initialized as -1 => undefined
	const [solutionNodeId, setSolutionNodeId] = useState<number>(-1);
	const [updateDistOptions, setUpdateDistOptions] = useState<{ [id: number]: NumberOrInfinity[] }>({});
	const [predecessorOptions, setPredecessorOptions] = useState<{ [id: number]: NumberOrNull[] }>({});

	const stageInitialization = (): void => {
		// first find out the number of vertices
		const n = (getVisState() as VisStateDijkstra).graph.nodes.length;
		setStageList([
			{
				stageId: AlgorithmStages.Initialization,
				shortTitle: "Initialization",
				title: "Initialize Distances and Predecessors",
				info: "Insert initial distances and predecessors for all vertices. Use the 'Set All' buttons to speed up the process.",
				wrongAnswers: 0,
				answers: n * 2,
			},
			{
				stageId: AlgorithmStages.VertexSelection,
				shortTitle: "Vertex Selection",
				title: "Choose Vertex for Next Iteration",
				info: "Click on the vertex that is marked by the algorithm in the next iteration. If two or more vertices could be selected by the algorithm, select the one with the lowest index.",
				wrongAnswers: 0,
				answers: n,
			},
			{
				stageId: AlgorithmStages.DistanceUpdates,
				shortTitle: "Distance Updates",
				title: "Update Distances",
				info: "Select the new distances inside the table. Use the 'Reset' button to get back to the distances from the last iteration.",
				wrongAnswers: 0,
				answers: (n * (n - 1)) / 2,
			},
			{
				stageId: AlgorithmStages.End,
				shortTitle: "Results",
				title: "Algorithm finished",
				info: "If you click on new graph, you can repeat the training mode with a random graph.",
			},
		]);
	};

	const submit = (): void => {
		setShowingResults(true);
		setGraphState(solutionGraph);

		// increase wrong answer counter
		let increment = 0;
		switch (getCurrentStage()!.stageId) {
			case AlgorithmStages.Initialization:
				nodeList.forEach((node) => {
					increment = node.distInput !== node.distSolution ? increment + 1 : increment;
					increment = node.predInput !== node.predSolution ? increment + 1 : increment;
				});
				break;
			case AlgorithmStages.VertexSelection:
				increment = selectedNodeId !== solutionNodeId ? increment + 1 : increment;
				break;
			case AlgorithmStages.DistanceUpdates:
				nodeList.forEach((node) => {
					increment = node.distInput !== node.distSolution ? increment + 1 : increment;
				});
				break;
		}
		increaseWrongAnswersBy(increment);
	};

	const prepareDistUpdates = (nodes: NodeState[]): NodeState[] => {
		// Go through the forloop until you reach the next vertex selection
		while (getVisState()?.lineOfCode !== 4) {
			// Stop if you reach the end of the algorithm
			if (getVisState()?.lineOfCode === undefined) break;
			// Otherwise continue
			nextStep();
		}
		const solutionVisState = getVisState() as VisStateDijkstra;
		setSolutionGraph(solutionVisState.graph);
		// Update distances of nodes in NodeList
		nodes = nodes.map((node) => {
			const solutionNode = solutionVisState.graph.nodes.find((n) => parseInt(n.id) === node.id);
			return {
				...node,
				distLastIter: node.distSolution,
				distSolution: solutionNode!.dist!,
				// node that is marked in current iteration
				marked: solutionNodeId === node.id ? true : node.marked,
			};
		});
		// recompute dist options for the update table
		const options: { [id: number]: NumberOrInfinity[] } = {};
		nodes.forEach((node) => {
			options[node.id] = getDistOptions(node.distSolution, sizeDropdowns, node.distInput);
		});
		if (options !== undefined) {
			setUpdateDistOptions(options);
		}
		return nodes;
	};

	const prepareVertexSelection = (): void => {
		// Choose next vertex
		nextStep();
		const solutionVisState = getVisState() as VisStateDijkstra;
		// prepare solutionId for next iteration (if there is next a next iteration)
		if (solutionVisState.activeNode === null) {
			setSolutionNodeId(-1);
		} else {
			setSolutionNodeId(solutionVisState.activeNode);
		}
	};

	// corrects user input such that the state is consistent for the next task
	const correctInputs = (nodes: NodeState[]): NodeState[] => {
		// correct distances and predecessors to prepare for next iteration
		nodes = nodes.map((node) => {
			return {
				...node,
				distInput: node.distSolution,
				predInput: node.predSolution,
			};
		});
		return nodes;
	};

	const nextStage = (): void => {
		let preparedList = nodeList;
		switch (getCurrentStage()!.stageId) {
			case AlgorithmStages.Initialization:
				prepareVertexSelection();
				preparedList = correctInputs(preparedList);
				// if the phase was skipped (we can tell by checking isShowingResults) we remove the evaluation for this phase
				if (isShowingResults) {
					// initialization was completed
					setCurrentStage(AlgorithmStages.VertexSelection);
				} else {
					// initialization was skipped -> we remove the initialization phase from the evaluation
					getStage(AlgorithmStages.Initialization)!.answers = undefined;
					getStage(AlgorithmStages.Initialization)!.wrongAnswers = undefined;
					setCurrentStage(AlgorithmStages.VertexSelection);
				}
				break;
			case AlgorithmStages.VertexSelection:
				preparedList = prepareDistUpdates(preparedList);
				setCurrentStage(AlgorithmStages.DistanceUpdates);
				break;
			case AlgorithmStages.DistanceUpdates:
				if (nodeList.filter((node) => !node.marked).length > 0) {
					prepareVertexSelection();
					preparedList = correctInputs(preparedList);
					setCurrentStage(AlgorithmStages.VertexSelection);
				} else {
					setCurrentStage(AlgorithmStages.End);
					colorActiveNode(-1);
				}
				break;
		}
		setNodeList(preparedList);
		setSelectedNodeId(-1);
		setShowingResults(false);
	};

	const newGraph = (): void => {
		setLayoutAlgorithm(LayoutAlgorithm.Circle);
		const newGraph = AvailableAlgorithm.Dijkstra.getRandomGraph();
		setNewGraph(newGraph);
		setGraphState(newGraph);
		initializeNodeList();
		setSolutionGraph((getVisState() as VisStateDijkstra).graph);
		stageInitialization();
	};

	const initializeNodeList = (): void => {
		// Move to after first Vertex is chosen
		while (getVisState()?.lineOfCode !== 4) {
			nextStep();
		}
		const solutionVisState = getVisState() as VisStateDijkstra;
		const tempNodeList: NodeState[] = [];

		solutionVisState.graph.nodes.forEach(({ id, dist }) => {
			tempNodeList.push({
				id: parseInt(id),
				distSolution: dist,
				marked: false,
				distInput: undefined,
				distLastIter: dist,
				predSolution: (parseInt(id) === solutionVisState.startNode ? parseInt(id) : "Null") as NumberOrNull,
				predInput: undefined,
			});
		});
		setNodeList(tempNodeList);

		// we also initialize the predecessor options for the initialization stage
		setPredecessorOptions(getPredOptions(solutionVisState.graph.nodes.length, solutionVisState.graph.edges));
	};

	// this method is used to hide the setNodeList method (too powerful) from the subcomponents
	const setDistsByIds = (updates: { [id: number]: NumberOrInfinity }): void => {
		setNodeList(
			nodeList.map((node) => {
				// may be undefined
				const newDist = updates[node.id];
				return {
					...node,
					distInput: newDist !== undefined ? newDist : node.distInput,
				};
			})
		);
	};

	// this method is used to hide the setNodeList method (too powerful) from the subcomponents
	const setPredsByIds = (updates: { [id: number]: NumberOrNull }): void => {
		setNodeList(
			nodeList.map((node) => {
				// may be undefined
				const newPred = updates[node.id];
				return {
					...node,
					predInput: newPred !== undefined ? newPred : node.predInput,
				};
			})
		);
	};

	// extracts and returns edge weight of (source, target) or undefined if the edge does not exist
	// doing this here isn't the best solution. it would be nice if this function was provided by the dijkstra store
	const extractEdgeWeight = (souceId: number, targetId: number): number | undefined => {
		const edge = solutionGraph.edges.find(
			(link) => link.source === souceId.toString() && link.target === targetId.toString()
		);
		return edge?.weight;
	};

	useEffect(() => {
		setGraphState(initialGraph);
		initializeNodeList();
		setSolutionGraph((getVisState() as VisStateDijkstra).graph);
		stageInitialization();
		return () => {
			resetGraph();
			resetStages();
		};
	}, []);

	const readyToSubmit = (): boolean => {
		let ready = true;
		nodeList.forEach((node) => {
			ready = ready && node.distInput !== undefined && node.predInput !== undefined;
		});
		return ready;
	};

	const resetDistanceUpdate = (): void => {
		const resetDistances: { [id: number]: NumberOrInfinity } = {};
		nodeList.forEach((node) => {
			resetDistances[node.id] = node.distLastIter;
		});
		setDistsByIds(resetDistances);
	};

	function getControls(): ReactNode {
		switch (getCurrentStage()!.stageId) {
			case AlgorithmStages.Initialization:
				return (
					<>
						{!isShowingResults && <TrainingFormSubmitButton disabled={!readyToSubmit()} />}
						{/* this button (skip/continue) should also use a common component */}
						<button
							id="button_continue"
							type="button"
							className={`btn btn-neutral btn-sm flex items-center gap-4 text-sm md:btn-md md:text-base`}
							onClick={nextStage}
						>
							{!isShowingResults ? "Skip" : "Continue"}
							<ChevronRight className={"size-4 sm:size-5 md:size-6 lg:size-8"} />
						</button>
					</>
				);
			case AlgorithmStages.VertexSelection:
				return (
					<TrainingFormContinueButton
						onClick={nextStage}
						disabled={!isShowingResults}
					></TrainingFormContinueButton>
				);
			case AlgorithmStages.DistanceUpdates:
				return isShowingResults || nodeList.filter((node) => !node.marked).length === 0 ? (
					<TrainingFormContinueButton onClick={nextStage}></TrainingFormContinueButton>
				) : (
					<>
						<TrainingFormSubmitButton disabled={isShowingResults}></TrainingFormSubmitButton>
						<TrainingFormResetButton onClick={resetDistanceUpdate}></TrainingFormResetButton>
					</>
				);
			case AlgorithmStages.End:
				return <TrainingFormNewGraphButton onClick={newGraph}></TrainingFormNewGraphButton>;
			default:
				return <></>;
		}
	}

	function highlightNode(nodeId: number, shouldHighlight: boolean): void {
		const nodes = graphState.nodes.map((node) => {
			const currentNodeId = parseInt(node.id);
			const isNodeMarked = nodeList.find((n) => n.id === currentNodeId)?.marked ?? false;
			const isNodeActive = selectedNodeId !== -1 && currentNodeId === solutionNodeId;
			let color = isNodeMarked
				? config.colors.visitedNodeColor
				: isNodeActive
					? config.colors.activeNodeColor
					: config.colors.unvisitedNodeColor;
			if (currentNodeId === nodeId && shouldHighlight) {
				color = config.colors.highlightColor;
			}
			return {
				...node,
				color,
				style: {
					keyshape: {
						fill: color,
						stroke: color,
					},
				},
			};
		});
		setGraphState({ ...graphState, nodes });
	}

	// if activeNodeId passed is -1, color everything as marked (end of algorithm)
	function colorActiveNode(activeNodeId: number): void {
		const nodes = graphState.nodes.map((node) => {
			if (activeNodeId === -1) {
				return {
					...node,
					color: config.colors.visitedNodeColor,
					style: {
						keyshape: {
							fill: config.colors.visitedNodeColor,
							stroke: config.colors.visitedNodeColor,
						},
					},
				};
			}
			const isNodeMarked = nodeList.find((n) => n.id === parseInt(node.id))?.marked ?? false;
			let color = isNodeMarked ? config.colors.visitedNodeColor : config.colors.unvisitedNodeColor;
			if (parseInt(node.id) === activeNodeId) {
				color = config.colors.activeNodeColor;
			}
			return {
				...node,
				color,
				style: {
					keyshape: {
						fill: color,
						stroke: color,
					},
				},
			};
		});
		setGraphState({ ...graphState, nodes });
	}

	return isInitialized && getVisState() !== null && getCurrentStage() !== undefined ? (
		<TrainingForm
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			onSubmit={handleSubmit(submit)}
			useAlgorithmStore={useDijkstraStore}
			controls={getControls()}
		>
			{(() => {
				switch (getCurrentStage()!.stageId) {
					case AlgorithmStages.Initialization:
						return (
							<StepInitialization
								nodeList={nodeList}
								setDistsByIds={setDistsByIds}
								setPredsByIds={setPredsByIds}
								predecessorOptions={predecessorOptions}
								isShowingResults={isShowingResults}
							/>
						);
					case AlgorithmStages.VertexSelection:
						return (
							<StepVertexSelection
								selectedId={selectedNodeId}
								setSelectedId={setSelectedNodeId}
								solutionId={solutionNodeId}
								nodeList={nodeList}
								isShowingResults={isShowingResults}
								highlightNode={highlightNode}
								colorActiveNode={colorActiveNode}
							/>
						);
					case AlgorithmStages.DistanceUpdates:
						return (
							<StepDistanceUpdates
								selectedNodeId={solutionNodeId}
								updateDistOptions={updateDistOptions}
								nodeList={nodeList}
								setDistsByIds={setDistsByIds}
								getEdgeWeight={extractEdgeWeight}
								isShowingResults={isShowingResults}
								nextStage={nextStage}
							/>
						);
					case AlgorithmStages.End:
						return <TrainingEvaluation />;
				}
			})()}
		</TrainingForm>
	) : (
		<Spinner />
	);
};
