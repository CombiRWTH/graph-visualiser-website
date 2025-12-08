import React, { ReactElement, useEffect } from "react";
import { useAutoStepper } from "../../hooks/AutoStepper";
import { IAlgorithmStore } from "../../algorithms/algorithm-interfaces";
import { ChevronDown, ChevronUp, CirclePause, PlayCircle, SkipBack, SkipForward, Square } from "lucide-react";

interface ControllerProps {
	useAlgorithmStore: (fn: (state: IAlgorithmStore) => Partial<IAlgorithmStore>) => IAlgorithmStore;

	className?: string;
	currentLine?: number;
	viewVariablesChecked?: boolean;
	onViewVariablesChange?: React.Dispatch<React.SetStateAction<boolean>>;
	classNameViewVariables?: string;
}

export const Controller: React.FC<ControllerProps> = ({
	useAlgorithmStore,
	className = "",
	currentLine,
	viewVariablesChecked = false,
	onViewVariablesChange,
	classNameViewVariables = "",
}: ControllerProps) => {
	const { nextStep, resetGraph, isInitialized, prevStep }: IAlgorithmStore = useAlgorithmStore(
		(state: IAlgorithmStore) => ({
			nextStep: state.nextStep,
			resetGraph: state.resetGraph,
			isInitialized: state.isInitialized,
			prevStep: state.prevStep,
		})
	);
	if (!isInitialized) return null;
	const { play, pause, changeFreq, playing } = useAutoStepper(nextStep);
	const frequencies: number[] = [1500, 1000, 500, 200];

	const [currentFreq, setCurrentFreq] = React.useState(1);
	function handlePlay(): void {
		if (!playing) {
			play();
		}
	}

	useEffect(() => {
		changeFreq(frequencies[currentFreq]);
	}, []);

	useEffect(() => {
		if (currentLine === undefined && playing) {
			pause();
		}
	}, [currentLine]);

	function handleFrequencyButton(): void {
		changeFreq(frequencies[(currentFreq + 1) % frequencies.length]);
		setCurrentFreq((currentFreq + 1) % frequencies.length);
	}

	function renderButton(
		action: () => void,
		icon: React.ReactNode,
		tooltip: string,
		className?: string
	): ReactElement {
		return (
			<div
				className="join-item lg:tooltip lg:tooltip-top lg:tooltip-info"
				data-tip={tooltip}
			>
				<button
					className={`btn btn-ghost rounded-none ${className ?? ""}`}
					onClick={action}
				>
					{icon}
				</button>
			</div>
		);
	}

	return (
		<div className={`flex bg-primary text-primary-content ${className ?? ""}`}>
			<div className="join flex grow justify-center">
				{renderButton(handleFrequencyButton, <p>{currentFreq + 1}x</p>, "Speed", "w-14")}
				{renderButton(prevStep, <SkipBack />, "Previous")}
				{playing
					? renderButton(pause, <CirclePause />, "Pause")
					: renderButton(handlePlay, <PlayCircle />, "Play")}
				{renderButton(nextStep, <SkipForward />, "Next")}
				{renderButton(
					() => {
						pause();
						resetGraph();
					},
					<Square />,
					"Reset",
					"hover:bg-error hover:text-error-content"
				)}
			</div>

			<button
				onClick={() => onViewVariablesChange?.(!viewVariablesChecked)}
				className={`btn btn-ghost hidden rounded-none sm:flex ${classNameViewVariables ?? ""}`}
			>
				Display variables {viewVariablesChecked ? <ChevronDown /> : <ChevronUp />}
			</button>
		</div>
	);
};
