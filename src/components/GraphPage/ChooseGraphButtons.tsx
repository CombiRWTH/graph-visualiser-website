import React, { ChangeEvent, useState } from "react";
import { IAlgorithmStore, LayoutAlgorithm } from "../../algorithms/algorithm-interfaces";
import { IAlgorithmInformation } from "../../utils/available-algorithms";
import { capitalizeFirstLetters } from "../../utils/string-utils";
import { useNavigate } from "react-router-dom";

export interface IButtonProps {
	algorithm: IAlgorithmInformation;
}

/**
 * The buttons displayed above the graph visualizer on the GraphPage
 * @param algorithm The algorithm to use
 */
export const ChooseGraphButtons: React.FC<IButtonProps> = ({ algorithm }: IButtonProps) => {
	const navigate = useNavigate();

	const {
		isInitialized,
		visState,
		numberOfGraphs,
		getExampleGraph,
		applyLayout,
		layoutAlgorithm,
		setNewGraph,
		setLayoutAlgorithm,
	}: IAlgorithmStore = algorithm.useAlgorithmStore((state: IAlgorithmStore) => ({
		...state,
		visState: state.getVisState(),
	}));
	// Create a name for each available graph
	interface GraphName {
		id: number;
		name: string;
	}

	const graphList: GraphName[] = [];
	if (isInitialized) {
		for (let i = 0; i < numberOfGraphs; i++) {
			graphList.push({ id: i, name: "Graph " + i.toString() });
		}
	}

	// Initially, graph 0 is set as the selected graph
	if (visState === null && isInitialized) setNewGraph(getExampleGraph(0));
	const [layoutAlgorithmState, setLayoutAlgorithmState] = useState<LayoutAlgorithm>(layoutAlgorithm);

	return (
		<div className="join">
			<button
				className={`btn join-item btn-neutral`}
				onClick={() => navigate(`/graph-select/${algorithm?.name.toLowerCase()}/`)}
			>
				Select Another Graph
			</button>
			<button
				className={`btn join-item btn-neutral`}
				onClick={() => {
					setNewGraph(algorithm.getRandomGraph());
					applyLayout(layoutAlgorithmState);

					if (layoutAlgorithmState === LayoutAlgorithm.Free) {
						setLayoutAlgorithm(LayoutAlgorithm.Circle);
						setLayoutAlgorithmState(LayoutAlgorithm.Circle);
						applyLayout(LayoutAlgorithm.Circle);
					}
				}}
			>
				Random
			</button>
			<select
				value={layoutAlgorithm}
				className="join-item select select-bordered"
				onChange={(e: ChangeEvent<HTMLSelectElement>) => {
					const selectedValue = e.target.value as LayoutAlgorithm;
					setLayoutAlgorithmState(selectedValue);
					setLayoutAlgorithm(selectedValue);
					applyLayout(selectedValue);
				}}
			>
				{Object.keys(LayoutAlgorithm).map((key) => (
					<option
						key={key}
						value={key}
					>
						{capitalizeFirstLetters(key) + " Layout"}
					</option>
				))}
			</select>
		</div>
	);
};
