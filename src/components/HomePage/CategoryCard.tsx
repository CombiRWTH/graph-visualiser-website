import { AlgorithmCategory, AvailableAlgorithm } from "../../utils/available-algorithms";
import { useState, ReactElement } from "react";
import { AlgorithmCard } from "./AlgorithmCard";
import { ChevronDown } from "lucide-react";

interface CategoryCardProps {
	category: AlgorithmCategory;
}

const imagePaths: Record<AlgorithmCategory, string> = {
	[AlgorithmCategory.SHORTEST_PATH]: `${import.meta.env.BASE_URL}images/shortest_path.png`,
	[AlgorithmCategory.MINIMUM_SPANNING_TREE]: `${import.meta.env.BASE_URL}images/minimum_spanning_tree.png`,
	[AlgorithmCategory.HAMILTON_CYCLE]: `${import.meta.env.BASE_URL}images/christofides.png`,
	[AlgorithmCategory.MAX_FLOW]: `${import.meta.env.BASE_URL}images/max_flow.png`,
	[AlgorithmCategory.MAX_MATCHING]: `${import.meta.env.BASE_URL}images/matching.png`,
};

const explainerTexts: Record<AlgorithmCategory, string> = {
	[AlgorithmCategory.SHORTEST_PATH]:
		"Services like Open Street Maps or Google Maps help us find the quickes way from one place to another. But how do they actually do that? The Shortest Path problem asks: given one point in directed graph, what is the shortest path to get to any other point?",
	[AlgorithmCategory.MINIMUM_SPANNING_TREE]:
		"In a desert kingdom, seven oases are linked by trade routes damaged by wind and sun. Repairing every route is expensive and unnecessary. We only need enough roads to reach every oasis from any other. The challenge is deciding which roads to renovate. This is the Minimum Spanning Tree problem: finding the cheapest network that connects all points without forming cycles.",
	[AlgorithmCategory.HAMILTON_CYCLE]:
		"Imagine a traveler who wants to visit every city exactly once and return to the starting point, covering all destinations without repetition. In a graph, such a cycle is called a Hamiltonian Cycle. A fundamental challenge in graph algorithms is the Travelling Salesperson Problem: finding not just any such cycle, but the shortest one.",
	[AlgorithmCategory.MAX_FLOW]:
		"Imagine transporting goods from a warehouse to a store through a network of roads, each with its own capacity. The question is: How much can we send at once and how much should we send along each road? The Maximum Flow problem models this situation (and similar ones) using a directed graph, with edges representing the roads and their capacities. A source and a target node is selected to represent the warehouse and the store, and the maximum flow from source to target is calculated.",
	[AlgorithmCategory.MAX_MATCHING]:
		"Many real-world problems involve pairing elements efficiently: workers to jobs, student tandems, marriages,... . The Maximum Matching problem asks: What is the largest set of pairs we can form in a graph, so that no node appears in more than one pair?",
};

export function CategoryCard({ category }: CategoryCardProps): ReactElement {
	const [expanded, setExpanded] = useState(false);

	const algorithms = Object.values(AvailableAlgorithm).filter((a) => a.category === category);

	return (
		<div
			className="card w-full cursor-pointer overflow-hidden bg-base-300 text-base-content shadow-md transition-all hover:shadow-lg"
			onClick={() => setExpanded(!expanded)}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-4">
				<h2 className="text-xl font-bold">{category}</h2>
				<ChevronDown
					className={`transition-transform ${expanded ? "rotate-180" : ""}`}
					size={24}
				/>
			</div>

			{/* Expandable content */}
			<div
				className={`transition-max-height overflow-hidden duration-300 ease-in-out ${
					expanded ? "max-h-screen" : "max-h-0"
				}`}
			>
				<div className="flex flex-col px-4 lg:flex-row-reverse">
					{/* Image on the right */}
					<div className="w-full shrink-0 px-20 lg:w-1/3">
						<img
							src={imagePaths[category]}
							alt={`${category} illustration`}
							className="w-full rounded-lg object-cover shadow-sm"
						/>
					</div>

					{/* Text + Algorithms */}
					<div className="flex flex-1 flex-col gap-4">
						<p className="text-base text-base-content/80 md:text-lg">{explainerTexts[category]}</p>

						{/* Section title */}
						<h4 className="text-md font-semibold uppercase tracking-wide text-base-content/70">
							Available Algorithms
						</h4>

						{/* Algorithms grid */}
						<div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
							{algorithms.map((algorithm) => (
								<AlgorithmCard
									key={algorithm.name}
									algorithm={algorithm}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
