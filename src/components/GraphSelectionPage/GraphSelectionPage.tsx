import React, { useEffect, useState } from "react";
import { AvailableAlgorithm, IAlgorithmInformation } from "../../utils/available-algorithms";
import GraphSelectionCategory from "./GraphSelectionCategory";
import GraphSelectionCard from "./GraphSelectionCard";
import GraphSelectionNewCard from "./GraphSelectionNewCard";
import { IGraphStorage } from "../../types/graph";
import GraphSelectionRandomCard from "./GraphSelectionRandomCard";
import { useNavigate } from "react-router-dom";
import { HandMetalIcon, Loader2 } from "lucide-react";
import { getAllGraphsFromStorage, removeGraphFromStorage } from "../../utils/graph-local-storage";
import GraphSelectionExampleGraphs from "./GraphSelectionExampleGraphs";
import GraphSelectionUploadCard from "./GraphSelectionUploadCard";

interface IGraphSelectionProps {
	algorithm?: IAlgorithmInformation;
}

function GraphSelectionPage({ algorithm }: IGraphSelectionProps): React.JSX.Element {
	// Asynchronously load graphs from storage
	const [graphsStorage, setGraphStorage] = useState<IGraphStorage[]>([]);
	const [loadingStorage, setLoadingStorage] = useState(true);

	useEffect(() => {
		setGraphStorage(getAllGraphsFromStorage());
		setLoadingStorage(false);
	}, []);

	const navigate = useNavigate();
	return (
		<div className="relative flex grow flex-col overflow-auto">
			<GraphSelectionCategory name="Create a new graph">
				<GraphSelectionNewCard algorithm={algorithm} />
				<GraphSelectionRandomCard algorithm={algorithm} />
				<GraphSelectionUploadCard algorithm={algorithm} />
			</GraphSelectionCategory>
			{algorithm !== undefined && <GraphSelectionExampleGraphs algorithm={algorithm} />}
			<GraphSelectionCategory name="Your own graphs">
				{graphsStorage
					.filter((graph) => algorithm === undefined || graph.restrictedToAlgorithm === algorithm?.name)
					.map((graph) => (
						<GraphSelectionCard
							key={graph.id}
							graph={graph}
							deletable={true}
							onClick={() => {
								if (
									graph.restrictedToAlgorithm !== undefined &&
									Object.keys(AvailableAlgorithm)
										.map((alg) => alg.toLowerCase())
										.includes(graph.restrictedToAlgorithm.toLowerCase())
								) {
									navigate(
										`/graph-builder/${graph.restrictedToAlgorithm.toLowerCase()}/?id=${graph.id}`
									);
								} else {
									navigate(`/graph-builder/?id=${graph.id}`);
								}
							}}
							onDelete={() => {
								setGraphStorage((prev) => prev.filter((g) => g.id !== graph.id));
								removeGraphFromStorage(graph.id);
							}}
						/>
					))}
				{graphsStorage.length === 0 && !loadingStorage && (
					<>
						<div className="absolute inset-0 flex min-h-[200px] w-full flex-col items-center justify-center gap-4">
							<HandMetalIcon className="size-16" />
							<p className="text-center">You don't have any own graphs yet.</p>
						</div>
						<div className="min-h-[200px]" />
					</>
				)}
				{loadingStorage && (
					<>
						<div className="absolute inset-0 flex min-h-[200px] w-full flex-col items-center justify-center gap-4">
							<Loader2 className="size-16 animate-spin" />
							<p className="text-center">Loading your graphs...</p>
						</div>
						<div className="min-h-[200px]" />
					</>
				)}
			</GraphSelectionCategory>
		</div>
	);
}

export default GraphSelectionPage;
