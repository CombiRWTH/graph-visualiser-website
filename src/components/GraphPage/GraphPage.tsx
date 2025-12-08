import React, { useEffect, useState } from "react";
import {
	AvailableAlgorithm,
	formatMissingRequirements,
	generalCompatibilityCheck,
	IAlgorithmInformation,
} from "../../utils/available-algorithms";
import { GraphSplitView } from "../GraphVisualizer/GraphSplitView";
import { useNavigate } from "react-router-dom";
import { Play, Rocket } from "lucide-react";
import { CompatibilityInfo } from "../CompatibilityInfo";
import { ModalKit } from "../Modal";
import { ChooseGraphButtons } from "./ChooseGraphButtons";
import { IAlgorithmStore } from "../../algorithms/algorithm-interfaces";
export interface IGraphProps {
	algorithm: IAlgorithmInformation;
}

export const GraphPage: React.FC<IGraphProps> = ({ algorithm }: IGraphProps) => {
	const [showInfo, setShowInfo] = useState(window.innerWidth < 1024);
	const navigate = useNavigate();
	const [buttonSize, setButtonSize] = useState<"sm" | "md">(window.innerWidth < 1000 ? "sm" : "md");

	useEffect(() => {
		const handleResize = (): void => setButtonSize(window.innerWidth < 1000 ? "sm" : "md");
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		const handleResize = (): void => setShowInfo(window.innerWidth < 1024);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);
	const { visState }: IAlgorithmStore = algorithm.useAlgorithmStore((state: IAlgorithmStore) => ({
		...state,
		visState: state.getVisState(),
	}));
	return (
		<GraphSplitView
			algorithm={algorithm}
			actionButtons={{ showInfo, showHints: false, showColorPicker: false, showFeatureExplain: false }}
			classNameGraphCard={"lg:size-[30rem] lg:max-h-[30rem] bg-base-300!"}
			classNameLeft={"lg:size-[30rem]"}
		>
			<div className={"left-header mb-4"}>
				<ChooseGraphButtons algorithm={algorithm} />
			</div>
			<div className={"right-body"}>
				{!showInfo && (
					<>
						<h1 className={"max-w-[550px] text-2xl font-bold"}>
							About {algorithm.name.charAt(0).toUpperCase() + algorithm.name.slice(1)}'s Algorithm
						</h1>
						<p className={"my-5 max-w-[550px]"}>{algorithm.description}</p>
					</>
				)}
				<div className={"mt-10 flex flex-col items-center gap-5"}>
					<button
						className={`size-[${buttonSize}] btn btn-primary btn-xs w-64 gap-5 sm:btn-sm md:btn-md`}
						onClick={() => navigate(`/${algorithm.name.toLowerCase()}/algorithm`)}
					>
						<Play /> Run
					</button>
					{algorithm?.features?.availableTrainingModes !== undefined && (
						<button
							className={`size-[${buttonSize}] btn btn-primary btn-xs w-64 gap-5 sm:btn-sm md:btn-md`}
							onClick={() => navigate(`/${algorithm.name.toLowerCase()}/practice`)}
						>
							Train with the Graph!
						</button>
					)}
					{visState !== undefined && (
						<>
							or
							<ModalKit
								id="algorithm-list-modal"
								title="Choose another algorithm"
								body={
									<div className="flex flex-col gap-5">
										{Object.values(AvailableAlgorithm).map((alg) => (
											<CompatibilityInfo
												key={"compatibility-info" + alg.name}
												name={alg.name.toLowerCase()}
												compatible={() => {
													return generalCompatibilityCheck !== undefined
														? generalCompatibilityCheck(visState!.graph, alg.requirements)
														: false;
												}}
												useAlgorithmStore={alg.useAlgorithmStore}
												messages={formatMissingRequirements(
													visState?.graph ?? { nodes: [], edges: [] },
													alg.requirements
												)}
												graph={visState?.graph}
											/>
										))}
									</div>
								}
							>
								<div className="btn btn-outline">
									{" "}
									<Rocket />
									Try another algorithm on this graph{" "}
								</div>
							</ModalKit>
						</>
					)}
				</div>
			</div>
		</GraphSplitView>
	);
};
