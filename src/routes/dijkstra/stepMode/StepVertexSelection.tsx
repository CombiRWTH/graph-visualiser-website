import React from "react";
import "intro.js/introjs.css";
import { NodeStateSelection } from "../types";
import { Modal, ModalToggle } from "../../../components/Modal";
import { CircleHelp } from "lucide-react";

interface IStepVertexSelectionProbs {
	// the id of the node selected by the user. -1 if no vertex is selected yet
	selectedId: number;
	// setter for selectedId
	setSelectedId: (id: number) => void;
	// the id of the node selected by the algorithm. -1 after the last iteration
	solutionId: number;
	// contains relevant info about the graph
	nodeList: NodeStateSelection[];
	// indicates whether the correct solution is displayed or not
	isShowingResults: boolean;
	// function to call when a node/vertex is to be highlighted on hover
	highlightNode: (id: number, shouldHighlight: boolean) => void;
	// function to color the active node/vertex
	colorActiveNode: (id: number) => void;
}

const errorModalId = "error-info-modal";

export const StepVertexSelection: React.FC<IStepVertexSelectionProbs> = ({
	selectedId,
	setSelectedId,
	solutionId,
	nodeList,
	isShowingResults,
	highlightNode,
	colorActiveNode,
}) => {
	// useEffect(() => {}, []);

	return (
		<>
			<Modal
				id={errorModalId}
				className="overflow-visible"
				body={
					<>
						<h3 className="text-lg font-bold text-primary">
							<CircleHelp />
						</h3>
						<p className="py-4">
							At each iteration, the algorithm selects the vertex with the smallest distance that has not
							yet been marked. If the vertex with the smallest distance is not unique, the smallest index
							is used as a tie-breaker. In this iteration, the selected vertex is vertex {solutionId} with
							distance {nodeList[solutionId].distInput}
						</p>
					</>
				}
			/>
			{nodeList !== undefined && (
				<div className="flex w-1/2 flex-col gap-2 md:gap-4">
					{nodeList
						.filter((node) => !node.marked)
						.map((node) => {
							const isSelected = node.id === selectedId;
							const isCorrect = node.id === solutionId;
							const colorString = isShowingResults
								? (isCorrect ? "btn-success" : isSelected ? "btn-error" : "btn-neutral") +
									" pointer-events-none"
								: "btn-neutral";
							return (
								<div className="flex w-full grow items-center justify-between gap-5">
									{/* counterpart to the badge */}
									<div className="w-10" />
									<button
										key={node.id}
										title="vertices"
										type="submit"
										className={`btn ${colorString} lg:btn-xl btn-xs flex grow items-center text-xs md:btn-md md:text-base`}
										onClick={() => {
											setSelectedId(node.id);
											colorActiveNode(solutionId);
										}}
										onMouseEnter={() => {
											highlightNode(node.id, true);
										}}
										onMouseLeave={() => {
											highlightNode(node.id, false);
										}}
									>
										Vertex {node.id} - Distance {node.distInput}
									</button>
									{isShowingResults && isSelected && !isCorrect ? (
										<ModalToggle
											id={errorModalId}
											className="flex flex-row items-center"
										>
											<div className="w-10 cursor-pointer hover:text-primary">
												<CircleHelp />
											</div>
										</ModalToggle>
									) : (
										<div className="w-10" />
									)}
								</div>
							);
						})}
					<h1 className="self-start px-4 py-3 font-bold">
						{nodeList.filter((node) => node.marked).length > 0 ? "Marked Vertices" : ""}
					</h1>
					{nodeList !== undefined && (
						<div className="flex w-full flex-col gap-2 md:gap-4">
							{nodeList
								.filter((node) => node.marked)
								.map(({ id, distInput }) => (
									<div className="flex w-full grow items-center justify-between gap-5">
										{/* counterpart to the badge */}
										<div className="w-10" />
										<button
											key={id}
											title="vertices"
											type="button"
											className="btn btn-neutral btn-xs pointer-events-none flex grow items-center text-xs md:btn-md sm:text-sm md:text-base"
										>
											Vertex {id} - Distance {distInput}
										</button>
										<div className="w-10" />
									</div>
								))}
						</div>
					)}
				</div>
			)}
		</>
	);
};
