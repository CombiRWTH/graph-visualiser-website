import React, { useState, useContext, useEffect } from "react";
import { GraphinContext, IUserEdge, Components } from "@antv/graphin";
import { Trash2 } from "lucide-react";
import { isDirectedEdge } from "./GraphCreateEdge";
import { useGraphBuilderStore } from "../stores/graph-builder-store";

export const GraphEdgeContextMenu: React.FC<{
	selecterEnabled: boolean;
}> = ({ selecterEnabled }) => {
	const { ContextMenu } = Components;

	return (
		<ContextMenu bindType="edge">
			{(selectedItem) => {
				if (isIUserEdge(selectedItem)) {
					return (
						<EditEdgeMenu
							contextMenu={selectedItem}
							selecterEnabled={selecterEnabled}
						/>
					);
				}
				return null;
			}}
		</ContextMenu>
	);
};

const isIUserEdge = (item: unknown): item is IUserEdge => {
	return (
		typeof item === "object" &&
		item !== null &&
		"id" in item &&
		item.id !== undefined &&
		"item" in item &&
		"onClose" in item
	);
};

const EditEdgeMenu: React.FC<{
	contextMenu: IUserEdge;
	selecterEnabled: boolean;
}> = ({ contextMenu, selecterEnabled }) => {
	const { id, onClose, item } = contextMenu;
	const { graph } = useContext(GraphinContext);
	const items =
		selecterEnabled && graph.findAllByState("edge", "selected").length !== 0
			? graph.findAllByState("edge", "selected")
			: [item];
	const {
		highlightNegativeEdges,
		allowNegativeWeights,
		graphInfoTrigger,
		setManualSaveFlag,
		setContextMenuOpen,
		setGraphInfoTrigger,
	} = useGraphBuilderStore();

	const edge = graph.findById(id);

	const [lineWidth, updateWidth] = useState(parseInt(edge?._cfg?.model?.style?.keyshape?.lineWidth ?? 2));
	const [color, updateColor] = useState(edge?._cfg?.model?.style?.keyshape?.stroke ?? "#2e3440");
	const [edgeValue, setEdgeValue] = useState(edge?._cfg?.model?.style?.label?.value ?? "");
	const [direction, setDirection] = useState(isDirectedEdge(edge._cfg as IUserEdge) ? "directed" : "undirected");

	// Mounting set flag open --> for NodeInsert
	useEffect(() => {
		setContextMenuOpen(true);
	}, []);

	// Need extra function to filter for name
	const registerEvent = (): void => {
		setContextMenuOpen(false);
	};
	const closeContextMenuEvent = (): void => {
		graph.off("edge:click", closeContextMenuEvent);
		graph.off("node:click", closeContextMenuEvent);
		graph.off("node:contextmenu", closeContextMenuEvent);
		onClose();
		setContextMenuOpen(false);
	};
	if (graph?.getEvents()["canvas:click"]?.filter((e) => e.callback.name === "registerEvent").length === 0) {
		graph.on("canvas:click", registerEvent);
	}

	graph.on("edge:click", closeContextMenuEvent);
	graph.on("node:click", closeContextMenuEvent);
	graph.on("node:contextmenu", closeContextMenuEvent);

	const deleteItem = (): void => {
		items.forEach((item) => graph.removeItem(item));

		onClose();
	};

	const changeWidth = (value: string): void => {
		const newWidth = parseInt(value);
		updateWidth(newWidth);
		items.forEach((item) => {
			const curStyle = item.getModel().style.keyshape ?? {};
			curStyle.lineWidth = newWidth;
			graph.updateItem(item, {
				style: {
					keyshape: curStyle,
				},
			});
		});

		// Manual save flag
		setManualSaveFlag(true);
	};

	const changeColor = (color: string): void => {
		updateColor(color);
		items.forEach((item) => {
			const model = item.getModel();
			const keyshape = model.style?.keyshape ?? {};

			// Set stroke color for edge line
			keyshape.stroke = color;

			// If there's an arrow, apply color explicitly to its stroke and fill
			if (keyshape.endArrow !== undefined) {
				keyshape.endArrow.stroke = color;
				keyshape.endArrow.fill = color;
			}

			graph.updateItem(item, {
				style: {
					keyshape,
				},
			});
		});

		// Manual save flag
		setManualSaveFlag(true);
	};

	const changeEdgeValue = (edgeValue: string): void => {
		const value = parseInt(edgeValue);
		if (!allowNegativeWeights && edgeValue !== "" && (Number.isNaN(value) || value < 0)) {
			edgeValue = "0";
		}
		setEdgeValue(edgeValue);
		graph.updateItem(item, {
			style: {
				label: {
					value: edgeValue,
				},
			},
		});

		// Update highlight negative edges
		items.forEach((item) => {
			if (highlightNegativeEdges && item._cfg?.model?.style?.label.value < 0) {
				item._cfg!.model!.style!.halo = { fill: color, visible: true };
				graph.refreshItem(item._cfg?.id as string);
			} else {
				item._cfg!.model!.style!.halo = { fill: color, visible: false };
				graph.refreshItem(item._cfg?.id as string);
			}
		});

		// Manual save flag
		setManualSaveFlag(true);
		setGraphInfoTrigger(!graphInfoTrigger);
	};

	const handleChangeDiredction = (value: string): void => {
		setDirection(value);
		value === "undirected" ? undirectedEdge() : directedEdge();
		setGraphInfoTrigger(!graphInfoTrigger);
	};

	const undirectedEdge = (): void => {
		items.forEach((item) => {
			const curStyle = item.getModel().style.keyshape ?? {};
			curStyle.endArrow = false;
			curStyle.startArrow = false;
			item.set("directed", false);
			graph.updateItem(item, {
				style: {
					keyshape: curStyle,
				},
			});
		});
	};

	const directedEdge = (): void => {
		items.forEach((item) => {
			const curStyle = item.getModel().style.keyshape ?? {};
			curStyle.endArrow = { path: "M 0,0 L 6,3 L 6,-3 Z", fill: color };
			curStyle.startArrow = false;
			item.set("directed", true);
			graph.updateItem(item, {
				style: {
					keyshape: curStyle,
				},
			});
		});
	};

	const flipEdgeDirection = (): void => {
		setDirection("directed");
		items.forEach((item) => {
			const tOld = item._cfg?.target;
			const sOld = item._cfg?.source;
			item.set("target", sOld);
			item.set("source", tOld);

			const curStyle = item.getModel().style.keyshape ?? {};
			curStyle.endArrow = { path: "M 0,0 L 6,3 L 6,-3 Z", fill: color };
			curStyle.startArrow = false;
			item.set("directed", true);
			graph.updateItem(item, {
				source: item.getModel().target,
				target: item.getModel().source,
				style: {
					keyshape: curStyle,
				},
			});
		});
		setGraphInfoTrigger(!graphInfoTrigger);
	};

	return (
		<ul
			className="menu w-56 rounded-box bg-base-200"
			style={{
				width: "max-content",
			}}
		>
			<div className="flex justify-end">
				<button
					className="btn btn-ghost p-2 hover:bg-error hover:text-error-content"
					onClick={deleteItem}
				>
					<Trash2 />
				</button>
			</div>

			<li className="mt-2">
				<label className="input flex items-center gap-2">
					<div className="w-1/3">Cost:</div>
					<input
						type="number"
						name="name"
						autoComplete="off"
						placeholder=""
						className="w-2/3"
						value={edgeValue}
						onChange={(e) => changeEdgeValue(e.target.value)}
					/>
				</label>
			</li>

			<li className="mt-2">
				<label className="input mt-2 flex items-center gap-2">
					<div className="w-1/3">Color:</div>
					<input
						type="color"
						className="w-2/3 grow cursor-pointer"
						id={id}
						value={color}
						onChange={(e) => changeColor(e.target.value)}
					/>
				</label>
			</li>
			<li className="mt-2">
				<label className="input mt-2 flex items-center gap-2">
					<div className="w-1/3">Width:</div>
					<input
						type="range"
						min={1}
						max={10}
						value={lineWidth}
						className="range w-2/3"
						step={1}
						onChange={(e) => {
							changeWidth(e.target.value);
						}}
					/>
				</label>
			</li>
			<li className="mt-2">
				<label className="hover:bg-transparent">
					<div className="w-1/3">Direction:</div>
					<select
						id={id}
						className="min-w-2/3 select"
						value={direction}
						onChange={(e) => handleChangeDiredction(e.target.value)}
					>
						<option
							key="undirected"
							value={"undirected"}
						>
							undirected
						</option>
						<option
							key="directed"
							value={"directed"}
						>
							directed
						</option>
					</select>
				</label>
			</li>
			<li className="mt-2">
				<button
					type="button"
					value="Flip edge"
					className="btn btn-ghost"
					onClick={() => {
						flipEdgeDirection();
					}}
				>
					Flip edge
				</button>
			</li>
		</ul>
	);
};
