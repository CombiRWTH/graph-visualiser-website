import React, { ReactElement, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { IAlgorithmInformation, ITrainingPageProps } from "../utils/available-algorithms";
import { GraphTS } from "../utils/graphs";
import { Training } from "../components/Training";
import { TrainingModeSelection } from "../components/TrainingModeSelection";
import { availableTrainingModes } from "../utils/available-training-modes";
import { useTrainingStagesStore } from "../hooks/TrainingStagesStore";
import { LinkTS, NodeTS } from "../algorithms/adapter";

interface IPracticePagesProps {
	algorithm: IAlgorithmInformation;
}

export const PracticePages: React.FC<IPracticePagesProps> = ({ algorithm }: IPracticePagesProps) => {
	const [graphState, setGraphState] = useState<GraphTS<NodeTS, LinkTS>>({
		nodes: [],
		edges: [],
	});

	const { resetStages } = useTrainingStagesStore();
	useEffect(() => {
		resetStages();
		return resetStages;
	}, []);

	const ModeDoesNotExist: React.FC<{ modeName: string }> = ({ modeName }) => {
		return (
			<Route
				path={modeName}
				element={
					<div className="flex h-dvh w-dvw items-center justify-center">
						<h1>{`There is no ${modeName} training mode for "${algorithm.name}"`}</h1>
					</div>
				}
			/>
		);
	};

	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	useEffect(() => {
		const handleResize = (): void => setWindowWidth(window.innerWidth);
		window.addEventListener("resize", handleResize);

		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Wrap the children with the Training component,
	// so the graph will not be displayed if the "does not exist" message is shown
	function wrapWithTraining(children: React.ReactNode): ReactElement {
		return (
			<Training
				algorithm={algorithm}
				graphState={graphState}
			>
				{children}
			</Training>
		);
	}

	return (
		<Routes>
			<Route
				key={`${algorithm.name}-training`}
				path="/"
				element={
					windowWidth > 1024 ? (
						wrapWithTraining(
							<TrainingModeSelection
								algorithm={algorithm}
								useAlgorithmStore={algorithm.useAlgorithmStore}
								setGraphState={setGraphState}
							/>
						)
					) : (
						<TrainingModeSelection
							algorithm={algorithm}
							useAlgorithmStore={algorithm.useAlgorithmStore}
							setGraphState={setGraphState}
						/>
					)
				}
			/>
			{/* For each training mode check if it exists in the algorithm and if it does, render it */}
			{availableTrainingModes.map((mode) => {
				let TrainingMode: React.FC<ITrainingPageProps> | undefined;
				Object.entries(algorithm.features.availableTrainingModes ?? {}).forEach((entry) => {
					// Rename "step" to "step-by-step" to match the route
					const trainingModeName: string = entry[0] === "step" ? "step-by-step" : entry[0];
					if (trainingModeName === mode.name) {
						TrainingMode = entry[1];
					}
				});
				return TrainingMode !== undefined ? (
					<Route
						key={mode.name}
						path={mode.name}
						element={wrapWithTraining(
							<TrainingMode
								graphState={graphState}
								setGraphState={setGraphState}
							/>
						)}
					/>
				) : (
					ModeDoesNotExist({ modeName: mode.name })
				);
			})}
		</Routes>
	);
};
