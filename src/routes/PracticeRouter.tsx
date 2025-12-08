import React, { ReactElement } from "react";
import { useParams } from "react-router-dom";
import { AvailableAlgorithm } from "../utils/available-algorithms";
import { PracticePages } from "./PracticePages";
import { AlgorithmDoesNotExist } from "./AlgorithmRouter";

const NoPracticePage: React.FC = () => {
	const { algorithm } = useParams();
	return (
		<div className="flex h-dvh w-dvw items-center justify-center">
			<h1>{`No practice page is available for algorithm "${algorithm!}"`}</h1>;
		</div>
	);
};

export const PracticeRouter: React.FC = () => {
	const { algorithm } = useParams();

	let practicePages: ReactElement | undefined;
	let algorithmExists = false;

	Object.values(AvailableAlgorithm).forEach((alg) => {
		if (alg.name.toLowerCase() === algorithm) {
			algorithmExists = true;
		}
		if (alg.name.toLowerCase() === algorithm && alg.features.availableTrainingModes !== undefined) {
			practicePages = <PracticePages algorithm={alg} />;
		}
	});

	return practicePages ?? (algorithmExists ? <NoPracticePage /> : <AlgorithmDoesNotExist />);
};
