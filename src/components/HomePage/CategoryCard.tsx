import { AlgorithmCategory, AvailableAlgorithm } from "../../utils/available-algorithms";
import { ReactElement } from "react";
import { AlgorithmCard } from "./AlgorithmCard";

interface CategoryCardProps {
	category: AlgorithmCategory;
}

const imagePaths: Record<AlgorithmCategory, string> = {
	[AlgorithmCategory.SHORTEST_PATH]: `${import.meta.env.BASE_URL}images/shortest_path.png`,
	[AlgorithmCategory.MINIMUM_SPANNING_TREE]: `${import.meta.env.BASE_URL}images/minimum_spanning_tree.png`,
	[AlgorithmCategory.HAMILTON_CYCLE]: `${import.meta.env.BASE_URL}images/christofides.png`,
	[AlgorithmCategory.MAX_FLOW]: `${import.meta.env.BASE_URL}images/max_flow.png`,
};
export function CategoryCard({ category }: CategoryCardProps): ReactElement {
	return (
		<div className="card w-80 bg-base-300 text-base-content shadow-sm">
			<div className="hidden lg:block">
				<figure className="p-2">
					<img
						src={imagePaths[category] ?? `${import.meta.env.BASE_URL}images/shortest_path.png`}
						alt="An Example Graph Image"
						className="h-46 w-auto"
					/>
				</figure>
			</div>
			<div className="card-body">
				<div className="divider text-lg font-semibold">{category}</div>
				<div className="grid w-full gap-4 lg:py-4">
					{Object.values(AvailableAlgorithm)
						.filter((algorithm) => algorithm.category === category)
						.map((algorithm) => (
							<AlgorithmCard
								key={algorithm.name + "-card"}
								algorithm={algorithm}
							/>
						))}
				</div>
			</div>
		</div>
	);
}
