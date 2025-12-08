// add custom node
import type { IGroup, IShape } from "@antv/g6";
import { IUserNode } from "@antv/graphin";

// https://g6-v3-2.antv.vision/en/docs/manual/advanced/keyconcept/shape-and-properties#rect
export interface CustomNodeCfg {
	_initialStyle: {
		keyshape: {
			size: number;
			fill: string;
			fillOpacity: number;
			lineWidth: number;
			opacity: number;
			stroke: string;
			strokeOpacity: number;
		};
		label: {
			background: string;
			fill: string;
			fillOpacity: number;
			fontSize: number;
			offset: number;
			value: string;
			visible: boolean;
		};
		badges?: [
			{
				fill: string;
				color: string;
				value: string;
				visible: boolean;
			},
		];
		badge?: {
			x: number;
			y: number;
			r: number;
			fill: string;
		};
		bagesLabel?: {
			background: string;
			fill: string;
			fillOpacity: number;
			fontSize: number;
			offset: number;
			x: number;
			y: number;
			textAlign: string;
			text: string;
			visible: boolean;
		};
	};
}

const defaultInitialStyle: CustomNodeCfg["_initialStyle"] = {
	keyshape: {
		size: 50,
		fill: "#2e3440",
		fillOpacity: 0.3,
		stroke: "#2e3440",
		strokeOpacity: 1,
		lineWidth: 1,
		opacity: 1,
	},
	label: {
		background: "",
		value: "",
		fill: "#fff",
		fontSize: 12,
		offset: 0,
		fillOpacity: 1,
		visible: true,
	},
	badges: undefined,
	badge: undefined,
};

// List of customnodes
export const customNodes = [
	{
		name: "startnode",
		data: {
			options: {
				style: {},
				stateStyles: {
					hover: {},
					selected: {},
				},
			},
			draw(cfg: CustomNodeCfg, group: IGroup) {
				const styleDefaultNode = { ...cfg._initialStyle, ...defaultInitialStyle };
				const defaulteKeyshape = styleDefaultNode.keyshape;
				const keyshape = group.addShape("rect", {
					attrs: {
						x: 0,
						y: -20,
						width: 40,
						height: 40,
						size: defaulteKeyshape.size,
						fill: defaulteKeyshape.fill,
						fillOpacity: defaulteKeyshape.fillOpacity,
						lineWidth: defaulteKeyshape.lineWidth,
						opacity: defaulteKeyshape.opacity,
						stroke: defaulteKeyshape.stroke,
						strokeOpacity: defaulteKeyshape.strokeOpacity,
					},
					draggable: true,
					name: "circle-floor",
				});
				group.addShape("text", {
					attrs: {
						background: styleDefaultNode.label.background,
						fill: styleDefaultNode.label.fill,
						fillOpacity: styleDefaultNode.label.fillOpacity,
						fontSize: styleDefaultNode.label.fontSize,
						offset: styleDefaultNode.label.offset,
						x: 20,
						y: 5,
						textAlign: "center",
						text: "s",
						visible: styleDefaultNode.label.visible,
					},
					draggable: true,
					name: "label",
				});
				return keyshape;
			},
		},
		parent: "single-node",
	},
	{
		name: "graphin-rect",
		data: {
			draw(cfg: CustomNodeCfg, group: IGroup) {
				const styleDefaultNode = { ...cfg._initialStyle, ...defaultInitialStyle };
				const defaulteKeyshape = styleDefaultNode.keyshape;
				// main shape
				const shape = group.addShape("path", {
					attrs: {
						path: rectPath(defaulteKeyshape.size),
						size: defaulteKeyshape.size,
						fill: defaulteKeyshape.fill,
						fillOpacity: defaulteKeyshape.fillOpacity,
						lineWidth: defaulteKeyshape.lineWidth,
						opacity: defaulteKeyshape.opacity,
						stroke: defaulteKeyshape.stroke,
						strokeOpacity: defaulteKeyshape.strokeOpacity,
					},
					name: "keyshape",
					draggable: true,
				});
				// halo
				group.addShape("path", {
					attrs: {
						path: rectPath(defaulteKeyshape.size),
						stroke: defaulteKeyshape.stroke,
						lineWidth: 1,
						opacity: 1,
					},
					draggable: true,
					name: "halo-shape",
				});
				// shadow
				group.addShape("path", {
					attrs: {
						path: rectPath(defaulteKeyshape.size, 15),
						fill: defaulteKeyshape.fill,
						opacity: 0,
					},
					draggable: true,
					name: "shadow-shape",
				});
				// label
				group.addShape("text", {
					attrs: {
						background: styleDefaultNode.label.background,
						fill: styleDefaultNode.label.fill,
						fillOpacity: styleDefaultNode.label.fillOpacity,
						fontSize: styleDefaultNode.label.fontSize,
						offset: styleDefaultNode.label.offset,
						x: 0,
						y: styleDefaultNode.label.fontSize / 2,
						textAlign: "center",
						text: styleDefaultNode.label.value,
						visible: styleDefaultNode.label.visible,
					},
					draggable: true,
					name: "label",
				});
				group.addShape("circle", {
					attrs: {
						x: defaulteKeyshape.size / 2,
						y: -defaulteKeyshape.size / 2,
						r: 10,
						fill: styleDefaultNode.badge?.fill ?? styleDefaultNode.badges?.[0]?.fill ?? "transparent",
					},
					draggable: true,
					name: "badge",
				});
				group.addShape("text", {
					attrs: {
						background: styleDefaultNode.label.background,
						fill: styleDefaultNode.label.fill,
						fillOpacity: styleDefaultNode.label.fillOpacity,
						fontSize: styleDefaultNode.label.fontSize,
						offset: styleDefaultNode.label.offset,
						x: defaulteKeyshape.size / 2,
						y: -defaulteKeyshape.size / 2 + styleDefaultNode.label.fontSize / 2,
						textAlign: "center",
						text: styleDefaultNode.bagesLabel?.text ?? styleDefaultNode.badges?.[0]?.value ?? "",
						visible: styleDefaultNode.label.visible,
					},
					draggable: true,
					name: "bagesLabel",
				});

				return shape;
			},
			// change here for new node shapes

			setState(name: string, value: boolean, item: IUserNode) {
				const group = item.getContainer();
				const halo = group.find((element: IShape) => element.get("name") === "halo-shape");
				const shadow = group.find((element: IShape) => element.get("name") === "shadow-shape");
				if (name === "selected") {
					if (value) {
						halo.attr("lineWidth", 5);
						shadow.attr("opacity", 0.1);
					} else {
						halo.attr("lineWidth", 1);
						shadow.attr("opacity", 0);
					}
				}
			},
		},
		parent: "graphin-circle",
	},
	{
		name: "graphin-arrowdown",
		data: {
			draw(cfg: CustomNodeCfg, group: IGroup) {
				const styleDefaultNode = cfg._initialStyle;
				const defaulteKeyshape = styleDefaultNode.keyshape;
				// main shape
				const shape = group.addShape("path", {
					attrs: {
						path: arrowdownPath(defaulteKeyshape.size),
						size: defaulteKeyshape.size,
						fill: defaulteKeyshape.fill,
						fillOpacity: defaulteKeyshape.fillOpacity,
						lineWidth: defaulteKeyshape.lineWidth,
						opacity: defaulteKeyshape.opacity,
						stroke: defaulteKeyshape.stroke,
						strokeOpacity: defaulteKeyshape.strokeOpacity,
					},
					name: "keyshape",
					draggable: true,
				});
				// halo
				group.addShape("path", {
					attrs: {
						path: arrowdownPath(defaulteKeyshape.size),
						stroke: defaulteKeyshape.stroke,
						lineWidth: 1,
						opacity: 1,
					},
					draggable: true,
					name: "halo-shape",
				});
				// shadow
				group.addShape("path", {
					attrs: {
						path: arrowdownPath(defaulteKeyshape.size, 15),
						fill: defaulteKeyshape.fill,
						opacity: 0,
					},
					draggable: true,
					name: "shadow-shape",
				});
				// label
				group.addShape("text", {
					attrs: {
						background: styleDefaultNode.label.background,
						fill: styleDefaultNode.label.fill,
						fillOpacity: styleDefaultNode.label.fillOpacity,
						fontSize: styleDefaultNode.label.fontSize,
						offset: styleDefaultNode.label.offset,
						x: 0,
						y: styleDefaultNode.label.fontSize / 2,
						textAlign: "center",
						text: styleDefaultNode.label.value,
						visible: styleDefaultNode.label.visible,
					},
					draggable: true,
					name: "label",
				});
				group.addShape("circle", {
					attrs: {
						x: defaulteKeyshape.size / 2,
						y: -defaulteKeyshape.size / 2,
						r: 10,
						fill: styleDefaultNode.badges?.[0]?.fill ?? styleDefaultNode.badge?.fill ?? "transparent",
					},
					draggable: true,
					name: "badge",
				});
				group.addShape("text", {
					attrs: {
						background: styleDefaultNode.label.background,
						fill: styleDefaultNode.label.fill,
						fillOpacity: styleDefaultNode.label.fillOpacity,
						fontSize: styleDefaultNode.label.fontSize,
						offset: styleDefaultNode.label.offset,
						x: defaulteKeyshape.size / 2,
						y: -defaulteKeyshape.size / 2 + styleDefaultNode.label.fontSize / 2,
						textAlign: "center",
						text: styleDefaultNode.badges?.[0]?.value ?? styleDefaultNode.bagesLabel?.text ?? "",
						visible: styleDefaultNode.label.visible,
					},
					draggable: true,
					name: "bagesLabel",
				});

				return shape;
			},
			getAnchorPoints() {
				return [
					[0.5, 1], // bottom of the node
				];
			},

			setState(name: string, value: boolean, item: IUserNode) {
				const group = item.getContainer();
				const halo = group.find((element: IShape) => element.get("name") === "halo-shape");
				const shadow = group.find((element: IShape) => element.get("name") === "shadow-shape");
				if (name === "selected") {
					if (value) {
						halo.attr("lineWidth", 5);
						shadow.attr("opacity", 0.1);
					} else {
						halo.attr("lineWidth", 1);
						shadow.attr("opacity", 0);
					}
				}
			},
		},
		parent: "graphin-circle",
	},
	{
		name: "graphin-arrowup",
		data: {
			draw(cfg: CustomNodeCfg, group: IGroup) {
				const styleDefaultNode = cfg._initialStyle;
				const defaulteKeyshape = styleDefaultNode.keyshape;
				// main shape
				const shape = group.addShape("path", {
					attrs: {
						path: arrowupPath(defaulteKeyshape.size),
						size: defaulteKeyshape.size,
						fill: defaulteKeyshape.fill,
						fillOpacity: defaulteKeyshape.fillOpacity,
						lineWidth: defaulteKeyshape.lineWidth,
						opacity: defaulteKeyshape.opacity,
						stroke: defaulteKeyshape.stroke,
						strokeOpacity: defaulteKeyshape.strokeOpacity,
					},
					name: "keyshape",
					draggable: true,
				});
				// halo
				group.addShape("path", {
					attrs: {
						path: arrowupPath(defaulteKeyshape.size),
						stroke: defaulteKeyshape.stroke,
						lineWidth: 1,
						opacity: 1,
					},
					draggable: true,
					name: "halo-shape",
				});
				// shadow
				group.addShape("path", {
					attrs: {
						path: arrowupPath(defaulteKeyshape.size, 15),
						fill: defaulteKeyshape.fill,
						opacity: 0,
					},
					draggable: true,
					name: "shadow-shape",
				});
				// label
				group.addShape("text", {
					attrs: {
						background: styleDefaultNode.label.background,
						fill: styleDefaultNode.label.fill,
						fillOpacity: styleDefaultNode.label.fillOpacity,
						fontSize: styleDefaultNode.label.fontSize,
						offset: styleDefaultNode.label.offset,
						x: 0,
						y: styleDefaultNode.label.fontSize / 2,
						textAlign: "center",
						text: styleDefaultNode.label.value,
						visible: styleDefaultNode.label.visible,
					},
					draggable: true,
					name: "label",
				});
				group.addShape("circle", {
					attrs: {
						x: defaulteKeyshape.size / 2,
						y: -defaulteKeyshape.size / 2,
						r: 10,
						fill: styleDefaultNode.badges?.[0]?.fill ?? styleDefaultNode.badge?.fill ?? "transparent",
					},
					draggable: true,
					name: "badge",
				});
				group.addShape("text", {
					attrs: {
						background: styleDefaultNode.label.background,
						fill: styleDefaultNode.label.fill,
						fillOpacity: styleDefaultNode.label.fillOpacity,
						fontSize: styleDefaultNode.label.fontSize,
						offset: styleDefaultNode.label.offset,
						x: defaulteKeyshape.size / 2,
						y: -defaulteKeyshape.size / 2 + styleDefaultNode.label.fontSize / 2,
						textAlign: "center",
						text: styleDefaultNode.badges?.[0]?.value ?? styleDefaultNode.bagesLabel?.text ?? "",
						visible: styleDefaultNode.label.visible,
					},
					draggable: true,
					name: "bagesLabel",
				});
				return shape;
			},
			getAnchorPoints() {
				return [
					[0.5, 0], // top of the node
				];
			},

			setState(name: string, value: boolean, item: IUserNode) {
				const group = item.getContainer();
				const halo = group.find((element: IShape) => element.get("name") === "halo-shape");
				const shadow = group.find((element: IShape) => element.get("name") === "shadow-shape");
				if (name === "selected") {
					if (value) {
						halo.attr("lineWidth", 5);
						shadow.attr("opacity", 0.1);
					} else {
						halo.attr("lineWidth", 1);
						shadow.attr("opacity", 0);
					}
				}
			},
		},
		parent: "graphin-circle",
	},
];

// To create a new NodeType add a Path function add it to setNodeShape for changing into it add it to setNodeSize to change the Size of it register it in Graph.tsx to be usesed.
export function rectPath(size: number, offset?: number): Array<Array<string | number>> {
	const path = [
		["M", 0 - size / 2 - (offset ?? 0), 0 - size / 2 - (offset ?? 0)], // TopLeft
		["L", 0 + size / 2 + (offset ?? 0), 0 - size / 2 - (offset ?? 0)], // TopRight
		["L", 0 + size / 2 + (offset ?? 0), size / 2 + (offset ?? 0)], // BottomRight
		["L", -size / 2 - (offset ?? 0), size / 2 + (offset ?? 0)], // BottomLeft
		["Z"], // Close the path
	];
	return path;
}
export function arrowupPath(size: number, offset?: number): Array<Array<string | number>> {
	const path = [
		["M", 0 - size / 2 - (offset ?? 0), 0 - size / 2], // TopLeft
		["L", 0, -size - (offset ?? 0)], // arrow up
		["L", 0 + size / 2 + (offset ?? 0), 0 - size / 2], // TopRight
		["L", 0 + size / 2 + (offset ?? 0), size / 2 + (offset ?? 0)], // BottomRight
		["L", -size / 2 - (offset ?? 0), size / 2 + (offset ?? 0)], // BottomLeft
		["Z"], // Close the path
	];
	return path;
}
export function arrowdownPath(size: number, offset?: number): Array<Array<string | number>> {
	const path = [
		["M", 0 - size / 2 - (offset ?? 0), 0 - size / 2 - (offset ?? 0)], // TopLeft
		["L", 0 + size / 2 + (offset ?? 0), 0 - size / 2 - (offset ?? 0)], // TopRight
		["L", 0 + size / 2 + (offset ?? 0), size / 2], // BottomRight
		["L", 0, size + (offset ?? 0)], // arrow down
		["L", -size / 2 - (offset ?? 0), size / 2], // BottomLeft
		["Z"], // Close the path
	];
	return path;
}

export function setNodeShape(
	size: number,
	color: string,
	nodeValue: string,
	currentShape: string,
	nodeLabel?: string
): IUserNode["style"] {
	if (currentShape === "graphin-arrowdown") {
		return getShape(size, color, nodeValue, arrowdownPath, "end");
	} else if (currentShape === "graphin-arrowup") {
		return getShape(size, color, nodeValue, arrowupPath, "start");
	} else if (currentShape === "graphin-rect") {
		return getShape(size, color, nodeValue, rectPath, "rect");
	} else if (currentShape === "graphin-circle") {
		return {
			badges: [
				{
					position: "RT",
					type: "text",
					value: nodeValue,
					fill: nodeValue === "" ? "transparent" : "green",
					size: [20, 20],
					color: "#fff",
					visible: true,
				},
			],
			keyshape: {
				size,
				fill: color,
				stroke: color,
			},
			label: {
				value: nodeLabel,
				offset: [0, 6.5],
				position: "center",
				visible: true,
			},
		};
	}
}
function getShape(
	size: number,
	color: string,
	nodeValue: string,
	pathfunction: (sizePath: number, offset?: number) => Array<Array<string | number>>,
	type: string
): IUserNode["style"] {
	if (type === "start" || type === "end") {
		return {
			keyshape: {
				fill: color,
				stroke: color,
				size,
			},
			"halo-shape": {
				stroke: color,
				path: pathfunction(size),
				cursor: "pointer",
			},
			"shadow-shape": {
				fill: color,
				stroke: color,
				path: pathfunction(size, 15),
				cursor: "pointer",
			},
			label: {
				value: type,
				offset: [0, 6.5],
				position: "center",
				visible: true,
			},
			badge: {
				x: size / 2,
				y: -size / 2,
				fill: nodeValue === "" ? "transparent" : "green",
				cursor: "pointer",
			},
			bagesLabel: {
				text: nodeValue,
				x: size / 2,
				y: -size / 2 + 6.5,
				cursor: "pointer",
			},
		};
	} else {
		return {
			keyshape: {
				fill: color,
				stroke: color,
				size,
			},
			"halo-shape": {
				stroke: color,
				path: pathfunction(size),
				cursor: "pointer",
			},
			"shadow-shape": {
				fill: color,
				stroke: color,
				path: pathfunction(size, 15),
				cursor: "pointer",
			},
			badge: {
				x: size / 2,
				y: -size / 2,
				fill: nodeValue === "" ? "transparent" : "green",
				cursor: "pointer",
			},
			bagesLabel: {
				text: nodeValue,
				x: size / 2,
				y: -size / 2 + 6.5,
				cursor: "pointer",
			},
		};
	}
}
export function setNodeColor(color: string, currentShape: string): IUserNode["style"] {
	if (currentShape === "graphin-circle") {
		return {
			keyshape: {
				fill: color,
				stroke: color,
			},
		};
	} else {
		return {
			keyshape: {
				fill: color,
				stroke: color,
			},
			"halo-shape": {
				stroke: color,
			},
			"shadow-shape": {
				fill: color,
				stroke: color,
			},
		};
	}
}
export function setNodeCost(nodeValue: string, currentShape: string): IUserNode["style"] {
	if (currentShape === "graphin-circle") {
		return {
			badges: [
				{
					position: "RT",
					type: "text",
					value: nodeValue,
					fill: nodeValue === "" ? "transparent" : "green",
					size: [20, 20],
					color: "#fff",
					visible: true,
				},
			],
		};
	} else {
		return {
			badge: {
				visable: false,
				fill: nodeValue === "" ? "transparent" : "green",
			},
			bagesLabel: {
				visable: true,
				text: nodeValue,
			},
		};
	}
}
export function setNodeLabel(nodeLabel: string, currentShape?: string): IUserNode["style"] {
	// not used at the moment
	const cu = currentShape;
	currentShape = cu;
	return {
		label: {
			value: nodeLabel,
			position: "center",
			visible: true,
		},
	};
}
export function setNodeSize(size: number, currentShape: string): IUserNode["style"] {
	if (currentShape === "graphin-arrowdown") {
		return getSize(size, arrowdownPath);
	} else if (currentShape === "graphin-arrowup") {
		return getSize(size, arrowupPath);
	} else if (currentShape === "graphin-rect") {
		return getSize(size, rectPath);
	} else if (currentShape === "graphin-circle") {
		return { keyshape: { size } };
	}
}
function getSize(
	size: number,
	type: (sizePath: number, offset?: number) => Array<Array<string | number>>
): IUserNode["style"] {
	return {
		keyshape: {
			size,
		},
		"halo-shape": {
			path: type(size),
		},
		"shadow-shape": {
			path: type(size, 15),
		},
		badge: {
			x: size / 2,
			y: -size / 2,
		},
		bagesLabel: {
			x: size / 2,
			y: -size / 2 + 6.5,
		},
	};
}
