import React, { useState, useEffect } from "react";
import { GraphTS } from "../../utils/graphs";
import { getGraphStats } from "../../utils/get-TSgraph-stats";
import { LinkTS, NodeTS } from "../../algorithms/adapter";
import { IAlgorithmInformation } from "../../utils/available-algorithms";
import { ArrowDownUp } from "lucide-react";

type SortKey = "none" | "avgDegree" | "numNodes" | "numEdges" | "density";

interface GraphRankingSelectorProps {
	graphs: Array<GraphTS<NodeTS, LinkTS>>;
	setGraphs: (graphs: Array<GraphTS<NodeTS, LinkTS>>) => void;
	algorithm: IAlgorithmInformation;
}

const GraphRankingSelector: React.FC<GraphRankingSelectorProps> = ({ graphs, setGraphs, algorithm }) => {
	const [sortKey, setSortKey] = useState<SortKey>("none");

	useEffect(() => {
		if (sortKey === "none") return;

		// Determine if the graph is directed based on algorithm requirements.
		// This logic assumes there are no mixed graphs (have both directed and undirected edges).
		// It needs to be updated if mixed graphs are considered.
		const noDirectedEdge = algorithm.requirements.noDirectedEdge ?? false;
		const noUndirectedEdge = algorithm.requirements.noUndirectedEdge ?? false;
		const isDirected = !noDirectedEdge && noUndirectedEdge;

		const sorted = [...graphs].sort((a, b) => {
			const statsA = getGraphStats(a, isDirected);
			const statsB = getGraphStats(b, isDirected);
			return statsB[sortKey] - statsA[sortKey];
		});
		setGraphs(sorted);
	}, [sortKey]);

	return (
		<div className="form-control ml-auto w-full max-w-xs">
			<div className="mt-2 flex items-center justify-end space-x-2">
				<ArrowDownUp className="text-gray-500 " />
				<select
					id="sortKey"
					className="select select-ghost select-sm"
					value={sortKey}
					onChange={(e) => setSortKey(e.target.value as SortKey)}
				>
					<option value="none">Sort by: Featured</option>
					<option value="avgDegree">Sort by: Average Degree</option>
					<option value="numNodes">Sort by: Number of Nodes</option>
					<option value="numEdges">Sort by: Number of Edges</option>
					<option value="density">Sort by: Density</option>
				</select>
			</div>
		</div>
	);
};

export default GraphRankingSelector;
