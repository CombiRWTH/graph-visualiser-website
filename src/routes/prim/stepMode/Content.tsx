import { Control } from "react-hook-form";
import { FormValues } from "../StepTrainingPage";
import { usePrimStore } from "../../../algorithms/prim/store";
import { EdgeSelection } from "./EdgeSelection";

interface ContentProps {
	isDisabled: boolean;
	control: Control<FormValues>;
}

export const Content: React.FC<ContentProps> = ({ isDisabled, control }) => {
	const { getVisState } = usePrimStore((state) => ({ ...state }));
	const startNode: number = getVisState()?.startNode ?? 0;

	return (
		<div className="flex flex-col gap-y-2 p-2">
			<span className="mb-4 italic">Start node: {startNode}</span>
			<EdgeSelection
				isDisabled={isDisabled}
				control={control}
			/>
		</div>
	);
};
