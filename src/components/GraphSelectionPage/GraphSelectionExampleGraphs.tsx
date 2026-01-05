import React, { useEffect, useState } from "react";
import { IAlgorithmInformation } from "../../utils/available-algorithms";
import { GraphTS } from "../../utils/graphs";
import GraphSelectionCard from "./GraphSelectionCard";
import { Loader2 } from "lucide-react";
import GraphSelectionCategory from "./GraphSelectionCategory";
import { useNavigate } from "react-router-dom";
import { LinkTS, NodeTS } from "../../algorithms/adapter";
import GraphRankingSelector from "./GraphRankingSelector";
import { LayoutAlgorithm } from "../../algorithms/algorithm-interfaces";
import { graphLayouts } from "../../utils/layouts";
import { GraphinData } from "@antv/graphin";

interface IGraphSelectionExampleGraphsProps {
	algorithm: IAlgorithmInformation;
}

/**
 * Component to display example graphs for the selected algorithm
 * @param algorithm
 * @constructor
 */
function GraphSelectionExampleGraphs({ algorithm }: IGraphSelectionExampleGraphsProps): React.JSX.Element {
	const [loadingExampleGraphs, setLoadingExampleGraphs] = useState(true);
	const [exampleGraphs, setExampleGraphs] = useState<Array<GraphTS<NodeTS, LinkTS>>>([]);

	const { isInitialized, getExampleGraph, numberOfGraphs, setNewGraph, setLayoutAlgorithm } =
		algorithm.useAlgorithmStore((state) => ({
			...state,
		}));

	useEffect(() => {
		if (algorithm !== undefined) {
			// if (algorithm === )
			if (isInitialized) {
				const tempExampleGraphs: Array<GraphTS<NodeTS, LinkTS>> = [];
				for (let i = 0; i < numberOfGraphs; i++) {
					tempExampleGraphs.push(getExampleGraph(i));
				}

				setExampleGraphs(tempExampleGraphs);
				setLoadingExampleGraphs(false);
			}
		}
	}, [isInitialized]);

	const navigate = useNavigate();

	return (
		<GraphSelectionCategory
			name="Choose example graphs"
			rankingSelector={
				<GraphRankingSelector
					graphs={exampleGraphs}
					setGraphs={setExampleGraphs}
					algorithm={algorithm}
				/>
			}
		>
			{exampleGraphs.map((graph, index) => {
				const hasCoordinates = graph.nodes.some(
					(node) => typeof node.x === "number" && typeof node.y === "number"
				);
				return (
					<GraphSelectionCard
						key={index}
						graph={{
							graph,
							name: `Graph ${index + 1}`,
							id: `example-${index}`,
							description: getExampleGraph(index).description,
							restrictedToAlgorithm: algorithm.name,
						}}
						onClick={() => {
							graph.nodes.forEach((node) => {
								if (node.style === undefined) node.style = {};
								if (node.style.label === undefined) node.style.label = {};
								node.style.label.value = node.name;
							});

							if (hasCoordinates) {
								setLayoutAlgorithm(LayoutAlgorithm.Free);
							} else if (algorithm.name === "Ford-Fulkerson") {
								setLayoutAlgorithm(LayoutAlgorithm.Circle); // dagre for future maybe
							} else {
								setLayoutAlgorithm(LayoutAlgorithm.Circle);
							}

							setNewGraph(graph, { graphinGraph: graph as GraphinData });
							navigate(`/${algorithm?.name.toLowerCase()}/graph/`);
						}}
						layout={
							hasCoordinates
								? graphLayouts.Free
								: algorithm.name === "Ford-Fulkerson"
									? graphLayouts.Circle
									: graphLayouts.Circle
						}
						weighted={!(algorithm?.requirements.noWeights ?? false)}
						directed={!(algorithm.requirements.noDirectedEdge ?? false)}
					/>
				);
			})}
			{loadingExampleGraphs && (
				<>
					<div className="absolute inset-0 flex min-h-[200px] w-full flex-col items-center justify-center gap-4">
						<Loader2 className="size-16 animate-spin" />
						<p className="text-center">Loading example graphs...</p>
					</div>
					<div className="min-h-[200px]" />
				</>
			)}
		</GraphSelectionCategory>
	);
}

export default GraphSelectionExampleGraphs;
