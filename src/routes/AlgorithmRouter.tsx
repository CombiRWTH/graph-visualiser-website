import React, { ReactElement } from "react";
import { useParams } from "react-router-dom";
import { AvailableAlgorithm } from "../utils/available-algorithms";
import { Algorithm } from "../components/AlgorithmPage/AlgorithmPage";

export const AlgorithmDoesNotExist: React.FC = () => {
	const { algorithm } = useParams();
	return (
		<div className="flex h-dvh w-dvw items-center justify-center">
			<h1>{`Could not find algorithm "${algorithm!}"`}</h1>
		</div>
	);
};

/**
 * Router for the algorithm pages.
 * Finds the current algorithm and inserts it into the Algorithm component.
 */
export const AlgorithmRouter: React.FC = () => {
	const { algorithm } = useParams();

	let algorithmPage: ReactElement | undefined;

	Object.values(AvailableAlgorithm).forEach((alg) => {
		if (alg.name.toLowerCase() === algorithm) {
			algorithmPage = <Algorithm algorithm={alg} />;
		}
	});

	return algorithmPage ?? <AlgorithmDoesNotExist />;
};
