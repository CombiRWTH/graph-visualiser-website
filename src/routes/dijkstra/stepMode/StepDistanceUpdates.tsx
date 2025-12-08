import React from "react";
import "intro.js/introjs.css";

import { DistanceUpdateTable } from "../DistanceUpdateTable";
import { NumberOrInfinity, NodeStateUpdates } from "../types";
import { CircleHelp } from "lucide-react";
import { Modal } from "../../../components/Modal";

const errorModalId = "error-info-modal";

interface IStepDistanceUpdatesProbs {
	// id of the node selected in the current iteration of the algorithm. -1 after the last iteration
	selectedNodeId: number;
	// contains the options for each node offered to the user to update the distances
	updateDistOptions: { [id: number]: NumberOrInfinity[] };
	// contains relevant info about the graph + distInput property that stores user input
	nodeList: NodeStateUpdates[];
	// used to set distance inputs from user
	setDistsByIds: (updates: { [id: number]: NumberOrInfinity }) => void;
	// used for the error feedback
	getEdgeWeight: (sourceId: number, targetId: number) => number | undefined;
	// indicates whether the correct solution is displayed or not
	isShowingResults: boolean;
	// this method is called to move to the next training stage
	nextStage: () => void;
}

export const StepDistanceUpdates: React.FC<IStepDistanceUpdatesProbs> = ({
	selectedNodeId,
	updateDistOptions,
	nodeList,
	setDistsByIds,
	getEdgeWeight,
	isShowingResults,
}) => {
	// Provides detailed error feedback that is given to the user
	const getErrorFeedback = (nodeId: number): string => {
		const selectedNode = nodeList[selectedNodeId];
		const node = nodeList[nodeId];
		const edgeWeight = getEdgeWeight(selectedNodeId, nodeId);
		if (
			node.distInput === undefined ||
			node.distSolution === undefined ||
			node.distLastIter === undefined ||
			selectedNode.distSolution === undefined
		) {
			// this case should never occur. makes sure all relevant variables are initialized
			return `An error has occured. Please try reloading the page.`;
		} else if (node.distInput > node.distLastIter) {
			// case 1: user tries to increase distance of node
			return `Each intermediate distance calculated by the algorithm is witnessed by a concrete path. So the distance values never increase as the algorithm runs.`;
		} else if (edgeWeight === undefined) {
			// case 2: user decreases distance but there is no edge from the node of the current iteration to nodeId
			return `There is no edge from node ${selectedNodeId} to node ${nodeId}, which means that the distance of node ${nodeId} cannot be improved in this iteration.`;
		} else if (node.distLastIter === node.distSolution) {
			// case 3: there is an edge, but taking it does not yield a shorter path to nodeId
			return `The edge (${selectedNodeId}, ${nodeId}) does not provide a shorter path to node ${nodeId} because ${selectedNode.distSolution !== undefined ? selectedNode.distSolution : "undefined"}+${edgeWeight}≥${node.distLastIter}.`;
		} else {
			// case 4: a new shortest path is fould by the algo and the user either kept the same distance over lowered the distance too much
			return `We find a shorter path to node ${nodeId} using the edge (${selectedNodeId}, ${nodeId}). The new path has length ${selectedNode.distSolution !== undefined ? selectedNode.distSolution : "undefined"}+${edgeWeight}=${node.distSolution}.`;
		}
	};

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
			{nodeList.some((node) => !node.marked) && <h1 className="text-xl">Current vertex: {selectedNodeId}</h1>}
			{nodeList.some((node) => !node.marked) ? (
				<DistanceUpdateTable
					nodeList={nodeList.filter((node) => !node.marked)}
					updateDist={(id, newDist) => setDistsByIds({ [id]: newDist })}
					updateDistOptions={updateDistOptions}
					isShowingResults={isShowingResults}
					modalId={errorModalId}
				/>
			) : (
				<h1>
					There are no distances to update. <br></br>Click on "CONTINUE" to see your results.
				</h1>
			)}
		</>
	);
};
