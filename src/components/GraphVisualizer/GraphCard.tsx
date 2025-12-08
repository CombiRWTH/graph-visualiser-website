import React, { useEffect, useRef, useState } from "react";
import { Visualiser } from "./Visualiser";
import { IAlgorithmInformation } from "../../utils/available-algorithms";
import { IAlgorithmStore, LayoutAlgorithm } from "../../algorithms/algorithm-interfaces";
import { Spinner } from "../Spinner";
import { InfoTooltip } from "../InfoTooltip";
import { Helptext } from "./Helptext";
import { saveJSON, saveTex } from "../../utils/files";
import { Download, Info, Repeat } from "lucide-react";
import Graphin, { GraphinData, IUserNode } from "@antv/graphin";
import { GraphTS } from "../../utils/graphs";
import { LinkTS, NodeTS } from "../../algorithms/adapter";
import { useLocation } from "react-router-dom";
import { GraphEventListeners } from "../GraphEventListeners";
import { Tooltip } from "./Tooltip";
import debounce from "lodash.debounce";

interface SaveGraphLayoutOptions {
	graphRef: React.RefObject<Graphin>;
	originalGraph: GraphTS<NodeTS, LinkTS>;
	setNewGraph: (graph: GraphTS<NodeTS, LinkTS>, options?: { graphinGraph?: GraphinData }) => void;
}

/**
 * Updates the layout positions of nodes in the original graph based on the current state
 * of the interactive (G6) graph, then updates the state with both the updated layout and
 * the original graph data.
 *
 * This is used after a user drags or repositions nodes in the UI, ensuring that
 * these position changes are persisted for the next steps.
 */

export function saveGraphLayoutChanges({ graphRef, originalGraph, setNewGraph }: SaveGraphLayoutOptions): void {
	const g6Graph = graphRef.current?.graph;
	if (g6Graph == null) return;
	// Get updated positions from live graph
	const updatedNodes: IUserNode[] = g6Graph.getNodes().map((node) => {
		const model = node.getModel();

		const newNode: IUserNode = {
			id: model.id ?? "error",
			x: model.x,
			y: model.y,
		};
		return newNode;
	});

	// Merge updated positions into originalGraph
	const newGraphinGraph: GraphinData = {
		nodes: originalGraph.nodes.map((node) => {
			const updated = updatedNodes.find((n) => n.id === node.id);
			return updated != null ? { ...node, x: updated.x, y: updated.y } : node;
		}),
		edges: [...originalGraph.edges],
	};

	// This resets the algorithm run, but that is okay
	setNewGraph(originalGraph, { graphinGraph: newGraphinGraph });
}

export interface IGraphCardProps {
	algorithm: IAlgorithmInformation;
	showHints: boolean;
	showInfo: boolean;
	showFeatureExplain: boolean;
	className?: string;
	showColorPicker: boolean;
	graphState?: GraphTS<NodeTS, LinkTS>;
	onNodeClick?: (nodeId: string) => void;
	classNameDownloadGraph?: string;
}

export const GraphCard: React.FC<IGraphCardProps> = ({
	className,
	algorithm,
	showHints,
	showInfo,
	showFeatureExplain,
	graphState,
	onNodeClick,
	classNameDownloadGraph,
}: IGraphCardProps) => {
	const {
		visState,
		isInitialized,
		layoutAlgorithm,
		setLayoutAlgorithm,
		setNewGraph,
		resetGraph,
		switchBetweenGraphs,
		resGraphActive,
	}: IAlgorithmStore = algorithm.useAlgorithmStore((state) => ({
		...state,
		visState: state.getVisState(),
	}));

	useEffect(() => {
		return () => {
			// This runs when the component unmounts
			resetGraph();
		};
	}, []);

	// This is an ugly hack and needed because the badges for the dijkstra distances otherwise
	// don't dissappear.
	// Used to force rerender the graph if it changes while we are not in the algorithm execution
	// TODO: find a better solution to render the cleared lables
	// Force rerender when in "Dijkstra Algorithm" the run is reset to the first line
	const [shouldRerender, setShouldRerender] = useState(false);
	// create graph Ref to access visualisation of graph
	const graphRef = useRef<Graphin>(null);
	const url = useLocation();
	useEffect(() => {
		setShouldRerender(
			visState?.lineOfCode === 0 && url.pathname.includes("dijkstra/algorithm") ? !shouldRerender : shouldRerender
		);
	}, [visState?.lineOfCode, visState?.startNode]);

	useEffect(() => {
		/**
		 * Try initializing node:dragend listener after a brief delay.
		 * This handles cases where the graph isn't ready on first render.
		 */
		const timeoutId = window.setTimeout(() => {
			const graph = graphRef.current?.graph;

			if (graph != null) {
				const debouncedSaveLayout = debounce(() => {
					if (visState?.graph !== undefined) {
						saveGraphLayoutChanges({ graphRef, originalGraph: visState.graph, setNewGraph });
					} else if (graphState !== undefined) {
						saveGraphLayoutChanges({ graphRef, originalGraph: graphState, setNewGraph });
					}
				}, 300);

				graph.on("node:dragend", () => {
					setLayoutAlgorithm(LayoutAlgorithm.Free);
					debouncedSaveLayout();
				});
			}
		}, 0);

		return () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}
			const graph = graphRef.current?.graph;
			if (graph !== undefined) {
				graph.off("node:dragend");
			}
		};
	}, [graphRef.current?.graph, layoutAlgorithm]);

	return (
		<div className={`size-full ${className ?? ""} flex min-h-64 grow`}>
			{isInitialized && visState !== null ? (
				<>
					<Visualiser
						data={graphState ?? visState.graph}
						layoutAlgorithm={layoutAlgorithm}
						shouldRerender={shouldRerender}
						graphRef={graphRef}
					>
						<GraphEventListeners onNodeClick={(event) => onNodeClick?.(event.item?._cfg?.id ?? "")} />
					</Visualiser>
					<div className="absolute left-2 top-2 flex flex-col gap-3">
						{algorithm.hasStartNode && showFeatureExplain && (
							<Tooltip
								helptext="Select a start node by clicking on it."
								Trigger={<Info />}
								defaultOpen={true}
							/>
						)}
					</div>
					<div className="absolute left-2 top-2 flex flex-col gap-3">
						{(algorithm.name === "Ford-Fulkerson" ||
							algorithm.name === "Edmonds-Karp" ||
							algorithm.name === "Dinic") &&
							url.pathname.includes("algorithm") && (
								<button
									className="btn"
									onClick={() => switchBetweenGraphs?.()}
								>
									<Repeat />{" "}
									{resGraphActive === true
										? "Switch to original graph"
										: algorithm.name === "Dinic"
											? "Switch to level graph"
											: "Switch to residual graph"}
								</button>
							)}
					</div>
					<div className="absolute bottom-2 left-2 flex flex-col gap-3">
						{showInfo && (
							<InfoTooltip
								title={`About ${algorithm.name.charAt(0).toUpperCase() + algorithm.name.slice(1)}'s Algorithm`}
							>
								<p>{algorithm.description}</p>
							</InfoTooltip>
						)}
						<div className={`dropdown dropdown-top ${classNameDownloadGraph ?? ""}`}>
							<div
								tabIndex={0}
								role="button"
								className="btn btn-square btn-ghost"
							>
								<Download />
							</div>
							<ul
								tabIndex={0}
								className="z-1 menu dropdown-content w-52 rounded-box bg-base-100 p-2 shadow-sm"
							>
								<li
									onClick={() => {
										const currentGraph: GraphTS<NodeTS, LinkTS> = graphState ?? visState.graph;
										const graphinData = graphRef.current?.data as GraphinData;
										if (graphinData !== undefined) {
											currentGraph.nodes = graphinData.nodes;
										}
										// imported graphs are expected to have integer coordinates
										const roundedEdges: LinkTS[] = currentGraph.edges.map((edge) => ({
											...edge,
											x: Number.parseInt(edge.x),
											y: Number.parseInt(edge.y),
										}));
										currentGraph.edges = roundedEdges;
										return saveJSON("graph-json.json", currentGraph);
									}}
								>
									<a>Download JSON</a>
								</li>
								<li
									onClick={() => {
										const currentGraph: GraphTS<NodeTS, LinkTS> = graphState ?? visState.graph;
										const graphinData = graphRef.current?.data as GraphinData;
										if (graphinData !== undefined) {
											currentGraph.nodes = graphinData.nodes;
										}
										const roundedEdges: LinkTS[] = currentGraph.edges.map((edge) => ({
											...edge,
											x: Number.parseInt(edge.x),
											y: Number.parseInt(edge.y),
										}));
										currentGraph.edges = roundedEdges;
										return saveTex("graph-latex.tex", currentGraph, algorithm.name);
									}}
								>
									<a>Download LaTex</a>
								</li>
								<li
									onClick={() => {
										const graph = graphRef.current!.graph;
										const dataUrl = graph.toDataURL("image/png");

										// You can use this in an <img> or download it
										const a = document.createElement("a");
										a.href = dataUrl;
										a.download = "graph-thumbnail.png";
										a.click();
									}}
								>
									<a>Download PNG</a>
								</li>
							</ul>
						</div>
					</div>
					<div
						className="tooltip"
						data-tip="Download Graph"
					></div>
					{showHints && (
						<div className="absolute bottom-2 right-2">
							<Helptext helptext={visState.helptext} />
						</div>
					)}
				</>
			) : (
				<Spinner />
			)}
		</div>
	);
};
