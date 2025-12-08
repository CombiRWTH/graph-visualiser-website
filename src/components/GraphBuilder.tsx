/* eslint-disable tailwindcss/classnames-order */
import React, { useEffect, useRef, useState } from "react";
import Graphin, { Behaviors, GraphData, GraphinData } from "@antv/graphin";
import Graph from "./Graph";
import { GraphNodeInsert } from "./GraphNodeInsert";
import { GraphNodeContextMenu } from "./GraphNodeContextMenu";
import GraphBuilderTopToolbar from "./GraphBuilderTopToolbar";
import { useGraphBuilderStore } from "../stores/graph-builder-store";
import GraphBuilderSideToolbar from "./GraphBuilderSideToolbar";
import GraphExtractGraphObject from "./GraphExtractGraphObject";
import GraphAutoSave from "./GraphAutoSave";
import { useHistoryState } from "../hooks/useHistoryState";
import { GraphEraser } from "./GraphEraser";
import { GraphCreateEdge } from "./GraphCreateEdge";
import { GraphEdgeContextMenu } from "./GraphEdgeContextMenu";
import { useFullscreen, useToggle } from "react-use";
import { IAlgorithmInformation } from "../utils/available-algorithms";
import { GraphProperties } from "./GraphProperties";
import { IGraphStorage } from "../types/graph";
import { createGraphForStorage, saveGraphToStorage } from "../utils/graph-local-storage";
import GraphRunBtn from "./GraphRunBtn";
import GraphNameInput from "./GraphNameInput";
import { Spinner } from "./Spinner";
import { GraphInfo } from "./GraphInfo";
import { Info } from "lucide-react";
import { setNodeSize } from "./GraphCustomNode";
import _ from "lodash";

interface IGraphBuilderProps {
	algorithm?: IAlgorithmInformation;
	givenGraph?: IGraphStorage;
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function GraphBuilder({ algorithm, givenGraph }: IGraphBuilderProps): React.JSX.Element {
	// Prepare graph storage
	const storageGraph = useRef<IGraphStorage>(givenGraph ?? createGraphForStorage(algorithm?.name));

	// History state - track changes with undo and redo
	const {
		canUndo,
		canRedo,
		state: graph,
		set: setGraphData,
		redo,
		undo,
	} = useHistoryState({ ...storageGraph.current?.graph });

	// Graph builder store
	const {
		activateClickSelect,
		activateAddNode,
		activateAddUndirectedEdge,
		activateAddDirectedEdge,
		activateEraser,
		activateCanvasMove,
		activateCanvasLassoSelect,
		activateCanvasAreaSelect,
		nodeColor,
		nodeSize,
		edgeColor,
		edgeWidth,
		setGraph,
		setAllowUndirectedEdges,
		setAllowDirectedEdges,
		setAllowNegativeWeights,
		setAllowSelfEdge,
		setAllowDisconnectivity,
		setManualSaveFlag,
	} = useGraphBuilderStore();

	// Refs
	const containerRef = useRef<HTMLDivElement>(null);
	const graphRef = useRef<Graphin>(null);

	// Fullscreen logic
	const [fullscreen, toggle] = useToggle(false);
	useFullscreen(containerRef, fullscreen, { onClose: () => toggle() });

	// Layout
	const [layout] = useState({ type: "", options: {} });
	const { type, options } = layout;

	// Apply nodeColor to all selected nodes
	function applyNodeStyle(color?: string, size?: number): void {
		const graph = graphRef.current?.graph;
		setManualSaveFlag(true);
		if (graph != null) {
			const nodes = graph.findAllByState("node", "selected");
			nodes?.forEach((node) => {
				if (color !== undefined) {
					graph?.updateItem(node._cfg?.id as string, {
						style: { keyshape: { fill: color, stroke: color } },
					});
				}
				if (size !== undefined) {
					graph?.updateItem(node._cfg?.id as string, {
						style: setNodeSize(size, node._cfg?.currentShape),
					});
				}
				// @ts-expect-error getEdges is only available for items of type node. We only iterate through nodes.
				if (node.getEdges() !== undefined) {
					// @ts-expect-error getEdges is only available for items of type node. We only iterate through nodes.
					node.getEdges().forEach((edge: IUserEdge) => edge.refresh());
				}
			});
			setManualSaveFlag(true);
		}
	}

	// Apply edge style to all selected edges
	function applyEdgeStyle(color?: string, width?: number): void {
		const graph = graphRef.current?.graph;
		if (graph != null) {
			const edges = graph.findAllByState("edge", "selected");
			edges?.forEach((edge) => {
				const model = edge.getModel();
				const keyshape = { ...(model.style?.keyshape ?? {}) };

				if (color !== undefined) {
					keyshape.stroke = color;

					// Explicitly apply color to arrowhead, if it exists
					if (keyshape.endArrow !== undefined) {
						keyshape.endArrow = {
							...keyshape.endArrow,
							stroke: color,
							fill: color,
						};
					}
				}

				if (width !== undefined) {
					keyshape.lineWidth = width;
				}

				const styleUpdate = {
					style: {
						keyshape,
					},
				};

				// Apply differently if it's a loop edge
				if (edge._cfg?.currentShape === "loop") {
					edge.update({
						style: keyshape,
					});
				} else {
					edge.update(styleUpdate);
				}
			});

			setManualSaveFlag(true);
		}
	}

	// Set node labels for all selected nodes
	function setNodeLabels(label: "number" | "letter" | "none"): void {
		const graph = graphRef.current?.graph;
		if (graph != null) {
			const nodes = graph.findAllByState("node", "selected");
			const base = 26; // Letters in alphabet
			nodes?.forEach((node, id) => {
				let updatedLabel = {};
				if (label === "number") {
					updatedLabel = {
						style: {
							label: {
								value: id,
								visible: true,
							},
						},
					};
				} else if (label === "letter") {
					let index = id;
					let label = "";
					while (index >= 0) {
						label = String.fromCharCode((index % base) + 65) + label;
						index = Math.floor(index / base) - 1;
					}
					updatedLabel = {
						style: {
							label: {
								value: label,
								visible: true,
							},
						},
					};
				} else if (label === "none") {
					updatedLabel = {
						style: {
							label: {
								visible: false,
							},
						},
					};
				}
				graph?.updateItem(node._cfg?.id as string, updatedLabel);
			});
		}
		setManualSaveFlag(true);
	}

	// Set default edge style of underlying G6 Graph instance
	// Ensures correct edge style of unfinished edges
	useEffect(() => {
		const defaultEdge = graphRef?.current?.graph.get("defaultEdge");
		if (defaultEdge !== undefined) {
			if (activateAddDirectedEdge) {
				_.merge(defaultEdge, {
					style: {
						keyshape: {
							stroke: edgeColor,
							lineWidth: edgeWidth,
							endArrow: {
								fill: edgeColor,
								stroke: edgeColor,
								path: "M 0,0 L 6,3 L 6,-3 Z",
							},
							startArrow: false,
						},
					},
				});
			} else if (activateAddUndirectedEdge) {
				_.merge(defaultEdge, {
					style: {
						keyshape: {
							stroke: edgeColor,
							lineWidth: edgeWidth,
							endArrow: false,
							startArrow: false,
						},
					},
				});
			}
		}
	}, [activateAddDirectedEdge, activateAddUndirectedEdge, edgeColor, edgeWidth]);

	// Check for algorithm restrictions
	useEffect(() => {
		if (algorithm?.requirements !== undefined) {
			const requirements = algorithm.requirements;
			setAllowDirectedEdges(requirements.noDirectedEdge !== true);
			setAllowUndirectedEdges(requirements.noUndirectedEdge !== true);
			setAllowNegativeWeights(requirements.noNegativeWeights !== true);
			setAllowSelfEdge(requirements.noSelfLoop !== true);
			setAllowDisconnectivity(requirements.connected !== true);
		} else {
			setAllowDirectedEdges(true);
			setAllowUndirectedEdges(true);
			setAllowNegativeWeights(true);
			setAllowSelfEdge(true);
			setAllowDisconnectivity(true);
		}
	}, [algorithm]);

	// This is needed to ensure everything is properly loaded
	// TODO: evaluate
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setTimeout(() => setReady(true), 100);
	}, []);

	const { DragNode, ZoomCanvas, DragCanvas, BrushSelect, LassoSelect, ClickSelect } = Behaviors;
	return ready ? (
		<div className="fixed drawer drawer-end">
			<input
				id="my-drawer-4"
				type="checkbox"
				className="drawer-toggle"
			/>
			<div className="drawer-content flex min-h-screen overflow-y-visible!">
				<div
					className="relative flex flex-col w-full min-w-full grow"
					ref={containerRef}
				>
					<GraphNameInput
						name={storageGraph.current.name}
						onChange={(name) => {
							storageGraph.current.name = name;
							saveGraphToStorage(storageGraph.current);
						}}
					/>
					<GraphBuilderTopToolbar
						canUndo={canUndo}
						canRedo={canRedo}
						undo={() => undo()}
						redo={() => redo()}
						applyNodeStyle={applyNodeStyle}
						applyEdgeStyle={applyEdgeStyle}
						setLabels={setNodeLabels}
					/>
					<GraphBuilderSideToolbar
						fullscreen={fullscreen}
						toggleFullscreen={() => toggle()}
					/>
					<Graph
						innerRef={graphRef}
						graph={graph as GraphinData}
						height={containerRef.current?.clientHeight}
						width={containerRef.current?.clientWidth}
						layout={{ type, options }}
						nodeColor={nodeColor}
						edgeColor={edgeColor}
						backgroundColor="hsla(0, 0%, 100%, 0)"
					>
						<DragNode />
						<ZoomCanvas sensitivity={2} />
						{activateAddNode && (
							<GraphNodeInsert
								nodeColor={nodeColor}
								nodeSize={nodeSize}
							/>
						)}
						<GraphCreateEdge
							activateAddDirectedEdge={activateAddDirectedEdge}
							activateAddUndirectedEdge={activateAddUndirectedEdge}
							edgeColor={edgeColor}
							edgeWidth={edgeWidth}
						/>
						{activateEraser && <GraphEraser />}
						<GraphAutoSave
							presentState={graph as GraphData}
							onSave={(graph) => {
								const newGraph = JSON.parse(JSON.stringify(graph)); // This is needed to convince the hook that there was a change
								setGraphData(newGraph);
								storageGraph.current.graph = newGraph;
								saveGraphToStorage(storageGraph.current);
							}}
							debounceTime={100}
						/>
						<GraphProperties />
						<GraphNodeContextMenu
							selectorEnabled={
								activateCanvasAreaSelect || activateCanvasLassoSelect || activateClickSelect
							}
						/>
						<GraphEdgeContextMenu
							selecterEnabled={
								activateCanvasAreaSelect || activateCanvasLassoSelect || activateClickSelect
							}
						/>
						{/* Canvas Interaction */}
						<BrushSelect disabled /> {/* deactivates selection at the beginning */}
						{activateCanvasMove && <DragCanvas />}
						{activateCanvasLassoSelect && <LassoSelect trigger="drag" />}
						{activateCanvasAreaSelect && (
							<BrushSelect
								disabled={!activateCanvasAreaSelect}
								trigger="drag"
							/>
						)}
						<GraphExtractGraphObject callback={setGraph} />
						{activateClickSelect && (
							<ClickSelect
								selectEdge={true}
								selectNode={true}
								multiple={true}
							/>
						)}
					</Graph>
					<GraphRunBtn
						algorithm={algorithm}
						graph={storageGraph.current}
					/>
				</div>
				<div className="absolute flex right-2 top-2">
					<div className="dropdown dropdown-hover dropdown-left">
						<div
							tabIndex={0}
							role="button"
							className="m-1 btn"
						>
							<Info />
						</div>
						<div
							tabIndex={0}
							className="w-64 shadow-md menu dropdown-content card card-lg bg-base-100"
						>
							<div className="card-title">Graph Information</div>
							<div className="card-body">
								<GraphInfo />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	) : (
		<Spinner />
	);
}
