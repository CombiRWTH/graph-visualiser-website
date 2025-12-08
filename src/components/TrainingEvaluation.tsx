import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useTrainingStagesStore } from "../hooks/TrainingStagesStore";
import React from "react";
import { getDaisyuiColor, ThemeColor } from "../utils/daisyui-colors";

ChartJS.register(ArcElement, Tooltip, Legend);

export const TrainingEvaluation: React.FC = () => {
	const { getStageList } = useTrainingStagesStore();

	const colorBaseContent = getDaisyuiColor(ThemeColor.BASE_CONTENT);
	const colorSuccess = getDaisyuiColor(ThemeColor.SUCCESS);
	const colorError = getDaisyuiColor(ThemeColor.ERROR);

	const newStages = getStageList().filter((stage) => stage.answers !== undefined && stage.wrongAnswers !== undefined);
	const datas = newStages?.map((stage) => ({
		name: stage.shortTitle,
		labels: ["Correct", "Wrong"],
		datasets: [
			{
				label: "# of Answers in " + stage.shortTitle!,
				data: [stage.answers! - stage.wrongAnswers!, stage.wrongAnswers],
				backgroundColor: [colorSuccess, colorError],
				borderColor: [colorSuccess, colorError],
				borderWidth: 1,
			},
		],
	}));

	const options = {
		plugins: {
			legend: {
				labels: {
					color: colorBaseContent,
					font: {
						size: 20,
					},
				},
			},
		},
	};

	return (
		<ul
			className={`grid size-full max-h-full max-w-[70%] grid-cols-1 items-center justify-center max-sm:w-1/2 sm:grid-cols-2 ${datas?.length < 2 ? "sm:max-w-[35%] sm:!grid-cols-1" : ""}`}
		>
			{datas?.map((data, index) => (
				<li
					key={index}
					className={"size-full"}
				>
					<h3 className="md:text-l p-2 text-center text-sm font-bold sm:text-base lg:text-xl xl:text-2xl">
						{data.name}
					</h3>
					<Doughnut
						data={data}
						options={options}
					/>
				</li>
			))}
		</ul>
	);
};
