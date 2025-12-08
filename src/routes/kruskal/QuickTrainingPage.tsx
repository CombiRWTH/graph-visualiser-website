import MSTQuickTraining from "../../components/MSTQuickTraining";
import { AvailableAlgorithm, ITrainingPageProps } from "../../utils/available-algorithms";
import { useKruskalStore } from "../../algorithms/kruskal/store";

export const QuickTrainingPage: React.FC<ITrainingPageProps> = (props) => (
	<MSTQuickTraining
		{...props}
		useAlgorithmStore={useKruskalStore}
		getRandomGraph={AvailableAlgorithm.Kruskal.getRandomGraph}
	/>
);
