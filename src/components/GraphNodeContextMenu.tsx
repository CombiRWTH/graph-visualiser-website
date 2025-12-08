import React, { useContext, useEffect, useState } from "react";
import { Components, GraphinContext, IUserEdge, IUserNode } from "@antv/graphin";
import { Trash2 } from "lucide-react";
import { setNodeColor, setNodeCost, setNodeLabel, setNodeSize } from "./GraphCustomNode";
import { useGraphBuilderStore } from "../stores/graph-builder-store";

export const GraphNodeContextMenu: React.FC<{
	selectorEnabled: boolean;
}> = ({ selectorEnabled }) => {
	const { ContextMenu } = Components;

	return (
		<ContextMenu bindType="node">
			{(selectedItem) => {
				return (
					<EditMenu
						contextMenu={selectedItem}
						selectorEnabled={selectorEnabled}
					/>
				);
			}}
		</ContextMenu>
	);
};

const EditMenu: React.FC<{
	contextMenu: IUserNode;
	selectorEnabled: boolean;
}> = ({ contextMenu, selectorEnabled }) => {
	const { id, onClose, item } = contextMenu;
	const { graph } = useContext(GraphinContext);
	const { setContextMenuOpen, setManualSaveFlag } = useGraphBuilderStore();
	const items =
		selectorEnabled && graph.findAllByState("node", "selected").length !== 0
			? graph.findAllByState("node", "selected")
			: [item];

	const node = graph.findById(id);

	const [size, updateSize] = useState(
		parseInt(node?._cfg?.model?.style?.keyshape?.size ?? node?._cfg?.originStyle?.keyshape?.size ?? 50)
	);
	const [color, updateColor] = useState(node?._cfg?.originStyle?.keyshape?.fill ?? "#2e3440");
	const [nodeLabel, updateNodeLabel] = useState(node?._cfg?.originStyle?.label?.text ?? "");
	const [nodeValue, updateNodeValue] = useState(
		node?._cfg?.originStyle.bagesLabel?.text ?? node?._cfg?.originStyle?.bagesLabel?.text ?? ""
	);

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
		onClose();
		setContextMenuOpen(false);
	};

	if (graph?.getEvents()["canvas:click"]?.filter((e) => e.callback.name === "registerEvent").length === 0) {
		graph.on("canvas:click", registerEvent);
	}

	graph.on("edge:click", closeContextMenuEvent);
	graph.on("edge:contextmenu", closeContextMenuEvent);

	graph.on("node:click", closeContextMenuEvent);

	const deleteItem = (): void => {
		items.forEach((item) => graph.removeItem(item));
		onClose();
	};

	const changeSize = (value: string): void => {
		const newSize = parseInt(value);
		updateSize(parseInt(value));
		items.forEach((item) => {
			graph.updateItem(item, {
				style: setNodeSize(newSize, item._cfg.currentShape),
			});
			if (item.getEdges() !== undefined) {
				item.getEdges().forEach((edge: IUserEdge) => edge.refresh());
			}
		});
		setManualSaveFlag(true);
	};

	const changeColor = (color: string): void => {
		updateColor(color);
		items.forEach((item) =>
			graph.updateItem(item, {
				style: setNodeColor(color, item._cfg.currentShape),
			})
		);
		setManualSaveFlag(true);
	};

	const changeNodeValue = (nodeValue: string): void => {
		updateNodeValue(nodeValue);

		items.forEach((item) =>
			graph.updateItem(item, {
				style: setNodeCost(nodeValue, item._cfg.currentShape),
			})
		);
		setManualSaveFlag(true);
	};

	const changeNodeLabel = (nodeLabel: string): void => {
		updateNodeLabel(nodeLabel);
		items.forEach((item) =>
			graph.updateItem(item, {
				style: setNodeLabel(nodeLabel, item._cfg.currentShape),
			})
		);
		setManualSaveFlag(true);
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
					<div className="w-1/3">Label:</div>
					<input
						type="text"
						autoComplete="off"
						className="w-2/3 grow"
						placeholder={nodeLabel}
						name="Label"
						value={nodeLabel}
						onChange={(e) => changeNodeLabel(e.target.value)}
					/>
				</label>
			</li>

			<li className="mt-2">
				<label className="input flex items-center gap-2">
					<div className="w-1/3">Cost:</div>
					<input
						type="number"
						name="name"
						autoComplete="off"
						placeholder="-"
						className="w-2/3"
						value={nodeValue}
						onChange={(e) => changeNodeValue(e.target.value)}
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
					<div className="w-1/3">Size:</div>
					<input
						type="range"
						min={13}
						max={130}
						value={size}
						className="range w-2/3"
						step={13}
						onChange={(e) => {
							changeSize(e.target.value);
						}}
					/>
				</label>
			</li>
		</ul>
	);
};
