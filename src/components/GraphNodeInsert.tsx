import React, { useContext, useEffect, useRef } from "react";
import { GraphinContext, IG6GraphEvent } from "@antv/graphin";
import { useGraphBuilderStore } from "../stores/graph-builder-store";
import { getSmallestUniqueId } from "../utils/get-unique-id";

export function GraphNodeInsert({ nodeColor, nodeSize }: { nodeColor: string; nodeSize: number }): React.JSX.Element {
	const { graph } = useContext(GraphinContext);
	const contextMenuRef = useRef<boolean>();
	const { isContextMenuOpen } = useGraphBuilderStore();
	contextMenuRef.current = isContextMenuOpen;

	function addNode(e: IG6GraphEvent): void {
		if (contextMenuRef?.current ?? false) {
			return;
		}
		const id = String(getSmallestUniqueId(graph.getNodes().map((f) => Number(f.getModel().id))));
		graph.addItem("node", {
			id,
			x: e.x,
			y: e.y,
			type: "graphin-circle",
			style: {
				keyshape: {
					stroke: nodeColor,
					fill: nodeColor,
					size: nodeSize,
				},
			},
		});
	}

	useEffect(() => {
		if (graph?.getEvents()["canvas:click"]?.filter((e) => e.callback.name === "addNode").length === 0) {
			graph.on("canvas:click", addNode);
			// For mobile usage add touchevents
			// graph.on("canvas:touchstart", addNode);
		}

		return () => {
			graph.off("canvas:click", addNode);
			// For mobile usage add touchevents
			// graph.off("canvas:touchstart", addNode);
		};
	}, [graph, nodeColor, nodeSize]);

	return <></>;
}
