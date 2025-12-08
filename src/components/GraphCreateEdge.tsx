import React, { useContext, useEffect } from "react";
import { CreateEdge } from "@antv/graphin-components";
import { GraphinContext, IUserEdge } from "@antv/graphin";
import { useGraphBuilderStore } from "../stores/graph-builder-store";

export function GraphCreateEdge({
	activateAddDirectedEdge,
	activateAddUndirectedEdge,
	edgeColor,
	edgeWidth,
}: {
	activateAddDirectedEdge: boolean;
	activateAddUndirectedEdge: boolean;
	edgeColor: string;
	edgeWidth: number;
}): React.JSX.Element {
	const { graph } = useContext(GraphinContext);
	const edges = graph.getEdges();
	const { allowSelfEdge, graphInfoTrigger, hasUncompletedEdge, setGraphInfoTrigger, setHasUncompletedEdge } =
		useGraphBuilderStore();

	function firstEdgeNode(event: { x: number; y: number }): void {
		if (activateAddDirectedEdge || activateAddUndirectedEdge) {
			graph.off("node:click", firstEdgeNode);
			setHasUncompletedEdge(true);

			// Prevent a self loop to be shown before the mouse is moved during edge creation
			const { x, y } = event;
			// @ts-expect-error setTarget expects a INode or ICombo, but a position is passed instead. This is how Graphin does this during edge creation.
			graph.getEdges().at(-1)?.setTarget({ x, y });
			graph.getEdges().at(-1)?.refresh();
		}
	}

	function secondEdgeNode(): void {
		graph.off("node:click", secondEdgeNode);

		if (!allowSelfEdge) {
			edges.forEach((edge) => {
				if (edge?._cfg?.currentShape === "loop") {
					graph.removeItem(edge);
				}
			});
		}
		setGraphInfoTrigger(!graphInfoTrigger);
		setHasUncompletedEdge(false);
	}

	function preventBrokenEdge(): void {
		graph.off("canvas:mouseleave", preventBrokenEdge);
		if (typeof edges.at(-1)?.getTarget().getType !== "function") {
			const id = edges.at(-1)?.getID();
			if (id !== undefined) graph.remove(id);
			setHasUncompletedEdge(false);
		}
	}

	// Fixes a bug where the preview of an edge would stay as a loop
	// the type and loop properties are not removed correctly by Graphin when the node already has a self loop
	function preventLoopPreview(): void {
		if (hasUncompletedEdge) {
			const edge = graph.getEdges().at(-1);
			if (edge?._cfg?.model?.style?.keyshape?.loop !== undefined) {
				const { type: _type, loop: _loop, ...keyshape } = edge._cfg.model.style.keyshape;
				edge.update({
					style: {
						keyshape: {
							...keyshape,
						},
					},
				});
			}
		}
	}

	function resetHasUncompletedEdge(): void {
		setHasUncompletedEdge(false);
	}

	useEffect(() => {
		function onCreateEdge(event: { edge: IUserEdge }): void {
			if (activateAddDirectedEdge) {
				event.edge.set("directed", true);
			} else if (activateAddUndirectedEdge) {
				event.edge.set("directed", false);
			}

			// Edge styling are defined differently for loops and straight edges.
			// The styling of the dragged (straight) edge is applied to the loop.
			if (event.edge._cfg?.currentShape === "loop") {
				const curStyle = event.edge.getModel().style.keyshape ?? {};

				event.edge.update({
					style: curStyle,
				});
			}
		}

		graph.on("aftercreateedge", onCreateEdge);

		return () => {
			graph.off("aftercreateedge", onCreateEdge);
		};
	}, [edgeColor, edgeWidth, activateAddDirectedEdge, activateAddUndirectedEdge]);

	// Set event listeners for the graph to track if there is an uncompleted edge
	// Start node clicked -> callback sets hasUncompletedEdge to true
	// End node clicked or cursor leaving canvas -> callbacks set hasUncompletedEdge to false
	useEffect(() => {
		if (activateAddDirectedEdge || activateAddUndirectedEdge) {
			if (hasUncompletedEdge) {
				if (
					graph.getEvents()["canvas:mouseleave"] === undefined ||
					graph.getEvents()["canvas:mouseleave"]?.filter((e) => e.callback.name === "preventBrokenEdge")
						.length === 0
				) {
					graph.on("canvas:mouseleave", preventBrokenEdge);
				}
				if (
					graph.getEvents().mousemove === undefined ||
					graph.getEvents().mousemove?.filter((e) => e.callback.name === "preventLoopPreview").length === 0
				) {
					graph.on("mousemove", preventLoopPreview);
				}
				if (
					graph.getEvents()["node:click"] === undefined ||
					graph.getEvents()["node:click"]?.filter((e) => e.callback.name === "secondEdgeNode").length === 0
				) {
					graph.on("node:click", secondEdgeNode);
				}
				// Reset hasUncompletedEdge when edge creation is aborted by clicking somewhere on the canvas
				if (
					graph.getEvents()["edge:click"] === undefined ||
					graph.getEvents()["edge:click"]?.filter((e) => e.callback.name === "resetHasUncompletedEdge")
						.length === 0
				) {
					graph.on("edge:click", resetHasUncompletedEdge);
				}
			} else {
				if (
					graph.getEvents()["node:click"] === undefined ||
					graph.getEvents()["node:click"]?.filter((e) => e.callback.name === "firstEdgeNode").length === 0
				) {
					graph.on("node:click", firstEdgeNode);
				}
			}
		}
		return () => {
			// Remove the event listeners before re-render or unmount of the component
			// Ensures only the correct event listeners are active
			graph.off("node:click", firstEdgeNode);
			graph.off("node:click", secondEdgeNode);
			graph.off("canvas:mouseleave", preventBrokenEdge);
			graph.off("mousemove", preventLoopPreview);
			graph.off("edge:click", resetHasUncompletedEdge);
		};
	}, [hasUncompletedEdge, activateAddDirectedEdge, activateAddUndirectedEdge]);

	return (
		<CreateEdge
			active={activateAddDirectedEdge || activateAddUndirectedEdge}
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			onClick={() => {}}
		/>
	);
}

export function isDirectedEdge(edge: IUserEdge): boolean {
	return edge.model?.style?.keyshape?.endArrow !== false;
}
