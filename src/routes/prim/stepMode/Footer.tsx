import { UseFormSetValue, UseFormWatch } from "react-hook-form";
import { FormValues, AlgorithmStages } from "../StepTrainingPage";
import {
	TrainingFormAddEdgeButton,
	TrainingFormResultButton,
	TrainingFormTerminateButton,
} from "../../../components/TrainingFormButtons";
import { useTrainingStagesStore } from "../../../hooks/TrainingStagesStore";

interface FooterProps {
	isTrainingCompleted: boolean;
	setValue: UseFormSetValue<FormValues>;
	watch: UseFormWatch<FormValues>;
}

export const Footer: React.FC<FooterProps> = ({ isTrainingCompleted, setValue, watch }) => {
	const { setCurrentStage } = useTrainingStagesStore();
	const isAddEdgeButtonDisabled = watch("edge.node1") === "-" || watch("edge.node2") === "-";

	return (
		<>
			{isTrainingCompleted ? (
				<TrainingFormResultButton onClick={() => setCurrentStage(AlgorithmStages.Results)} />
			) : (
				<>
					<TrainingFormAddEdgeButton
						onClick={() => setValue("action", "addEdge")}
						disabled={isAddEdgeButtonDisabled}
						type="submit"
					/>

					<TrainingFormTerminateButton
						onClick={() => setValue("action", "done")}
						type="submit"
					/>
				</>
			)}
		</>
	);
};
