import React from "react";
import { AlgorithmCategory } from "../../utils/available-algorithms";
import GraphSelectionCard from "../GraphSelectionPage/GraphSelectionCard";
import { ShapesIcon, WorkflowIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CategoryCard } from "./CategoryCard";
import AppliedExamplesCard from "../AppliedExamples/AppliedExampleButton";

/**
 * The home page component which will display all available algorithms, the graph builder and the concept training
 * as cards and routes to the respective pages
 */
export const HomePage: React.FC = () => {
	const navigate = useNavigate();

	return (
		<div className="box-border flex w-full flex-wrap justify-center gap-10 overflow-auto p-10">
			{Object.values(AlgorithmCategory).map((category) => (
				<CategoryCard
					key={category + "-card"}
					category={category}
				/>
			))}

			<div className="flex w-80 flex-col gap-4">
				<GraphSelectionCard
					onClick={() => {
						navigate("/graph-concepts");
					}}
					className="flex-1"
				>
					<div className="flex h-full flex-col items-center justify-center gap-2">
						<ShapesIcon className="hidden size-16 pt-1 md:block" />
						<h3 className="text-1xl card-title py-2 font-normal">
							{" "}
							<ShapesIcon className="size-10  md:hidden" /> Graph Concepts Training
						</h3>
					</div>
				</GraphSelectionCard>

				<GraphSelectionCard
					onClick={() => {
						navigate("/graph-select");
					}}
					className="flex-1"
				>
					<div className="flex h-full flex-col items-center justify-center gap-2">
						<WorkflowIcon className="hidden size-16 pt-1 md:block" />
						<h3 className="text-1xl card-title hidden py-2 font-normal md:block">
							{" "}
							<WorkflowIcon className="size-10 md:hidden" />
							Build a new graph
						</h3>
					</div>
				</GraphSelectionCard>

				<AppliedExamplesCard />
			</div>
		</div>
	);
};
