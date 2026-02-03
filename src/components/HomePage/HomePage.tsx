import React from "react";
import { AlgorithmCategory } from "../../utils/available-algorithms";
import GraphSelectionCard from "../GraphSelectionPage/GraphSelectionCard";
import { ShapesIcon, WorkflowIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CategoryCard } from "./CategoryCard";
import AppliedExamplesCard from "../AppliedExamples/AppliedExampleButton";
/**
 * Home page with vertically stacked categories and graph selection cards
 */
export const HomePage: React.FC = () => {
	const navigate = useNavigate();

	return (
		<div className="flex h-screen flex-col items-center gap-4 overflow-y-auto p-10">
			{/* Category Cards stacked vertically */}
			<div className="flex w-full flex-col gap-4">
				{Object.values(AlgorithmCategory).map((category) => (
					<CategoryCard
						key={category}
						category={category}
					/>
				))}
			</div>

			{/* Graph Builder / Concept Training stacked vertically */}
			{/* Graph concepts / builder / fun with mazes horizontally */}
			<div className="flex w-full flex-col gap-4  md:flex-row">
				<GraphSelectionCard
					onClick={() => navigate("/graph-concepts")}
					className="flex-1"
				>
					<div className="flex h-full flex-col items-center justify-center gap-2 p-4">
						<ShapesIcon className="hidden size-16 md:block" />
						<h3 className="text-center text-xl font-semibold md:block">Graph Concepts Training</h3>
					</div>
				</GraphSelectionCard>

				<GraphSelectionCard
					onClick={() => navigate("/graph-select")}
					className="flex-1"
				>
					<div className="flex h-full flex-col items-center justify-center gap-2 p-4">
						<WorkflowIcon className="hidden size-16 md:block" />
						<h3 className="text-center text-xl font-semibold md:block">Build a New Graph</h3>
					</div>
				</GraphSelectionCard>

				<AppliedExamplesCard />
			</div>
		</div>
	);
};
