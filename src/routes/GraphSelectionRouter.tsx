import React, { ReactElement } from "react";
import GraphSelectionPage from "../components/GraphSelectionPage/GraphSelectionPage";
import { useLocation } from "react-router-dom";
import { AvailableAlgorithm } from "../utils/available-algorithms";

function GraphSelectionRouter(): React.JSX.Element {
	const path = useLocation();

	let graphBuilderPage: ReactElement | undefined;

	Object.values(AvailableAlgorithm).forEach((alg) => {
		if (path.pathname?.includes(alg.name.toLowerCase())) {
			graphBuilderPage = <GraphSelectionPage algorithm={alg} />;
		}
	});

	return graphBuilderPage ?? <GraphSelectionPage />;
}

export default GraphSelectionRouter;
