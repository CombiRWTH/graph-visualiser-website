import { NumberOrInfinity, ReducedNodeState } from "./types";
import { ButtonToggle } from "../../components/ButtonToggle";
import { ModalToggle } from "../../components/Modal";
import { HelpCircle } from "lucide-react";

interface DistanceUpdateTableProps {
	nodeList: ReducedNodeState[];
	updateDist: (updateId: number, newDist: NumberOrInfinity) => void;
	updateDistOptions: { [id: number]: NumberOrInfinity[] };
	isShowingResults: boolean;
	modalId: string;
}

// returns a HTML component used in dijkstra quick mode and the distance update phase of step mode to record user input
export const DistanceUpdateTable: React.FC<DistanceUpdateTableProps> = ({
	nodeList,
	updateDist,
	updateDistOptions,
	isShowingResults,
	modalId,
}) => {
	return (
		<div className="flex w-11/12 flex-col gap-2 md:gap-4">
			{nodeList.map((node) => (
				<div
					key={"wrapper" + node.id.toString()}
					className="flex flex-row gap-2 max-lg:items-center lg:flex-col"
				>
					<h1 className="md:text-md min-w-16 text-sm font-bold lg:ml-14">{`Vertex ${node.id}`}</h1>

					<div className="flex w-full items-center justify-between gap-4">
						{/* counterpart to the badge */}
						<div className="hidden w-10 lg:block" />
						<ButtonToggle
							options={updateDistOptions[node.id]}
							onChange={(option) => updateDist(node.id, option)}
							selected={node.distInput}
							resultHighlighting={{
								isHighlightingResults: isShowingResults,
								correctOption: node.distSolution,
							}}
						/>
						{isShowingResults && node.distInput !== node.distSolution ? (
							<ModalToggle
								id={modalId + "-" + node.id.toString()}
								className="flex flex-row items-center"
							>
								<div className="w-10 cursor-pointer hover:text-primary">
									<HelpCircle />
								</div>
							</ModalToggle>
						) : (
							<div className="w-10" />
						)}
					</div>
				</div>
			))}
		</div>
	);
};
