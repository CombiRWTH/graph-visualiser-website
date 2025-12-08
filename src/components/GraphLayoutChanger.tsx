import React, { useContext, useEffect } from "react";
import { GraphinContext } from "@antv/graphin";
import { ILayoutAlgorithm } from "../algorithms/algorithm-interfaces";

function GraphLayoutChanger({ layout }: { layout: ILayoutAlgorithm }): React.JSX.Element {
	const { graph } = useContext(GraphinContext);

	useEffect(() => {
		if (graph !== null) {
			graph.updateLayout(layout.type);
			graph.layout();
		}
	}, [layout]);

	return <></>;
}

export default GraphLayoutChanger;
