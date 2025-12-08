import React from "react";
import { useGraphBuilderStore } from "../stores/graph-builder-store";
import { GraphInfoItem } from "./GraphInfoItem";

export function GraphInfo(): React.JSX.Element {
	const { hasNegativeEdge, hasSelfLoop, hasDirectedEdge, hasUndirectedEdge, isConnected, isComplete } =
		useGraphBuilderStore();

	return (
		<>
			<ul>
				<GraphInfoItem
					property="no negative edges"
					isFulfilled={!hasNegativeEdge}
				/>
				<GraphInfoItem
					property="connected"
					isFulfilled={isConnected}
				/>
				<GraphInfoItem
					property="complete"
					isFulfilled={isComplete}
				/>
				<GraphInfoItem
					property="no self loops"
					isFulfilled={!hasSelfLoop}
				/>
				<GraphInfoItem
					property="undirected edges"
					isFulfilled={hasUndirectedEdge}
				/>
				<GraphInfoItem
					property="directed edges"
					isFulfilled={hasDirectedEdge}
				/>
			</ul>
		</>
	);
}
