import React, { useEffect, useState } from "react";
import { useKruskalStore } from "../../algorithms/kruskal/store";
import "intro.js/introjs.css";
import { Spinner } from "../../components/Spinner";
import { TrainingForm } from "../../components/TrainingForm";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	useSensor,
	useSensors,
	DragEndEvent,
	MouseSensor,
	TouchSensor,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { SortableItem } from "../../components/SortableItem";
import { CircleX } from "lucide-react";
import { useForm } from "react-hook-form";
import {
	TrainingFormAcceptButton,
	TrainingFormContinueButton,
	TrainingFormNewGraphButton,
	TrainingFormRejectButton,
	TrainingFormResetButton,
	TrainingFormSubmitButton,
	TrainingFormTerminateButton,
} from "../../components/TrainingFormButtons";
import { Modal, toggleModal } from "../../components/Modal";
import { TrainingEvaluation } from "../../components/TrainingEvaluation";
import { useLinkListStore } from "../../stores/link-list-store";
import { AvailableAlgorithm, ITrainingPageProps } from "../../utils/available-algorithms";
import { useTrainingStagesStore } from "../../hooks/TrainingStagesStore";
import { linkInEdgelist } from "../../utils/graphs";
import { LayoutAlgorithm } from "../../algorithms/algorithm-interfaces";

enum AlgorithmStages {
	EdgeSorting,
	Review,
	EdgeSelection,
	End,
}

export const StepTrainingPage: React.FC<ITrainingPageProps> = ({ graphState, setGraphState }) => {
	const { isInitialized, nextStep, setNewGraph, resetGraph, getVisState, config, setLayoutAlgorithm } =
		useKruskalStore();
	const { getLinkList, setLinkList, updateLinkList, updateColors, colorLink } = useLinkListStore();
	const { resetStages, setStageList, getCurrentStage, nextStage, increaseWrongAnswersBy, increaseTotalAnswersBy } =
		useTrainingStagesStore();

	// in the edge selection step, linkList[currentLinkIndex] is the considered edge and highlighted
	const [currentLinkIndex, setCurrentLinkIndex] = useState<number>();
	const [errorMessage, setErrorMessage] = useState<string>();

	const sensors = useSensors(
		useSensor(MouseSensor),
		useSensor(TouchSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	useEffect(() => {
		setGraphState(getVisState()!.graph);
		updateLinkList(getVisState()!.graph, () => true);

		algorithmStart();
		// this cleanup function should be executed on unmount to reset to the first visState
		return () => {
			resetGraph();
			resetStages();
		};
	}, []);

	const onSubmit = (): void => {
		// iterate to line 3, at this point the first edge is being checked
		while (getVisState()?.lineOfCode !== 3) {
			nextStep();
		}

		// check for every edge if it was put at the correct index
		for (let index = 0; index < getVisState()!.graph.edges.length; index++) {
			if (
				getLinkList()[index].source !== getVisState()?.graph.edges[index].source ||
				getLinkList()[index].target !== getVisState()?.graph.edges[index].target
			) {
				getLinkList()[index].correctResult = false;
				increaseWrongAnswersBy(1);
			}
		}
		nextStage();
	};

	const displayErrorModal = (msg: string): void => {
		setErrorMessage(msg);
		toggleModal("error-modal");
	};

	const algorithmStart = (): void => {
		setStageList([
			{
				stageId: AlgorithmStages.EdgeSorting,
				shortTitle: "Sorting",
				title: "Order the Edges Correctly",
				info: "Sort the edges by dragging them in the right order. If for two edges both orders are possible, keep the original order",
				wrongAnswers: 0,
				answers: getVisState()!.graph.edges.length,
			},
			{
				stageId: AlgorithmStages.Review,
				title: "Review your mistakes",
				info: "Edges marked in red are not at their right position, meaning not correctly sorted ascendingly by weight.",
			},
			{
				stageId: AlgorithmStages.EdgeSelection,
				shortTitle: "Selection",
				title: "Will the algorithm add the highlighted edge to the tree?",
				info: "Press the green/red button if the highlighted edge should be added to the spanning tree. Press done if the algorithm is finished.",
				wrongAnswers: 0,
				// total number of answers is not known yet
				answers: 0,
			},
			{
				stageId: AlgorithmStages.End,
				shortTitle: "Finish",
				title: "Algorithm finished",
				info: "If you click on new graph, you can repeat the training mode with a random graph.",
			},
		]);
		setCurrentLinkIndex(undefined);
	};

	/**
	 *  Restarts the STM with a new random graph
	 */
	const onNewGraph = (): void => {
		setLayoutAlgorithm(LayoutAlgorithm.Circle);
		const newGraph = AvailableAlgorithm.Kruskal.getRandomGraph();
		setNewGraph(newGraph);
		setGraphState(getVisState()!.graph);
		updateLinkList(getVisState()!.graph, () => true);
		algorithmStart();
	};

	/**
	 *  Resort the list after according to dragging input
	 */
	const handleDragEnd = (event: DragEndEvent): void => {
		const { active, over } = event;
		if (active.id !== over?.id) {
			const oldIndex = getLinkList().findIndex((link) => link.id === active.id);
			const newIndex = getLinkList().findIndex((link) => link.id === over?.id);
			setLinkList(arrayMove(getLinkList(), oldIndex, newIndex));
		}
	};

	/**
	 *  Triggers the next stage of the algorithm and sets neccessary values
	 */
	const onContinue = (): void => {
		// initialise the list new, this time correctly sorted
		updateLinkList(getVisState()!.graph, () => true);
		// reveal the graph such that the first checked edge is highlighted.
		// we already went to this step in onSubmit
		setGraphState(getVisState()!.graph);
		setCurrentLinkIndex(0);
		nextStage();
	};

	const onAlgorithmTerminate = (): void => {
		increaseTotalAnswersBy(1);
		// Algorithm stage is selection
		// if loc is 6, the loop condition (T is not a spanning tree)
		// was broken -> the algorithm should terminate
		if (getVisState()?.lineOfCode === 6) {
			nextStage();
		} else {
			displayErrorModal("There are still edges that need to be checked!");
			increaseWrongAnswersBy(1);
			do {
				nextStep();
			} while (getVisState()?.lineOfCode !== 5);
			// go to loc 3 or 6, depending on whether the loop condition still holds.
			// in line 3 the new edge is set active and colored
			nextStep();
			nextStep();

			setCurrentLinkIndex(currentLinkIndex! + 1); // highlight next edge card
			setGraphState(getVisState()!.graph);
		}
	};

	/**
	 *  Check users decicion whether or not to include an edge, and if included, show edge in graph
	 *  @param accepted if accepted === true returns onAccept, otherwise onReject
	 */

	const onAccept = (accepted: boolean) => () => {
		increaseTotalAnswersBy(1);
		// go through the loop in the pseudo code once.
		do {
			nextStep();

			// If we get out of the loop, then the user should not have considered that edge
			// (T was already a spanning tree)
			if (getVisState()?.lineOfCode === undefined) {
				displayErrorModal("The computed tree is already a spanning tree, no edges would be checked anymore");
				increaseWrongAnswersBy(1);
				nextStage();
				return;
			}
		} while (getVisState()?.lineOfCode !== 5);

		// Set error message depending on accepted, e.g. if accepted is true, the user mistakenly accepted an edge
		if (!linkInEdgelist(getLinkList()[currentLinkIndex!], getVisState()!.treeEdges) === accepted) {
			accepted
				? displayErrorModal("This edge would close a cycle!")
				: displayErrorModal("This edge is needed, it does not close a cycle!");
			increaseWrongAnswersBy(1);
		}

		setCurrentLinkIndex(currentLinkIndex! + 1); // highlight next edge card

		// go to loc 3 or 6, depending on whether the loop condition still holds.
		// in line 3 the new edge is set active and colored
		nextStep();
		nextStep();
		setGraphState(getVisState()!.graph);
	};

	const { handleSubmit, reset } = useForm();

	const onFormReset = (): void => {
		setGraphState(getVisState()!.graph);
		updateLinkList(getVisState()!.graph, () => true);
		reset();
	};

	return (
		<>
			{/* Modal for error message on wrong input */}
			<Modal
				id="error-modal"
				className="overflow-visible"
				body={
					<>
						<p className="py-4">
							<CircleX className="mr-2 inline-block text-error" />
							{errorMessage}
						</p>
					</>
				}
			/>

			{isInitialized && getVisState() !== null && getCurrentStage() !== undefined ? (
				<TrainingForm
					// eslint-disable-next-line @typescript-eslint/no-misused-promises
					onSubmit={handleSubmit(onSubmit)}
					useAlgorithmStore={useKruskalStore}
					controls={
						<>
							{(getCurrentStage()!.stageId === AlgorithmStages.EdgeSorting ||
								getCurrentStage()!.stageId === AlgorithmStages.End) && (
								<>
									<TrainingFormNewGraphButton onClick={onNewGraph} />
								</>
							)}
							{getCurrentStage()!.stageId === AlgorithmStages.EdgeSorting && (
								<>
									<TrainingFormResetButton onClick={onFormReset} />
									<TrainingFormSubmitButton />
								</>
							)}
							{getCurrentStage()!.stageId === AlgorithmStages.Review && (
								<TrainingFormContinueButton onClick={onContinue} />
							)}
							{getCurrentStage()!.stageId === AlgorithmStages.EdgeSelection && (
								<>
									<TrainingFormRejectButton onClick={onAccept(false)} />
									<TrainingFormAcceptButton onClick={onAccept(true)} />
									<TrainingFormTerminateButton onClick={onAlgorithmTerminate} />
								</>
							)}
						</>
					}
				>
					{getCurrentStage()!.stageId !== AlgorithmStages.End ? (
						getLinkList() !== undefined && (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleDragEnd}
								modifiers={[restrictToParentElement]}
							>
								<SortableContext
									items={getLinkList()}
									strategy={verticalListSortingStrategy}
									disabled={getCurrentStage()!.stageId !== AlgorithmStages.EdgeSorting}
								>
									{getLinkList()?.map((link) => (
										<SortableItem
											key={link.id}
											id={link.id}
											disabled={getCurrentStage()!.stageId !== AlgorithmStages.EdgeSorting}
											onMouseEnter={() => {
												if (getCurrentStage()!.stageId === AlgorithmStages.EdgeSorting) {
													colorLink(config)(link.source)(link.target)(true);
													setGraphState({
														...graphState,
														edges: updateColors(graphState),
													});
												}
											}}
											onMouseLeave={() => {
												if (getCurrentStage()!.stageId === AlgorithmStages.EdgeSorting) {
													colorLink(config)(link.source)(link.target)(false);
													setGraphState({
														...graphState,
														edges: updateColors(graphState),
													});
												}
											}}
											isMarked={getLinkList().indexOf(link) === currentLinkIndex}
										>
											{/* counterpart to the badge */}
											<div className="w-10" />
											<span className={"text-sm font-semibold"}>
												{"(" + link.sourceName + "," + link.targetName + ")"}
											</span>
											{getCurrentStage()!.stageId === AlgorithmStages.Review ? (
												<div
													className={`badge tooltip tooltip-right  ${link.correctResult ? "bg-success text-success-content" : "bg-error text-error-content"} mr-2 w-8`}
													data-tip="weight"
												>
													{link.weight.toString()}
												</div>
											) : (
												<div className="w-10" />
											)}
										</SortableItem>
									))}
								</SortableContext>
							</DndContext>
						)
					) : (
						<TrainingEvaluation />
					)}
				</TrainingForm>
			) : (
				<Spinner />
			)}
		</>
	);
};
