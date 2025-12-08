import React, { ReactElement } from "react";
import { useParams } from "react-router-dom";
import { AvailableAlgorithm } from "../utils/available-algorithms";
import { AlgorithmDoesNotExist } from "./AlgorithmRouter";
import { GraphPage } from "../components/GraphPage/GraphPage";

/**
 * Router for the graph pages.
 * Finds the current algorithm and inserts it into the GraphPage component.
 */
export const GraphRouter: React.FC = () => {
	const { algorithm } = useParams();

	let graphPage: ReactElement | undefined;

	Object.values(AvailableAlgorithm).forEach((alg) => {
		if (alg.name.toLowerCase() === algorithm) {
			graphPage = <GraphPage algorithm={alg} />;
		}
	});

	return graphPage ?? <AlgorithmDoesNotExist />;
};
