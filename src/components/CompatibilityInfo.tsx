import React from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toggleModal } from "./Modal";
import { IAlgorithmStore } from "../algorithms/algorithm-interfaces";
import { GraphTS } from "../utils/graphs";
import { LinkTS, NodeTS } from "../algorithms/adapter";

interface CompatibilityInfoProps {
	name: string;
	compatible: () => boolean;
	messages: string[];
	useAlgorithmStore: (fn: (state: IAlgorithmStore) => IAlgorithmStore) => IAlgorithmStore;
	graph?: GraphTS<NodeTS, LinkTS>;
}

/**
Provides a modal which appears when you click on Run a different algorithm on this graph on a GraphPage. It indicates which algorithms are compatible with the current graph.
Depending on whether an algorithm is compatible (compatible = true), a different design is applied.
 */
export const CompatibilityInfo: React.FC<CompatibilityInfoProps> = ({
	name,
	compatible,
	messages,
	useAlgorithmStore,
	graph,
}: CompatibilityInfoProps) => {
	const navigate = useNavigate();
	const { setNewGraph } = useAlgorithmStore((state) => ({ ...state }));
	return compatible() ? (
		<div className="flex w-full flex-row items-center justify-between rounded-full bg-base-300 p-2">
			<h1 className="pl-[1em] font-bold capitalize">{name}</h1>
			<button
				className="btn btn-success btn-md rounded-full text-primary-content"
				onClick={() => {
					toggleModal("algorithm-list-modal"); // Close the modal
					if (graph !== undefined) {
						setNewGraph(graph);
					}
					navigate(`/${name}/graph`);
				}}
			>
				<ArrowRight />
			</button>
		</div>
	) : (
		<div
			tabIndex={0}
			className="collapse w-full rounded-[2em] bg-base-300 p-2"
		>
			<div className="collapse-title flex min-h-0 flex-row items-center justify-between p-0 pl-[1em] font-bold capitalize">
				{name}
				<button className="btn btn-disabled btn-md pointer-events-none rounded-full text-warning">
					<TriangleAlert />
				</button>
			</div>
			<div className="collapse-content">
				{messages.map((m) => (
					<p
						key={"info" + m + name}
						className="font-medium text-warning"
					>
						{m}
					</p>
				))}
			</div>
		</div>
	);
};
