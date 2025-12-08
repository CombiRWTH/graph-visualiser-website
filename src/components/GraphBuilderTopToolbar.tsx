import React from "react";
import { Toolbar, ToolbarGroup, ToolbarItem, ToolbarSeparator } from "./Toolbar";
import {
	Circle,
	CirclePlus,
	Eraser,
	LassoSelect,
	Minus,
	MousePointer2,
	Move,
	MoveUpRight,
	Radius,
	Redo,
	Spline,
	SquareDashedMousePointer,
	Undo,
} from "lucide-react";
import { useGraphBuilderStore } from "../stores/graph-builder-store";

interface IGraphBuilderTopToolbarProps {
	undo: () => void;
	redo: () => void;
	canUndo?: boolean;
	canRedo?: boolean;
	applyNodeStyle: (color?: string, size?: number) => void;
	applyEdgeStyle: (color?: string, width?: number) => void;
	setLabels: (label: "number" | "letter" | "none") => void;
}

function GraphBuilderTopToolbar({
	undo,
	redo,
	canUndo,
	canRedo,
	applyNodeStyle,
	applyEdgeStyle,
	setLabels,
}: IGraphBuilderTopToolbarProps): React.JSX.Element {
	const {
		activateClickSelect,
		setActivateClickSelect,
		activateAddNode,
		setActivateAddNode,
		activateAddUndirectedEdge,
		setActivateAddUndirectedEdge,
		activateAddDirectedEdge,
		setActivateAddDirectedEdge,
		activateEraser,
		setActivateEraser,
		activateCanvasMove,
		setActivateCanvasMove,
		activateCanvasLassoSelect,
		setActivateCanvasLassoSelect,
		activateCanvasAreaSelect,
		setActivateCanvasAreaSelect,
		allowDirectedEdges,
		allowUndirectedEdges,
		nodeColor,
		setNodeColor,
		nodeSize,
		setNodeSize,
		edgeColor,
		setEdgeColor,
		edgeWidth,
		setEdgeWidth,
	} = useGraphBuilderStore();

	return (
		<div className="absolute left-0 top-2 flex w-full items-center justify-center">
			<Toolbar>
				<ToolbarGroup maxActiveItems={1}>
					<ToolbarItem
						icon={<MousePointer2 />}
						active={activateClickSelect}
						onChange={setActivateClickSelect}
					/>
				</ToolbarGroup>
				<ToolbarGroup maxActiveItems={1}>
					<ToolbarItem
						icon={<CirclePlus />}
						active={activateAddNode}
						onChange={setActivateAddNode}
					/>
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarItem
						icon={<Spline />}
						active={activateAddUndirectedEdge}
						disabled={!allowUndirectedEdges}
						onChange={setActivateAddUndirectedEdge}
					/>
					<ToolbarItem
						icon={<MoveUpRight />}
						active={activateAddDirectedEdge}
						disabled={!allowDirectedEdges}
						onChange={setActivateAddDirectedEdge}
					/>
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarItem
						icon={<Eraser />}
						active={activateEraser}
						onChange={setActivateEraser}
					/>
				</ToolbarGroup>
				<ToolbarSeparator />
				<ToolbarGroup>
					<ToolbarItem
						icon={<Move />}
						active={activateCanvasMove}
						onChange={setActivateCanvasMove}
						hint="Move the canvas with your mouse"
					/>
					<ToolbarItem
						icon={<LassoSelect />}
						active={activateCanvasLassoSelect}
						onChange={setActivateCanvasLassoSelect}
						hint="Select multiple nodes with a lasso while holding down the Shift key"
					/>
					<ToolbarItem
						icon={<SquareDashedMousePointer />}
						active={activateCanvasAreaSelect}
						onChange={setActivateCanvasAreaSelect}
						hint="Select multiple nodes with a rectangle while holding down the Shift key"
					/>
				</ToolbarGroup>
				<ToolbarSeparator />
				<ToolbarGroup maxActiveItems={0}>
					<ToolbarItem
						icon={<Undo />}
						onClick={() => {
							undo();
						}}
						disabled={canUndo === false}
					/>
					<ToolbarItem
						icon={<Redo />}
						onClick={() => redo()}
						disabled={canRedo === false}
					/>
				</ToolbarGroup>
				<ToolbarSeparator />
				<ToolbarGroup maxActiveItems={0}>
					<ToolbarItem
						children={
							<>
								<Circle
									stroke={nodeColor}
									fill={nodeColor}
									fillOpacity={0.5}
								/>
								<input
									type="color"
									className="rounded-md bg-transparent focus-visible:outline-none"
									style={{
										top: 0,
										left: 0,
										position: "absolute",
										height: "100%",
										width: "100%",
										opacity: 0,
										cursor: "pointer",
									}}
									value={nodeColor}
									onChange={(e) => {
										setNodeColor(e.target.value);
										applyNodeStyle(e.target.value, undefined);
									}}
								/>
							</>
						}
						asChild={true}
						onClick={() => applyNodeStyle(nodeColor, undefined)}
						hint="Change node color"
					/>
					<ToolbarItem
						children={
							<div className="dropdown dropdown-end">
								<div
									tabIndex={0}
									role="button"
									className="rounded-field"
								>
									<Radius />
								</div>
								<div
									tabIndex={0}
									className="z-1 menu dropdown-content w-52 rounded-box bg-base-100 p-2 shadow-sm"
								>
									<label className="input flex items-center gap-2">
										<div className="w-1/3">Size:</div>
										<input
											type="range"
											min={13}
											max={130}
											value={nodeSize}
											className="range w-2/3"
											step={1}
											onChange={(e) => {
												setNodeSize(parseInt(e.target.value));
												applyNodeStyle(undefined, parseInt(e.target.value));
											}}
										/>
									</label>
								</div>
							</div>
						}
						asChild={true}
						onClick={() => applyNodeStyle(undefined, nodeSize)}
						hint="Change node size"
					/>
					<ToolbarSeparator />
					<ToolbarItem
						children={
							<>
								<Spline stroke={edgeColor} />
								<input
									type="color"
									className="rounded-md bg-transparent focus-visible:outline-none"
									style={{
										top: 0,
										left: 0,
										position: "absolute",
										height: "100%",
										width: "100%",
										opacity: 0,
										cursor: "pointer",
									}}
									value={edgeColor}
									onChange={(e) => {
										setEdgeColor(e.target.value);
										applyEdgeStyle(e.target.value, undefined);
									}}
								/>
							</>
						}
						asChild={true}
						onClick={() => applyEdgeStyle(edgeColor, undefined)}
						hint="Change edge color"
					/>
					<ToolbarItem
						children={
							<div className="dropdown dropdown-end">
								<div
									tabIndex={0}
									role="button"
									className="rounded-field"
								>
									<Minus strokeWidth={edgeWidth} />
								</div>
								<div
									tabIndex={0}
									className="z-1 menu dropdown-content w-52 rounded-box bg-base-100 p-2 shadow-sm"
								>
									<label className="input flex items-center gap-2">
										<div className="w-1/3">Width:</div>
										<input
											type="range"
											min={1}
											max={10}
											value={edgeWidth}
											className="range w-2/3"
											step={1}
											onChange={(e) => {
												setEdgeWidth(parseInt(e.target.value));
												applyEdgeStyle(undefined, parseInt(e.target.value));
											}}
										/>
									</label>
								</div>
							</div>
						}
						asChild={true}
						onClick={() => applyEdgeStyle(undefined, edgeWidth)}
						hint="Change edge width"
					/>
				</ToolbarGroup>
				<ToolbarSeparator />
				<ToolbarGroup>
					<ToolbarItem
						asChild
						customContent
						className="dropdown-center dropdown dropdown-bottom dropdown-hover"
					>
						<div
							tabIndex={0}
							role="button"
						>
							Reset labels to
						</div>
						<ul
							tabIndex={0}
							className="z-1 menu dropdown-content rounded-box bg-base-100"
						>
							<li>
								<button
									className="btn border-none"
									onClick={() => {
										setLabels("number");
									}}
								>
									number
								</button>
							</li>
							<li>
								<button
									className="btn border-none"
									onClick={() => {
										setLabels("letter");
									}}
								>
									letter
								</button>
							</li>
							<li>
								<button
									className="btn border-none"
									onClick={() => {
										setLabels("none");
									}}
								>
									none
								</button>
							</li>
						</ul>
					</ToolbarItem>
				</ToolbarGroup>
			</Toolbar>
		</div>
	);
}

export default GraphBuilderTopToolbar;
