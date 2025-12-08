import React, { ReactNode, useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TrainingStage, useTrainingStagesStore } from "../hooks/TrainingStagesStore";
import { IAlgorithmPageProps } from "./AlgorithmPage/AlgorithmPage";
import { GraphSplitView } from "./GraphVisualizer/GraphSplitView";
import { GraphTS } from "../utils/graphs";
import { AnimatePresence, motion } from "framer-motion";
import { LinkTS, NodeTS } from "../algorithms/adapter";

export interface ITrainingPageProps extends IAlgorithmPageProps {
	children?: ReactNode;
	graphState: GraphTS<NodeTS, LinkTS>;
}

export const Training: React.FC<ITrainingPageProps> = ({ algorithm, children, graphState }: ITrainingPageProps) => {
	const [isTooLarge, setIsTooLarge] = useState(false);
	const navigate = useNavigate();
	const [maxNodes] = useState(20);
	const [maxLinks] = useState(30);

	const { getStageList, getCurrentStage } = useTrainingStagesStore();
	const showProgress: boolean =
		getStageList().length > 1 && getStageList().some((stage) => stage.shortTitle !== undefined);

	useEffect(() => {
		if (
			(graphState.edges !== undefined && graphState.edges.length > maxLinks) ||
			graphState.nodes.length > maxNodes
		) {
			setIsTooLarge(true);
		}
	}, [graphState]);

	return (
		<div className={"flex h-full flex-col"}>
			{/* Progressbar */}
			<AnimatePresence>
				{showProgress && (
					<motion.div
						className={"max-lg:hidden"}
						initial={{ minHeight: 0, height: 0, overflow: "hidden" }}
						animate={{ minHeight: "5rem", height: "auto" }}
						exit={{ minHeight: 0, height: 0 }}
					>
						<ul
							key="progress"
							className="steps mx-auto min-h-20 w-full p-3 max-lg:hidden"
						>
							{getStageList().map(
								(stage: TrainingStage, index: number) =>
									stage.shortTitle !== undefined && (
										<li
											key={index}
											className={
												"step " + (index <= getCurrentStage()!.stageId ? "step-primary" : "")
											}
										>
											{stage.shortTitle}
										</li>
									)
							)}
						</ul>
					</motion.div>
				)}
			</AnimatePresence>
			<GraphSplitView
				algorithm={algorithm}
				actionButtons={{ showInfo: false, showHints: false, showColorPicker: false, showFeatureExplain: false }}
				graphState={graphState}
				classNameLeft="w-full lg:w-5/6"
			>
				{isTooLarge ? (
					<div className="right-body flex flex-col items-center justify-center ">
						<h1 className="mb-4 text-2xl font-bold">Too Large</h1>
						<div className="min-w-fit p-6">
							This graph is too large for the training modes. To train on a graph it should have less than{" "}
							{maxNodes} vertices and {maxLinks} edges.
						</div>
						<div>
							<button
								className="btn btn-primary gap-4"
								onClick={() => navigate(`/${algorithm.name.toLowerCase()}/graph`)}
							>
								<ChevronLeft />
								Choose Graph
							</button>
						</div>
					</div>
				) : (
					<div className="right-body flex w-full grow">{children}</div>
				)}
			</GraphSplitView>
		</div>
	);
};
