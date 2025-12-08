import React, { useState, JSX } from "react";
import Joyride, { CallBackProps, STATUS, Placement, Step } from "react-joyride";
import { getDaisyuiColor, ThemeColor } from "../../utils/daisyui-colors";

const getSteps = (algorithmName: string): Step[] => {
	const baseSteps: Step[] = [
		{
			target: ".graph-splitview",
			placement: "bottom",
			content: (
				<div className="text-lg font-semibold">
					👋 Hi there! First time using the <strong>Algorithm Visualizer</strong>?<br />
					Let's take a quick tour!
				</div>
			),
		},
		{
			target: ".graph-card",
			content: (
				<div>
					This is your <strong>main graph view</strong>. <br />
					You can <strong>interact</strong> with the <strong>nodes and edges</strong> here.
					{algorithmName === "Dijkstra" ||
						(algorithmName === "Moore-Bellman-Ford" && (
							<>
								<br />
								Try <strong>clicking a node</strong> to set it as the <strong>start node</strong>.
							</>
						))}
				</div>
			),
		},
		{
			target: ".graph-info-panel",
			content: (
				<div>
					This is the <strong>code viewer</strong>.<br />
					It shows the algorithm's <strong>pseudo code</strong> and highlights the{" "}
					<strong>current line</strong> being executed.
				</div>
			),
		},
		{
			target: ".controller",
			content: (
				<div>
					Use these <strong>control buttons</strong> to step through or reset the algorithm execution.
				</div>
			),
		},
		{
			target: ".view-variables",
			content: (
				<div>
					You can view <strong>run-time variables</strong> here. Toggle the checkbox to inspect what's
					happening behind the scenes.
				</div>
			),
		},
		{
			target: ".help-text",
			content: (
				<div>
					Need help with the algorithm? Click here for a more <strong>verbal explanation</strong> of the
					current step.
				</div>
			),
		},
		{
			target: ".download-graph",
			content: (
				<div>
					Want to keep your progress? <strong>Download the current graph state</strong> using this option.
				</div>
			),
		},
		{
			target: ".graph-splitview", // reuse a visible area
			placement: "center" as Placement,
			content: (
				<div className="text-center text-lg font-semibold">
					🎉 That’s the end of the tour! <br />
					You’re now ready to explore the <strong>Algorithm Visualizer</strong>.<br />
					Have fun experimenting!
				</div>
			),
		},
	];
	return baseSteps;
};

export const AlgorithmPageWalkthroughGuide = ({ algorithmName }: { algorithmName: string }): JSX.Element => {
	const [run, setRun] = useState(true);
	const steps = getSteps(algorithmName);

	const handleCallback = (data: CallBackProps): void => {
		const finished = [STATUS.FINISHED, STATUS.SKIPPED].includes(data.status as "finished" | "skipped");
		if (finished) setRun(false);
	};

	return (
		<Joyride
			steps={steps}
			run={run}
			continuous
			scrollToFirstStep
			showProgress
			showSkipButton
			callback={handleCallback}
			disableScrolling={true}
			spotlightClicks={true}
			styles={{
				options: {
					zIndex: 10000,
					arrowColor: getDaisyuiColor(ThemeColor.SECONDARY),
					backgroundColor: getDaisyuiColor(ThemeColor.SECONDARY),
					overlayColor: "rgba(0, 2, 5, 0.4)",
					primaryColor: getDaisyuiColor(ThemeColor.SECONDARY),
					textColor: getDaisyuiColor(ThemeColor.SECONDARY_CONTENT),
					width: 400,
				},
				tooltipContainer: {
					padding: "1.5rem",
				},
				buttonNext: {
					backgroundColor: getDaisyuiColor(ThemeColor.SECONDARY_FOCUS),
					color: getDaisyuiColor(ThemeColor.SECONDARY_CONTENT),
					fontWeight: "bold",
				},
				buttonBack: {
					color: getDaisyuiColor(ThemeColor.SECONDARY_CONTENT),
				},
				buttonClose: {
					color: getDaisyuiColor(ThemeColor.SECONDARY_CONTENT),
				},
			}}
		/>
	);
};
