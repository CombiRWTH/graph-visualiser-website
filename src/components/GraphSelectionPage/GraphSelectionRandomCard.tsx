import React from "react";
import { AvailableAlgorithm, IAlgorithmInformation } from "../../utils/available-algorithms";
import { useNavigate } from "react-router-dom";
import GraphSelectionCard from "./GraphSelectionCard";
import { ShuffleIcon } from "lucide-react";
import GraphSelectionAlgorithmDialog from "./GraphSelectionAlgorithmDialog";

interface IGraphSelectionRandomCardProps {
	algorithm?: IAlgorithmInformation;
}

function GraphSelectionRandomCard({ algorithm }: IGraphSelectionRandomCardProps): React.JSX.Element {
	// get random n to generate random graphs
	const navigate = useNavigate();

	const stores = Object.values(AvailableAlgorithm).map((alg) =>
		alg.useAlgorithmStore((state) => {
			return {
				...state,
				visState: state.getVisState(),
			};
		})
	);

	function handleClick(algorithm?: IAlgorithmInformation): void {
		if (algorithm !== undefined) {
			// generate random graph
			const graph = algorithm.getRandomGraph();
			const index = Object.values(AvailableAlgorithm).findIndex((alg) => alg.name === algorithm.name);
			stores[index].setNewGraph(graph);

			navigate(`/${algorithm.name.toLowerCase()}/graph`);
		}
	}

	if (algorithm !== undefined) {
		return (
			<GraphSelectionCard onClick={() => handleClick(algorithm)}>
				<div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2">
					<ShuffleIcon className="size-16" />
					<h3 className="text-1xl card-title font-normal">Generate a random graph</h3>
				</div>
			</GraphSelectionCard>
		);
	}

	return (
		<GraphSelectionAlgorithmDialog
			includeNone={false}
			callbackFn={(algorithm) => {
				handleClick(algorithm);
			}}
			trigger={
				<GraphSelectionCard>
					<div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2">
						<ShuffleIcon className="size-16" />
						<h3 className="text-1xl card-title font-normal">Generate a random graph</h3>
					</div>
				</GraphSelectionCard>
			}
		/>
	);
}

export default GraphSelectionRandomCard;
