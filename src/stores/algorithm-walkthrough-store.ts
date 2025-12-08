import { create } from "zustand";

interface WalkthroughState {
	showAlgoWalkthrough: boolean;
	setShowAlgoWalkthrough: (value: boolean) => void;
	resetAlgoWalkthrough: () => void;
}

export const useWalkthroughStore = create<WalkthroughState>((set) => ({
	showAlgoWalkthrough: true,
	setShowAlgoWalkthrough: (value: boolean) => set({ showAlgoWalkthrough: value }),
	resetAlgoWalkthrough: () => set({ showAlgoWalkthrough: true }),
}));
