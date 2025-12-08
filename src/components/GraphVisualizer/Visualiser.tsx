import React, { useEffect, useRef, useState } from "react";
import Graph from "./../Graph";
import Graphin, { Behaviors, GraphinData } from "@antv/graphin";
import { LayoutAlgorithm } from "../../algorithms/algorithm-interfaces";
import GraphFitView from "../GraphFitView";
import { useLocation } from "react-router-dom";
import { graphLayouts } from "../../utils/layouts";

interface Props {
	data?: GraphinData;
	width?: number;
	height?: number;
	layoutAlgorithm?: LayoutAlgorithm;
	allowNodeDragging?: boolean;
	allowCanvasDragging?: boolean;
	allowZooming?: boolean;
	allowEdgeSelection?: boolean;
	allowNodeSelection?: boolean;
	allowBrushSelect?: boolean;
	children?: React.ReactNode;
	shouldRerender?: boolean;
	graphRef?: React.MutableRefObject<Graphin | null>;
}

export const Visualiser: React.FunctionComponent<Props> = ({
	data,
	layoutAlgorithm,
	allowNodeDragging,
	allowCanvasDragging,
	allowZooming,
	allowEdgeSelection,
	allowNodeSelection,
	allowBrushSelect,
	children,
	shouldRerender,
	graphRef,
}) => {
	// Workaround to prevent the graph from being rendered before the container has a size
	const [init, setInit] = useState(false);

	useEffect(() => {
		setInit(true);
	}, []);

	const containerRef = useRef<HTMLDivElement>(null);

	const { ZoomCanvas, ActivateRelations, DragNode, ClickSelect, DragCanvas, BrushSelect } = Behaviors;

	const layout = { ...graphLayouts.Free };

	if (layoutAlgorithm) {
		layout.type = graphLayouts[layoutAlgorithm].type;
		layout.options = graphLayouts[layoutAlgorithm].options;
	}

	// Force rerender of graph.
	// This is an ugly hack and needed because the badges for the dijkstra distances otherwise
	// don't dissappear.
	// TODO: find a better solution to render the cleared lables
	const updateGraphData = (): void => {
		if (graphRef?.current !== null && graphRef !== undefined) {
			const graphInstance = graphRef.current.graph;
			graphInstance.render();
			graphInstance.fitView();
		}
	};
	useEffect(() => {
		updateGraphData();
	}, [shouldRerender]);
	const url = useLocation();
	// This forces rerendering when exciting the run and practice modes
	useEffect(() => {
		if (
			graphRef?.current !== null &&
			graphRef !== undefined &&
			(url.pathname.includes("dijkstra/graph") || url.pathname.includes("dijkstra/practice"))
		) {
			graphRef.current.graph.render();
			const timer = setTimeout(() => {
				if (graphRef.current?.graph !== undefined) {
					graphRef.current.graph.fitView();
				}
			}, 0);

			return () => clearTimeout(timer);
		}
	}, [data]);

	return (
		<div
			className="flex grow items-center justify-center lg:bg-base-300"
			ref={containerRef}
		>
			{init && (
				<>
					<Graph
						innerRef={graphRef}
						graph={data ?? { nodes: [], edges: [], combos: [] }}
						layout={layout}
						width={containerRef.current?.clientWidth}
						height={containerRef.current?.clientHeight}
						animation={false}
						backgroundColor={"hsla(0, 0%, 100%, 0)"}
					>
						<ZoomCanvas disabled={allowZooming === false} />
						<BrushSelect disabled={allowBrushSelect !== true} />
						<DragCanvas disabled={allowCanvasDragging === false} />
						<ActivateRelations disabled={allowEdgeSelection === false} />
						<DragNode disabled={allowNodeDragging === false} />
						<ClickSelect disabled={allowNodeSelection === false} />
						<GraphFitView />
						{/* <GraphLayoutChanger layout={layout} /> */}
						{children}
					</Graph>
				</>
			)}
		</div>
	);
};
