import React, { useContext, useEffect } from "react";
import { GraphinContext, IG6GraphEvent } from "@antv/graphin";

export function GraphEraser(): React.JSX.Element {
	const { graph } = useContext(GraphinContext);

	function deleteItem(e: IG6GraphEvent): void {
		const item = e.item;
		if (item != null) {
			graph.removeItem(item);
		}
	}

	useEffect(() => {
		if (graph?.getEvents()["canvas:click"]?.filter((e) => e.callback.name === "deleteItem").length === 0) {
			graph.on("edge:click", deleteItem);
			graph.on("node:click", deleteItem);
		}

		return () => {
			graph.off("edge:click", deleteItem);
			graph.off("node:click", deleteItem);
		};
	}, [graph]);

	return <></>;
}
