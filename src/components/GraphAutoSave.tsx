import React, { useContext, useEffect, useState } from "react";
import { EdgeConfig, GraphData, GraphinContext, NodeConfig, Utils } from "@antv/graphin";
import { deepEqual } from "../utils/deep-equal";
import { useDebounce } from "react-use";
import { useGraphBuilderStore } from "../stores/graph-builder-store";
import { LinkTS } from "../algorithms/adapter";

interface IGraphAutoSave {
	onSave: (graph: GraphData) => void;
	debounceTime: number;
	presentState?: GraphData;
	customCompare?: (a: GraphData, b: GraphData) => boolean;
}

const eventNames = ["afteradditem", "afterupdateitem", "afterremoveitem"];

/**
 * This component listens to the graph events and saves the graph data to the given callback function.
 * @param onSave Callback function that is called when the graph data should be saved
 * @param debounceTime Debounce time in ms
 * @param presentState The current state of the graph for comparison as a workaround for the undo / redo logic
 * @param customCompare Custom comparison function for the graph data
 * @constructor
 */
function GraphAutoSave({ onSave, debounceTime, presentState, customCompare }: IGraphAutoSave): React.JSX.Element {
	const { graph } = useContext(GraphinContext);
	const [graphData, setGraphData] = useState<GraphData | null>(null);
	const { manualSaveRequested, hasUncompletedEdge, setManualSaveFlag } = useGraphBuilderStore();

	// Debounce the save function
	useDebounce(
		() => {
			if (graphData !== null) {
				// Process parallel edges
				Utils.processEdges(graphData?.edges as LinkTS[]);

				if (
					!hasUncompletedEdge &&
					(manualSaveRequested ||
						presentState === undefined ||
						(!deepEqualGraph(presentState, graphData) &&
							(customCompare === undefined || !customCompare?.(presentState, graphData))))
				) {
					onSave(graphData);

					if (manualSaveRequested) {
						setManualSaveFlag(false);
					}
				}
			}
		},
		debounceTime,
		[graphData]
	);

	useEffect(() => {
		if (manualSaveRequested) {
			setGraphData(graph?.save());
		}
	}, [manualSaveRequested]);

	function updateGraph(): void {
		if (graph !== null) {
			setGraphData(graph.save());
		}
	}

	useEffect(() => {
		if (graph !== null) {
			for (const eventName of eventNames) {
				if (
					graph?.getEvents()[eventName]?.filter((e) => e.callback.name === "updateGraph").length === 0 ||
					graph?.getEvents()[eventName] === undefined
				) {
					graph.on(eventName, updateGraph);
				}
			}
		}

		return () => {
			for (const eventName of eventNames) {
				graph.off(eventName, updateGraph);
			}
		};
	}, [graph]);

	return <></>;
}

/**
 * This function is a workaround because some properties of the edges are randomly changed by graphin
 * which interferes with deepEqual function of the useHistoryState hook for undo / redo logic handling.
 * With this function I only extract the properties that are relevant for the comparison.
 * @param a
 * @param b
 */
function deepEqualGraph(a: GraphData, b: GraphData): boolean {
	if (a.nodes?.length !== b.nodes?.length || a.edges?.length !== b.edges?.length) {
		return false;
	}

	// Construct edge objects that should be compared
	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	const compEdgeObjectConstructor = (edge: EdgeConfig) => ({
		source: edge.source,
		target: edge.target,
		id: edge.id,
		style: edge.style,
		label: edge.label,
		type: edge.type,
	});

	const aEdges = { edges: a.edges?.map((edge) => compEdgeObjectConstructor(edge)) };
	const bEdges = { edges: b.edges?.map((edge) => compEdgeObjectConstructor(edge)) };

	// Check if all edges are equal
	if (!deepEqual(aEdges, bEdges)) {
		return false;
	}

	// Construct node objects that should be compared
	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	const compNodeObjectConstructor = (node: NodeConfig) => ({
		id: node.id,
		x: node.x,
		y: node.y,
		label: node.label,
		style: node.style,
		type: node.type,
	});

	const aNodes = { nodes: a.nodes?.map((node) => compNodeObjectConstructor(node)) };
	const bNodes = { nodes: b.nodes?.map((node) => compNodeObjectConstructor(node)) };

	// Check if all nodes are equal
	return deepEqual(aNodes, bNodes);
}

export default GraphAutoSave;
