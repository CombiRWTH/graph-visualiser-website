import { create } from "zustand";

export interface TrainingStage {
	stageId: number;
	shortTitle?: string; // to reference the algorithm stages
	title: string; // title in header
	info?: string; // for info modal
	wrongAnswers?: number;
	answers?: number;
}

// Define the type for the combined state object
interface TrainingStagesStore {
	currentStage: number;
	stageList: TrainingStage[];
	resetStages: () => void;
	getStageList: () => TrainingStage[];
	setStageList: (stageList: TrainingStage[]) => void;
	getCurrentStage: () => TrainingStage | undefined;
	setCurrentStage: (id: number) => void;
	nextStage: () => boolean;
	getStage: (id: number) => TrainingStage | undefined;
	increaseWrongAnswersBy: (amount: number) => void;
	increaseTotalAnswersBy: (amount: number) => void;
}

export const useTrainingStagesStore = create<TrainingStagesStore>((set, get) => ({
	currentStage: 0,
	stageList: [],
	resetStages: () => {
		get().setStageList([]);
	},
	getStageList: () => get().stageList,
	setStageList: (stageList: TrainingStage[]) => {
		set(() => ({ currentStage: 0, stageList }));
	},
	getCurrentStage: () => get().stageList.find((stage) => get().currentStage === stage.stageId),
	setCurrentStage: (id: number) => {
		set((stages) => ({ ...stages, currentStage: id }));
	},
	nextStage: () => {
		const nextId: number = (get().currentStage + 1) % get().stageList.length;
		if (get().stageList.find((stage) => nextId === stage.stageId) !== undefined) {
			get().setCurrentStage(nextId);
			return true;
		}
		return false;
	},
	getStage: (id: number) => get().stageList.find((stage) => id === stage.stageId),
	increaseWrongAnswersBy: (amount: number): void => {
		get().getCurrentStage()!.wrongAnswers! += amount;
	},
	increaseTotalAnswersBy: (amount: number): void => {
		get().getCurrentStage()!.answers! += amount;
	},
}));
