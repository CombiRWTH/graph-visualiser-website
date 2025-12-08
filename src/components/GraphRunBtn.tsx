import React from "react";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AvailableAlgorithm, IAlgorithmInformation } from "../utils/available-algorithms";
import GraphSelectionAlgorithmDialog from "./GraphSelectionPage/GraphSelectionAlgorithmDialog";
import { IGraphStorage } from "../types/graph";
import { useGraphBuilderStore } from "../stores/graph-builder-store";
import { IUserEdge } from "@antv/graphin";
import { LayoutAlgorithm } from "../algorithms/algorithm-interfaces";

interface IGraphRunBtnProps {
	algorithm?: IAlgorithmInformation;
	graph: IGraphStorage;
}

function GraphRunBtn({ algorithm, graph }: IGraphRunBtnProps): React.JSX.Element {
	const navigate = useNavigate();
	const { hasNegativeEdge, hasSelfLoop, hasUndirectedEdge, hasDirectedEdge, isConnected, isComplete } =
		useGraphBuilderStore();

	const stores = Object.values(AvailableAlgorithm).map((alg) =>
		alg.useAlgorithmStore((state) => {
			return {
				...state,
				visState: state.getVisState(),
			};
		})
	);

	function allEdgesHaveWeight(): boolean {
		return (
			graph?.graph?.edges?.every((edge: IUserEdge) => {
				const weight = Number(edge?.style?.label?.value);
				return !isNaN(weight);
			}) ?? false
		);
	}

	function getGraphRequirementIssue(algorithm: IAlgorithmInformation): string | null {
		const requirements = algorithm?.requirements;
		if (requirements == null) return null;
		const { connected, complete, noDirectedEdge, noUndirectedEdge, noSelfLoop, noNegativeWeights } = requirements;

		if (graph?.graph?.nodes?.length === 0) {
			return "Graph must be non-empty.";
		}
		if (connected === true && !isConnected) {
			return "Graph must be connected.";
		}
		if (noDirectedEdge === true && hasDirectedEdge) {
			return "Graph must not contain directed edges.";
		}
		if (noUndirectedEdge === true && hasUndirectedEdge) {
			return "Graph must not contain undirected edges.";
		}
		if (noSelfLoop === true && hasSelfLoop) {
			return "Graph must not contain self-loops.";
		}
		if (noNegativeWeights === true && hasNegativeEdge) {
			return "Graph must not contain negative edge weights.";
		}
		if (!allEdgesHaveWeight()) {
			return "All edges must have weights.";
		}
		if (complete === true && !isComplete) {
			return "Graph must be complete.";
		}

		return null;
	}

	function handleClick(algorithm?: IAlgorithmInformation): void {
		if (algorithm !== undefined && getGraphRequirementIssue(algorithm) === null) {
			const index = Object.values(AvailableAlgorithm).findIndex((alg) => alg.name === algorithm.name);
			stores[index].setLayoutAlgorithm(LayoutAlgorithm.Free);
			stores[index].setNewGraph(
				{
					nodes: graph.graph.nodes.map((node) => ({
						...node,
						color: node.style?.keyshape?.fill !== undefined ? String(node.style.keyshape.fill) : "",
						...(node.style?.label?.value !== undefined ? { name: String(node.style.label.value) } : {}),
					})),
					edges: graph.graph.edges?.map((edge) => ({
						...edge,
						color: edge.style?.keyshape?.stroke !== undefined ? String(edge.style.keyshape.stroke) : "",
						weight: Number(edge.style!.label!.value!),
					})),
				},
				// the remaining style information that won't get send to rust:
				{ graphinGraph: graph.graph }
			);
			navigate(`/${algorithm.name.toLowerCase()}/graph/`);
		}
	}

	if (algorithm !== undefined) {
		const issue = getGraphRequirementIssue(algorithm);
		const isDisabled = issue !== null;

		const button = (
			<button
				className="btn btn-primary mx-20 flex items-center justify-center gap-2"
				onClick={() => handleClick(algorithm)}
				disabled={isDisabled}
			>
				<Play className="size-6" />
				<h3 className="font-bold">Run algorithm or train with Graph</h3>
			</button>
		);
		return (
			<div className="absolute bottom-24 right-4 flex flex-col items-end gap-2">
				{isDisabled ? (
					<div
						className="tooltip tooltip-error"
						data-tip={issue}
					>
						{button}
					</div>
				) : (
					button
				)}
			</div>
		);
	}

	return (
		<GraphSelectionAlgorithmDialog
			includeNone={false}
			callbackFn={(algorithm) => {
				handleClick(algorithm);
			}}
			disabledAlgorithms={Object.values(AvailableAlgorithm)
				.filter((alg) => getGraphRequirementIssue(alg) !== null)
				.map((alg) => alg.name)}
			trigger={
				<div className="btn btn-primary absolute bottom-24 right-4 mx-20 flex items-center justify-center gap-2">
					<Play className="size-6" />
					<h3 className="font-bold">Run algorithm or train with Graph</h3>
				</div>
			}
		/>
	);
}

export default GraphRunBtn;
