import React, { useEffect, useState } from "react";
import { Behaviors } from "@antv/graphin";

/**
 * GraphFitView component zooms out the graph to fit all nodes and edges within the graph container.
 * @constructor
 */
function GraphFitView(): React.JSX.Element {
	const [init, setInit] = useState(false);

	const { FitView } = Behaviors;

	useEffect(() => {
		if (!init) {
			setInit(true);
		}
	}, []);

	return <>{init && <FitView />}</>;
}

export default GraphFitView;
