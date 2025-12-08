import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Context } from "chartjs-plugin-datalabels/types/context";
import { getDaisyuiColor, ThemeColor } from "../../utils/daisyui-colors";
import { QuestionEvaluation } from "../../types/question-types";
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface FeedbackProps {
	correctAnswers: number;
	maxQuestions: number;
	questionEvaluation: QuestionEvaluation[];
}

const Feedback: React.FC<FeedbackProps> = ({ correctAnswers, maxQuestions, questionEvaluation }) => {
	const colorBaseContent = getDaisyuiColor(ThemeColor.BASE_CONTENT);
	const colorSuccess = getDaisyuiColor(ThemeColor.SUCCESS);
	const colorError = getDaisyuiColor(ThemeColor.ERROR);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	function chunk<T>(arr: T[], size: number): T[][] {
		const result: T[][] = [];
		for (let i = 0; i < arr.length; i += size) {
			result.push(arr.slice(i, i + size));
		}
		return result;
	}

	const categoryStats = questionEvaluation.reduce<Record<string, { correct: number; wrong: number }>>(
		(acc, { category, isCorrect }) => {
			if (acc[category] === undefined) {
				acc[category] = { correct: 0, wrong: 0 };
			}
			isCorrect ? acc[category].correct++ : acc[category].wrong++;
			return acc;
		},
		{}
	);

	const chartData = Object.entries(categoryStats).map(([category, stats]) => ({
		name: category,
		labels: ["Correct", "Wrong"],
		datasets: [
			{
				label: `Answers in ${category}`,
				data: [stats.correct, stats.wrong],
				backgroundColor: [colorSuccess, colorError],
				borderColor: [colorSuccess, colorError],
				borderWidth: 1,
			},
		],
	}));

	const weakCategories = Object.entries(categoryStats)
		.filter(([_, stats]) => {
			const total = stats.correct + stats.wrong;
			const ratio = stats.correct / total;
			return ratio < 0.5;
		})
		.map(([category]) => category);

	const options = {
		responsive: true,
		plugins: {
			tooltip: {
				enabled: false,
			},
			legend: {
				labels: {
					color: colorBaseContent,
					font: {
						size: windowWidth < 640 ? 14 : windowWidth < 768 ? 17 : 20,
					},
				},
			},
			datalabels: {
				color: "#000000",
				font: {
					size: windowWidth < 640 ? 14 : windowWidth < 768 ? 17 : 20,
					weight: "bold" as const,
				},
				display: (context: Context) => {
					const data = context.dataset.data as number[];
					return data[context.dataIndex] > 0;
				},
			},
		},
	};

	useEffect(() => {
		const handleResize = (): void => setWindowWidth(window.innerWidth);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<div className="flex max-h-screen flex-col items-center overflow-auto p-5 text-center">
			<p className="text-2xl font-bold sm:text-3xl md:text-4xl">Quiz completed!</p>

			{chunk(chartData, 4).map((row, rowIndex) => (
				<div
					key={rowIndex}
					className="flex flex-wrap justify-center gap-8 p-5"
				>
					{row.map((data) => (
						<div key={data.name}>
							<p className="text-md text-center font-bold sm:text-lg md:text-xl">{data.name}</p>
							<div className="relative aspect-square h-48 w-full sm:h-56 md:h-64">
								<Doughnut
									data={data}
									options={options}
								/>
							</div>
						</div>
					))}
				</div>
			))}

			<p className="pt-10 text-lg font-semibold sm:text-2xl md:text-3xl">
				Your overall score is <span className="font-bold">{correctAnswers}</span> out of{" "}
				<span className="font-bold">{maxQuestions}</span>!
			</p>

			<div className="pt-5 text-lg font-semibold sm:text-2xl md:text-3xl">
				{weakCategories.length > 0 ? (
					<p>
						Maybe you should take another look at the following
						{chartData.length === 1 ? " category" : " categories"}
						{": "}
						<span className="font-bold">{weakCategories.join(", ")}</span>
					</p>
				) : (
					<p>
						Well done, it seems like you have understood
						{chartData.length === 1 ? " this category!" : " all these categories!"}
					</p>
				)}
			</div>
		</div>
	);
};

export default Feedback;
