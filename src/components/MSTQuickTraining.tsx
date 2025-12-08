import { CircleCheck, CircleX } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { StoreApi, UseBoundStore } from "zustand";
import { LinkTS, NodeTS } from "../algorithms/adapter";
import { KruskalState } from "../algorithms/kruskal/store";
import { PrimState } from "../algorithms/prim/store";
import { useTrainingStagesStore } from "../hooks/TrainingStagesStore";
import { useLinkListStore } from "../stores/link-list-store";
import { GraphTS, linkInEdgelist } from "../utils/graphs";
import { Feedback, FeedbackAlert } from "./FeedbackAlert";
import { Spinner } from "./Spinner";
import { TrainingForm } from "./TrainingForm";
import { TrainingFormNewGraphButton, TrainingFormResetButton, TrainingFormSubmitButton } from "./TrainingFormButtons";
import { LayoutAlgorithm } from "../algorithms/algorithm-interfaces";

type MSTGraph = GraphTS<NodeTS, LinkTS>;
type MSTState = PrimState | KruskalState;

interface MSTQuickTrainingProps {
	graphState: GraphTS<NodeTS, LinkTS>;
	setGraphState: (state: GraphTS<NodeTS, LinkTS>) => void;
	useAlgorithmStore: UseBoundStore<StoreApi<MSTState>>;
	getRandomGraph: () => MSTGraph;
}

const MSTQuickTraining: React.FC<MSTQuickTrainingProps> = ({
	graphState,
	setGraphState,
	useAlgorithmStore,
	getRandomGraph,
}) => {
	const { isInitialized, nextStep, resetGraph, getVisState, config, setNewGraph, setLayoutAlgorithm } =
		useAlgorithmStore();
	const { getLinkList, setLinkList, updateLinkList, updateLinkListColors, updateColors, colorLink } =
		useLinkListStore();

	const [isShowingResults, setShowingResults] = useState(false);
	const [solutionGraph, setSolutionGraph] = useState<MSTGraph>();
	const [feedback, setFeedback] = useState<Feedback>({ isAnswerCorrect: true });

	const { resetStages, setStageList } = useTrainingStagesStore();

	const { handleSubmit, reset } = useForm();
	const onFormReset = (): void => {
		resetGraph();
		onGraphChanged();
		reset();
	};

	const onGraphChanged = (): void => {
		setShowingResults(false);
		const initialGraph: MSTGraph = getVisState()!.graph;
		setGraphState(initialGraph);

		/**
		 * lineOfCode of the last visState is undefined, skip through the states
		 * since we only care about the final result in quick training
		 */
		while (getVisState()?.lineOfCode !== undefined) {
			nextStep();
		}
		setSolutionGraph(getVisState()!.graph);

		// build the link list from the initial graph. This ensures the the displayed order is the one the algorithm uses
		const isLinkTreeMember = (edge: LinkTS): boolean => linkInEdgelist(edge, getVisState()!.treeEdges);
		// pass the negation of isLinkTreeMember as isLinkCorrectResult
		updateLinkList(initialGraph, (link) => !isLinkTreeMember(link), isLinkTreeMember);
	};

	useEffect(() => {
		onGraphChanged();
		setStageList([{ stageId: 0, title: "Select Edges of Minimum Spanning Tree" }]);
		// this cleanup function should be executed on unmount to reset to the first visState
		return () => {
			resetGraph();
			resetStages();
			setGraphState(getVisState()!.graph);
		};
	}, []);

	/**
	 * called when selecting a link as a treeEdge
	 * @param linkId id of the link which will be modified
	 */
	const onChooseLink = (linkId: number): void => {
		// isTreeMemberInput gets flipped
		const updatedLinkList = getLinkList().map((link) => {
			if (link.id === linkId) {
				return {
					...link,
					isTreeMemberInput: !link.isTreeMemberInput!,
					correctResult: !link.correctResult,
				};
			}
			return link;
		});
		setLinkList(updatedLinkList);
	};

	interface circleNode {
		vertexId: string;
		visited: boolean;
		finished: boolean;
	}

	// Implemented according to https://en.wikipedia.org/wiki/Cycle_(graph_theory)#Cycle_detection
	function cycleCheck(links: string[][], nodes: string[]): boolean {
		const circleNodeList: circleNode[] = nodes.map((vertexId) => ({
			vertexId,
			visited: false,
			finished: false,
		}));

		let hasCycle = false;
		const DFS = (previousVertexId?: string) => (vertex: circleNode) => {
			if (vertex.finished) return;
			if (vertex.visited) {
				hasCycle = true;
				return;
			}
			vertex.visited = true;
			const neighbours = links
				.filter(([source, target]) => source === vertex.vertexId || target === vertex.vertexId)
				.map(([source, target]) => (source === vertex.vertexId ? target : source))
				.filter((neighbourId) => neighbourId !== previousVertexId)
				.map((neighbourId) => circleNodeList.find((node) => node.vertexId === neighbourId)!);
			neighbours.forEach(DFS(vertex.vertexId));
			vertex.finished = true;
		};
		circleNodeList.forEach(DFS(undefined));

		return hasCycle;
	}

	const onSubmit = (): void => {
		const inputTree = getLinkList()
			.filter((x) => x.isTreeMemberInput)
			.map((x) => [x.source, x.target]);
		const solutionTree = getLinkList()
			.filter((x) => x.isTreeMember)
			.map((x) => [x.source, x.target]);
		const reachedNodes = new Set(inputTree.reduce((x, y) => x.concat(y), []));
		const unreachedNodes = getVisState()!
			.graph.nodes.filter((x) => !reachedNodes.has(x.id))
			.map((x) => x.name ?? x.id)
			.sort((a, b) => a.localeCompare(b));

		const inputTreeWeight = getLinkList()
			.filter((x) => x.isTreeMemberInput)
			.map((x) => x.weight)
			.reduce((x, y) => x + y, 0);
		const solutionTreeWeight = getLinkList()
			.filter((x) => x.isTreeMember)
			.map((x) => x.weight)
			.reduce((x, y) => x + y, 0);

		const hasCycle = cycleCheck(inputTree, Array.from(reachedNodes));
		const solIsSpanningTree = inputTree.length === getVisState()!.graph.nodes.length - 1 && !hasCycle;

		// note that this does not respect different order while it should, but given the construction, that's fine
		const isSolutionCorrect = solutionTree.toString() === inputTree.toString();

		let feedbackText = "";
		if (!solIsSpanningTree) {
			feedbackText += "Your solution is not a spanning tree because";
			if (hasCycle) {
				feedbackText += ` there are cycles in your solution${unreachedNodes.length === 0 ? "" : " and"}`;
			} else if (inputTree.length + 1 < reachedNodes.size) {
				feedbackText += ` the edges are not connected${unreachedNodes.length === 0 ? "" : " and"}`;
			}
			if (unreachedNodes.length === 1) {
				feedbackText += ` node ${unreachedNodes[0]!} is not reached`;
			} else if (unreachedNodes.length > 1) {
				feedbackText += ` nodes ${unreachedNodes.slice(0, -1).join(", ")} and ${unreachedNodes.at(-1)!} are not reached`;
			}
		} else {
			feedbackText += "You have found a spanning tree, but";
			if (inputTreeWeight > solutionTreeWeight) {
				feedbackText += ` the weight of your solution is ${inputTreeWeight} while the optimal solution has a weight of ${solutionTreeWeight}`;
			}
			if (inputTreeWeight === solutionTreeWeight && !isSolutionCorrect) {
				feedbackText +=
					" you did not consider the edges in lexicographical order (your solution is theoretically correct)";
			}
		}
		feedbackText += "!";

		setFeedback({
			isAnswerCorrect: isSolutionCorrect,
			feedbackText,
		});

		setShowingResults(true);
		setGraphState(solutionGraph!);
		updateLinkListColors(solutionGraph!);
	};

	const onNewGraph = (): void => {
		setLayoutAlgorithm(LayoutAlgorithm.Circle);
		setNewGraph(getRandomGraph());
		onGraphChanged();
	};

	if (!isInitialized || getVisState() === null) {
		return <Spinner />;
	}

	return isInitialized && getVisState() !== null ? (
		<TrainingForm
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			onSubmit={handleSubmit(onSubmit)}
			useAlgorithmStore={useAlgorithmStore}
			controls={
				<>
					<TrainingFormResetButton onClick={onFormReset} />
					<TrainingFormNewGraphButton onClick={onNewGraph} />
					<TrainingFormSubmitButton disabled={isShowingResults} />
				</>
			}
			feedback={
				<FeedbackAlert
					feedback={feedback}
					isFeedbackVisible={isShowingResults}
				/>
			}
		>
			{getLinkList().map(({ id, target, source, isTreeMemberInput, correctResult }) => (
				<li
					key={id}
					className="flex w-full items-center justify-center"
				>
					<div className="flex w-20" />
					<div className="aspect-10/1 w-3/5">
						<button
							className={`btn btn-xs my-[5px] size-full md:btn-md ${
								isTreeMemberInput! ? "btn-primary" : "btn-neutral"
							}`}
							onClick={isShowingResults ? undefined : () => onChooseLink(id)}
							type="button"
							onMouseEnter={() => {
								colorLink(config)(source)(target)(true, isShowingResults);
								setGraphState({ ...graphState, edges: updateColors(graphState) });
							}}
							onMouseLeave={() => {
								colorLink(config)(source)(target)(false, isShowingResults);
								setGraphState({ ...graphState, edges: updateColors(graphState) });
							}}
						>
							({source},{target})
						</button>
					</div>
					<div className="flex w-20 justify-center">
						{isShowingResults &&
							(correctResult ? (
								<CircleCheck className="text-success" />
							) : (
								<CircleX className="text-error" />
							))}
					</div>
				</li>
			))}
		</TrainingForm>
	) : (
		<Spinner />
	);
};

export default MSTQuickTraining;
