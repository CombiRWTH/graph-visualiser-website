import MSTQuickTraining from "../../components/MSTQuickTraining";
import { AvailableAlgorithm, ITrainingPageProps } from "../../utils/available-algorithms";
import { usePrimStore } from "../../algorithms/prim/store";

export const QuickTrainingPage: React.FC<ITrainingPageProps> = (props) => (
	<MSTQuickTraining
		{...props}
		useAlgorithmStore={usePrimStore}
		getRandomGraph={AvailableAlgorithm.Prim.getRandomGraph}
	/>
);
