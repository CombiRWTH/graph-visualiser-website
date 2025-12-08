import React, { useEffect } from "react";
import { GraphinContext, GraphinContextType } from "@antv/graphin";

/**
 * This component extracts the graph from the GraphinContext and hands it to the given callback function.
 * @constructor
 */
interface IGraphGetGraph {
	callback: (graph: GraphinContextType) => void;
}

function GraphExtractGraphObject({ callback }: IGraphGetGraph): React.JSX.Element {
	const graph = React.useContext(GraphinContext);

	useEffect(() => {
		if (graph !== null) {
			callback(graph);
		}
	}, []);

	return <></>;
}

export default GraphExtractGraphObject;
