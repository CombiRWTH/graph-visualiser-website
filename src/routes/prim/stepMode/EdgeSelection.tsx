import { Control, Controller } from "react-hook-form";
import { FormValues } from "../StepTrainingPage";
import { usePrimStore } from "../../../algorithms/prim/store";
import { ButtonToggle } from "../../../components/ButtonToggle";

interface EdgeSelectionProps {
	control: Control<FormValues>;
	isDisabled: boolean;
}

export const EdgeSelection: React.FC<EdgeSelectionProps> = ({ isDisabled, control }) => {
	const { initialGraph } = usePrimStore((state) => ({ ...state }));
	const nodeNames: string[] = initialGraph.nodes.map((node) => node.name ?? "unnamed");

	return (
		<span>
			<span className="font-bold">{`Edge:`}</span>
			<Controller
				control={control}
				name={"edge.node1"}
				render={({ field: { onChange, value } }) => (
					<ButtonToggle<string>
						options={["-"].concat(nodeNames)}
						onChange={onChange}
						selected={value}
						disabled={isDisabled}
					/>
				)}
			/>
			<Controller
				control={control}
				name={"edge.node2"}
				render={({ field: { onChange, value } }) => (
					<ButtonToggle<string>
						options={["-"].concat(nodeNames)}
						onChange={onChange}
						selected={value}
						disabled={isDisabled}
					/>
				)}
			/>
		</span>
	);
};
