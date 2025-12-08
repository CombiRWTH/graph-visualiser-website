import { ReactElement, useEffect, useState } from "react";

interface ResultHighlighting<T> {
	isHighlightingResults: boolean;
	correctOption: T;
}

interface ButtonToggleProps<T extends string | number | undefined> {
	options: T[];
	onChange: (option: T) => void;
	selected?: T;
	resultHighlighting?: ResultHighlighting<T>;
	disabled?: boolean;
	hideMarker?: boolean;
}

export const ButtonToggle = <T extends string | number | undefined>({
	options,
	onChange,
	selected,
	resultHighlighting,
	disabled,
	hideMarker,
}: ButtonToggleProps<T>): ReactElement => {
	const [selectedIndex, setSelectedIndex] = useState<number>();

	const isHighlightingResults = resultHighlighting?.isHighlightingResults ?? false;
	const isDisabled: boolean = (disabled ?? false) || isHighlightingResults;

	useEffect(() => {
		const index = options.findIndex((option) => option === selected);

		if (index < 0) return setSelectedIndex(undefined);

		setSelectedIndex(index);
	}, [selected]);

	const handleClick = (index: number): void => {
		setSelectedIndex(index);
		onChange(options[index]);
	};

	const getBtnModifier = (option: T, index: number): string => {
		const isSelected = index === selectedIndex;

		if (hideMarker ?? false) return "btn-neutral";
		if (isHighlightingResults) {
			const isCorrectOption = option === resultHighlighting?.correctOption;

			if (isCorrectOption) return "btn-success";
			if (isSelected) return "btn-error";
		}
		if (isSelected) return "btn-primary";

		return "btn-neutral";
	};

	return (
		<div className="card mx-auto flex size-full min-w-fit flex-1 flex-row justify-between gap-1 bg-base-300 shadow-2xl md:gap-4">
			{options.map((option, index) => (
				<button
					key={index}
					onClick={() => handleClick(index)}
					type="button"
					className={`sm:btn-base md:text-md btn btn-sm grow text-xs lg:btn-md ${getBtnModifier(option, index)} ${isDisabled ? "pointer-events-none" : ""}`}
				>
					{option}
				</button>
			))}
		</div>
	);
};
