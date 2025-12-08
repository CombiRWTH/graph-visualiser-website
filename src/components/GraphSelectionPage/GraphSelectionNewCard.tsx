import React from "react";
import { IAlgorithmInformation } from "../../utils/available-algorithms";
import GraphSelectionCard from "./GraphSelectionCard";
import { PlusIcon } from "lucide-react";
import GraphSelectionAlgorithmDialog from "./GraphSelectionAlgorithmDialog";
import { useNavigate } from "react-router-dom";

interface IGraphSelectionNewCardProps {
	algorithm?: IAlgorithmInformation;
}

function GraphSelectionNewCard({ algorithm }: IGraphSelectionNewCardProps): React.JSX.Element {
	const navigate = useNavigate();

	function handleClick(algorithm?: IAlgorithmInformation | undefined): void {
		if (algorithm !== undefined) {
			navigate(`/graph-builder/${algorithm.name.toLowerCase()}`);
		} else {
			navigate("/graph-builder");
		}
	}

	if (algorithm !== undefined) {
		return (
			<GraphSelectionCard onClick={() => handleClick(algorithm)}>
				<div className="hidden h-full min-h-[200px] flex-col items-center justify-center gap-2 md:flex">
					<PlusIcon className="size-16" />
					<h3 className="text-1xl card-title font-normal">Build a new graph</h3>
				</div>
			</GraphSelectionCard>
		);
	}

	return (
		<GraphSelectionAlgorithmDialog
			includeNone={true}
			callbackFn={(algorithm) => {
				handleClick(algorithm);
			}}
			trigger={
				<GraphSelectionCard>
					<div className="hidden h-full min-h-[200px] flex-col items-center justify-center gap-2 md:flex">
						<PlusIcon className="size-16" />
						<h3 className="text-1xl card-title font-normal">Build a new graph</h3>
					</div>
				</GraphSelectionCard>
			}
		/>
	);
}

export default GraphSelectionNewCard;
