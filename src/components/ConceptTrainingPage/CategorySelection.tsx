import React, { useEffect, useState } from "react";
import { QuestionCategory } from "../../types/question-types";

interface CategorySelectionProps {
	onStart: (maxQuestions: number, selectedCategories: QuestionCategory[]) => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({ onStart }) => {
	const categories: QuestionCategory[] = Object.values(QuestionCategory) as QuestionCategory[];
	const numberOptions = [5, 10, 15, 20, 25, 30];
	const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([]);
	const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
	const [canHover, setCanHover] = useState(false);
	const [isDeselected, setIsDeselected] = useState(false);

	const categoryQuestions: Record<QuestionCategory, string> = {
		[QuestionCategory.EDGE_SET]:
			"What is the set E in the following graph G = (V, E), where V is the set of all vertices?",
		[QuestionCategory.VERTEX_COUNT]: "How many vertices does the following graph have?",
		[QuestionCategory.EDGE_COUNT]: "How many edges does the following graph have?",
		[QuestionCategory.TREE]: "Is the following graph a tree?",
		[QuestionCategory.INCIDENT_EDGES]: "What are the edges incident to a random vertex in this graph?",
		[QuestionCategory.CONNECTIVITY]: "Is the following graph connected?",
		[QuestionCategory.MAX_DEGREE]: "What is the maximum degree in the following graph?",
		[QuestionCategory.MOST_DEGREE]:
			"What degree appears most often in the following graph? If there are multiple, choose the smaller one.",
		[QuestionCategory.ADJACENT_VERTICES]: "What are the vertices adjacent to a random vertex in this graph?",
		[QuestionCategory.PATH]: "Which of these paths from a random start vertex to a random end vertex is correct?",
		[QuestionCategory.PERFECT_MATCHING]: "Which set is a perfect matching in the following graph?",
		[QuestionCategory.ARC_SET]:
			"What is the set A in the following digraph G = (V, A), where V is the set of all vertices?",
	};

	const toggleCategory = (category: QuestionCategory): void => {
		setSelectedCategories((prev) => {
			if (prev.includes(category)) {
				setIsDeselected(true);
				return prev.filter((c) => c !== category);
			} else {
				setIsDeselected(false);
				return [...prev, category];
			}
		});
	};

	useEffect(() => {
		if (typeof window !== "undefined") {
			const mql = window.matchMedia("(hover: hover)");
			const updateHover = (e: MediaQueryListEvent): void => setCanHover(e.matches);

			setCanHover(mql.matches);
			mql.addEventListener?.("change", updateHover);

			return () => mql.removeEventListener?.("change", updateHover);
		}
	}, []);

	const visibleNumberOptions = numberOptions.filter(
		(number) => number <= selectedCategories.length * 5 && selectedCategories.length <= number
	);

	useEffect(() => {
		if (selectedNumber !== null && !visibleNumberOptions.includes(selectedNumber)) {
			setSelectedNumber(null);
		}
	}, [selectedCategories, selectedNumber, visibleNumberOptions]);

	return (
		<div className="flex max-h-screen flex-col gap-7 overflow-auto px-10 pb-10 pt-20 text-center text-xl font-bold sm:text-2xl md:text-3xl">
			{!canHover && selectedCategories.length !== 0 && !isDeselected ? (
				<div className="card bg-secondary p-4 text-sm text-secondary-content sm:text-base md:text-lg">
					<span className="font-semibold">
						{categoryQuestions[selectedCategories[selectedCategories.length - 1]]}
					</span>
				</div>
			) : undefined}
			<p>Choose the categories that you want to train</p>

			<div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-4">
				{categories.map((category) => (
					<div
						key={category}
						className={canHover ? "tooltip-center tooltip tooltip-top" : undefined}
						data-tip={categoryQuestions[category]}
					>
						<button
							onClick={() => toggleCategory(category)}
							className={`${
								selectedCategories.includes(category) ? "btn btn-primary" : "btn btn-ghost"
							} min-w-[200px] text-xs sm:text-sm md:text-base`}
						>
							{category.replace("_", " ")}
						</button>
					</div>
				))}
			</div>

			{visibleNumberOptions.length > 0 && (
				<>
					<p>Select number of questions</p>
					<div className="flex flex-wrap justify-center gap-4 transition-all duration-300">
						{visibleNumberOptions.map((number) => (
							<button
								key={number}
								onClick={() => setSelectedNumber(number)}
								className={`btn ${
									selectedNumber === number ? "btn-primary" : "btn-ghost"
								} min-w-[200px] text-xs transition-all duration-200 sm:text-sm md:text-base`}
							>
								{number}
							</button>
						))}
					</div>
				</>
			)}

			<div className="flex justify-center">
				<button
					disabled={selectedCategories.length === 0 || selectedNumber === null}
					className="btn btn-primary min-w-[200px] text-xs sm:text-sm md:text-base"
					onClick={() => {
						if (selectedNumber !== null) onStart(selectedNumber, selectedCategories);
					}}
				>
					Start
				</button>
			</div>
		</div>
	);
};

export default CategorySelection;
