import React, { useContext, useEffect } from "react";
import { GraphinContext, IG6GraphEvent } from "@antv/graphin";

interface IGraphEventListeners {
	// Edge events
	onEdgeClick?: (edge: IG6GraphEvent) => void;
	onEdgeDblClick?: (edge: IG6GraphEvent) => void;
	onEdgeMouseEnter?: (edge: IG6GraphEvent) => void;
	onEdgeMouseLeave?: (edge: IG6GraphEvent) => void;
	onEdgeMouseOver?: (edge: IG6GraphEvent) => void;
	onEdgeMouseOut?: (edge: IG6GraphEvent) => void;
	onEdgeTouchStart?: (edge: IG6GraphEvent) => void;
	onEdgeTouchEnd?: (edge: IG6GraphEvent) => void;

	// Node events
	onNodeClick?: (node: IG6GraphEvent) => void;
	onNodeDblClick?: (node: IG6GraphEvent) => void;
	onNodeMouseEnter?: (node: IG6GraphEvent) => void;
	onNodeMouseLeave?: (node: IG6GraphEvent) => void;
	onNodeMouseOver?: (node: IG6GraphEvent) => void;
	onNodeMouseOut?: (node: IG6GraphEvent) => void;
	onNodeTouchStart?: (node: IG6GraphEvent) => void;
	onNodeTouchEnd?: (node: IG6GraphEvent) => void;
}

export function GraphEventListeners({
	onEdgeMouseEnter,
	onEdgeMouseLeave,
	onEdgeDblClick,
	onEdgeClick,
	onEdgeMouseOver,
	onEdgeTouchStart,
	onEdgeTouchEnd,

	onNodeClick,
	onNodeDblClick,
	onNodeMouseEnter,
	onNodeMouseLeave,
	onNodeMouseOver,
	onNodeTouchStart,
	onNodeTouchEnd,
	onNodeMouseOut,
}: IGraphEventListeners): React.JSX.Element {
	const { graph } = useContext(GraphinContext);

	const eventListeners = new Map<string, ((event: IG6GraphEvent) => void) | undefined>();

	eventListeners.set("edge:click", onEdgeClick);
	eventListeners.set("edge:dblclick", onEdgeDblClick);
	eventListeners.set("edge:mouseenter", onEdgeMouseEnter);
	eventListeners.set("edge:mouseleave", onEdgeMouseLeave);
	eventListeners.set("edge:mouseover", onEdgeMouseOver);
	eventListeners.set("edge:touchstart", onEdgeTouchStart);
	eventListeners.set("edge:touchend", onEdgeTouchEnd);

	// Node events
	eventListeners.set("node:click", onNodeClick);
	eventListeners.set("node:dblclick", onNodeDblClick);
	eventListeners.set("node:mouseenter", onNodeMouseEnter);
	eventListeners.set("node:mouseleave", onNodeMouseLeave);
	eventListeners.set("node:mouseover", onNodeMouseOver);
	eventListeners.set("node:mouseout", onNodeMouseOut);
	eventListeners.set("node:touchstart", onNodeTouchStart);
	eventListeners.set("node:touchend", onNodeTouchEnd);

	useEffect(() => {
		eventListeners.forEach((listener, eventName) => {
			if (listener !== undefined) {
				if (graph?.getEvents()[eventName]?.filter((e) => e.callback.name === listener.name).length === 0) {
					graph.on(eventName, listener);
				}
			}
		});

		return () => {
			eventListeners.forEach((listener, eventName) => {
				if (listener !== undefined) graph.off(eventName, listener);
			});
		};
	}, [
		graph,
		onEdgeClick,
		onEdgeDblClick,
		onEdgeMouseEnter,
		onEdgeMouseLeave,
		onEdgeMouseOver,
		onEdgeTouchStart,
		onEdgeTouchEnd,
		onNodeClick,
		onNodeDblClick,
		onNodeMouseEnter,
		onNodeMouseLeave,
		onNodeMouseOver,
		onNodeTouchStart,
		onNodeTouchEnd,
		onNodeMouseOut,
	]);

	return <></>;
}
