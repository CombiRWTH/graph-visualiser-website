import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IAlgorithmInformation } from "../utils/available-algorithms";
import { IAlgorithmStore } from "../algorithms/algorithm-interfaces";
import { GraphTS } from "../utils/graphs";
import { availableTrainingModes } from "../utils/available-training-modes";
import { LinkTS, NodeTS } from "../algorithms/adapter";

interface ITrainingModesProps {
	algorithm: IAlgorithmInformation;
}

export interface ITrainingModeSelectionProps extends ITrainingModesProps {
	useAlgorithmStore: (fn: (state: IAlgorithmStore) => IAlgorithmStore) => IAlgorithmStore;
	setGraphState: React.Dispatch<React.SetStateAction<GraphTS<NodeTS, LinkTS>>>;
}

export const TrainingModeSelection: React.FC<ITrainingModeSelectionProps> = ({
	algorithm,
	useAlgorithmStore,
	setGraphState,
}) => {
	const { initialGraph } = useAlgorithmStore((state) => ({ ...state }));

	useEffect(() => {
		setGraphState(initialGraph);
	}, []);

	return <TrainingModes algorithm={algorithm} />;
};

const TrainingModes: React.FC<ITrainingModesProps> = ({ algorithm }) => {
	const navigate = useNavigate();
	// Find all available training modes for the current algorithm
	const trainingModesEntries: string[] = Object.entries(algorithm.features.availableTrainingModes ?? {}).map(
		(entry) => (entry[0] === "step" ? "step-by-step" : entry[0])
	);

	return (
		<div className="col-span-2 flex size-full justify-center">
			<div className="grow-1 flex flex-col items-center gap-2 self-center">
				<h1 className="pb-8 text-4xl font-semibold">Training Modes:</h1>
				{trainingModesEntries.map((modeName, index) => {
					const { description, buttonText } = availableTrainingModes.find(
						(mode) => mode.name === modeName
					) ?? {
						// Display a button so the developer knows there is something not working properly
						description:
							"WARNING: THE KEY DOES NOT MATCH ANY OF THE COMMON TRAINING MODES! PLEASE ADD A DESCRIPTION AND BUTTON TEXT FOR THIS MODE!",
						buttonText: "WARNING, NO MATCH FOUND!",
					};
					return (
						<div
							key={modeName + "training"}
							className="flex flex-col items-center gap-3"
						>
							<div className="text-center">{description}</div>
							<button
								id={`onboarding-${modeName.toLowerCase()}`}
								name={`${modeName.toLowerCase()}ResultsMode`}
								value="true"
								className="btn btn-primary w-60 md:btn-md lg:btn-lg"
								onClick={() =>
									navigate(`/${algorithm.name.toLowerCase()}/practice/${modeName.toLowerCase()}`)
								}
							>
								{buttonText}
							</button>
							{index !== trainingModesEntries.length - 1 && (
								<div className="relative flex w-full items-center py-5">
									<div className="grow border-t border-gray-400"></div>
									<span className="mx-4 shrink text-gray-400">OR</span>
									<div className="grow border-t border-gray-400"></div>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};
