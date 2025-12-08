import React, { useEffect, useState } from "react";
import Graphin, { GraphinData } from "@antv/graphin";
import { customNodes } from "./GraphCustomNode";
import { getDaisyuiColor, ThemeColor } from "../utils/daisyui-colors";

interface IGraphProps {
	width?: number;
	height?: number;
	graph: GraphinData;
	children?: React.ReactNode;
	innerRef?: React.RefObject<Graphin>;
	layout?: { type: string; options: object };
	nodeColor?: string;
	edgeColor?: string;
	animation?: boolean;
	backgroundColor?: string;
}

// registering custom nodes
customNodes.forEach((element) => {
	Graphin.registerNode(element.name, element.data, element.parent);
});

function Graph({
	width,
	height,
	graph,
	children,
	layout,
	nodeColor,
	edgeColor,
	innerRef,
	animation,
	backgroundColor,
}: IGraphProps): React.JSX.Element {
	const [initialized, setInitialized] = useState(false);

	useEffect(() => {
		setInitialized(true);
	}, []);

	const colorBase1 = getDaisyuiColor(ThemeColor.BASE1);
	const colorBaseContent = getDaisyuiColor(ThemeColor.BASE_CONTENT);
	if (initialized) {
		return (
			<div className="flex size-full flex-col">
				<div className="flex grow basis-40 overflow-hidden">
					<Graphin
						ref={innerRef}
						data={graph}
						width={width}
						height={height}
						layout={layout?.type === undefined ? undefined : { type: layout.type, ...layout.options }}
						containerStyle={{
							height: height ?? "100%",
							width: width ?? "100%",
							position: "relative",
							flexGrow: 1,
						}}
						theme={{
							mode: "light",
							background: backgroundColor ?? colorBase1,
							primaryColor: nodeColor ?? colorBaseContent,
							primaryEdgeColor: edgeColor ?? colorBaseContent,
						}}
						defaultNode={{
							// @ts-expect-error Wrong type definition in library
							style: {
								label: {
									position: "center",
									offset: [0, 6.5],
								},
								keyshape: {
									size: 50,
								},
							},
						}}
						animate={animation ?? true}
					>
						{children}
					</Graphin>
				</div>
			</div>
		);
	} else {
		return <></>;
	}
}

export default Graph;
