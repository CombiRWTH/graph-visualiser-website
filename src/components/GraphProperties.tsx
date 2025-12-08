import React, { useContext, useEffect } from "react";
import { G6, GraphinContext, IUserEdge } from "@antv/graphin";
import { GraphData } from "@antv/algorithm/lib/types";
import { useGraphBuilderStore } from "../stores/graph-builder-store";
import { isDirectedEdge } from "./GraphCreateEdge";
import { GraphTS, isConnected as calcConnected, isComplete as calcComplete } from "../utils/graphs";
import { LinkTS, NodeTS } from "../algorithms/adapter";
import { IAlgorithmRequirements } from "../utils/available-algorithms";
export function GraphProperties(): React.JSX.Element {
	const { graph } = useContext(GraphinContext);
	const edges = graph.getEdges();
	const nodes = graph.getNodes();
	const {
		setIsConnected,
		setIsComplete,
		setHasDirectedEdge,
		setHasUndirectedEdge,
		setHasNegativeEdge,
		setHasSelfLoop,
		allowUndirectedEdges,
		graphInfoTrigger,
	} = useGraphBuilderStore();

	useEffect(() => {
		const connectedComponents = G6.Algorithm.connectedComponent(graph.save() as GraphData, !allowUndirectedEdges);
		setIsConnected(connectedComponents.length === 1);
		setIsComplete(calcComplete(graph.save() as GraphTS<NodeTS, LinkTS>));

		let directedEdge = false;
		let undirectedEdge = false;
		let negativeEdgeValue = false;
		let selfLoop = false;

		edges.forEach((edge) => {
			if (!directedEdge && isDirectedEdge(edge._cfg as IUserEdge)) {
				directedEdge = true;
			}

			if (!undirectedEdge && !isDirectedEdge(edge._cfg as IUserEdge)) {
				undirectedEdge = true;
			}

			if (
				!negativeEdgeValue &&
				edge._cfg?.model?.style?.label?.value !== undefined &&
				edge._cfg?.model?.style?.label?.value < 0
			) {
				negativeEdgeValue = true;
			}

			if (!selfLoop && edge._cfg?.currentShape === "loop") {
				selfLoop = true;
			}
		});

		setHasDirectedEdge(directedEdge);
		setHasUndirectedEdge(undirectedEdge);
		setHasNegativeEdge(negativeEdgeValue);
		setHasSelfLoop(selfLoop);
	}, [edges, nodes, graphInfoTrigger]);

	return <></>;
}

// call this function somewhere to get the properties
export function GetGraphProperties(graph: GraphTS<NodeTS, LinkTS>): IAlgorithmRequirements {
	const edges = graph.edges;
	const nodes = graph.nodes;
	const {
		setIsConnected,
		setIsComplete,
		setHasDirectedEdge,
		setHasUndirectedEdge,
		setHasNegativeEdge,
		setHasSelfLoop,
		graphInfoTrigger,
		hasNegativeEdge,
		hasSelfLoop,
		hasUndirectedEdge,
		hasDirectedEdge,
		isConnected,
		isComplete,
	} = useGraphBuilderStore();

	useEffect(() => {
		if (graph.nodes.length > 0) {
			const connected = calcConnected(graph);
			setIsConnected(connected);
			const complete = calcComplete(graph);
			setIsComplete(complete);
			let directedEdge = false;
			let undirectedEdge = false;
			let negativeEdgeValue = false;
			let selfLoop = false;

			edges.forEach((edge) => {
				if (!directedEdge && edge.style?.keyshape?.endArrow?.path !== "none") {
					directedEdge = true;
				}
				if (!undirectedEdge && edge.style?.keyshape?.endArrow?.path === "none") {
					undirectedEdge = true;
				}
				if (!negativeEdgeValue && edge.weight < 0) {
					negativeEdgeValue = true;
				}
				if (!selfLoop && edge.source === edge.target) {
					selfLoop = true;
				}
			});

			setHasDirectedEdge(directedEdge);
			setHasUndirectedEdge(undirectedEdge);
			setHasNegativeEdge(negativeEdgeValue);
			setHasSelfLoop(selfLoop);
		}
	}, [edges, nodes, graphInfoTrigger]);

	return {
		noDirectedEdge: !hasDirectedEdge,
		noUndirectedEdge: !hasUndirectedEdge,
		noSelfLoop: !hasSelfLoop,
		noNegativeWeights: !hasNegativeEdge,
		connected: isConnected,
		complete: isComplete,
	};
}
