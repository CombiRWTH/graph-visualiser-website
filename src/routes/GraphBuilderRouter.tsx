import React, { useRef } from "react";
import { useLocation } from "react-router-dom";
import { AvailableAlgorithm } from "../utils/available-algorithms";
import { GraphBuilder } from "../components/GraphBuilder";
import { createGraphForStorage, getGraphFromStorage } from "../utils/graph-local-storage";
import { IGraphStorage } from "../types/graph";

/**
 * Router for the graph builder page.
 * @constructor
 */
function GraphBuilderRouter(): React.JSX.Element {
	const path = useLocation();
	const searchParams = new URLSearchParams(path.search);

	// Check path for algorithm name and id of a graph that should be loaded
	const algorithm = Object.values(AvailableAlgorithm).find((alg) =>
		path?.pathname.toLowerCase().includes(alg.name.toLowerCase())
	);
	const graph = useRef<IGraphStorage>(
		getGraphFromStorage(searchParams.get("id")) ?? createGraphForStorage(algorithm?.name)
	);

	if (algorithm !== undefined && graph !== undefined) {
		return (
			<GraphBuilder
				algorithm={algorithm}
				givenGraph={graph.current}
			/>
		);
	} else if (algorithm !== undefined) {
		return <GraphBuilder algorithm={algorithm} />;
	} else if (graph !== undefined) {
		if (
			graph.current.restrictedToAlgorithm !== undefined &&
			Object.values(AvailableAlgorithm).find((alg) => alg.name === graph.current.restrictedToAlgorithm) !==
				undefined
		) {
			return (
				<GraphBuilder
					algorithm={Object.values(AvailableAlgorithm).find(
						(alg) => alg.name === graph.current.restrictedToAlgorithm
					)}
					givenGraph={graph.current}
				/>
			);
		} else {
			return <GraphBuilder givenGraph={graph.current} />;
		}
	} else {
		return <GraphBuilder />;
	}
}
export default GraphBuilderRouter;
