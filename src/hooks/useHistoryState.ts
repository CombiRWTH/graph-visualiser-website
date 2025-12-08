import { useCallback, useReducer, useRef } from "react";
import { deepEqual } from "../utils/deep-equal";

const initialUseHistoryStateState = {
	past: [],
	present: null,
	future: [],
};

export function useHistoryState(initialPresent: object = {}): {
	state: object;
	set: (newPresent: object) => void;
	undo: () => void;
	redo: () => void;
	clear: () => void;
	canUndo: boolean;
	canRedo: boolean;
} {
	const initialPresentRef = useRef(initialPresent);

	const [state, dispatch] = useReducer(useHistoryStateReducer, {
		...initialUseHistoryStateState,
		present: initialPresentRef.current,
	});

	const canUndo = state.past.length !== 0;
	const canRedo = state.future.length !== 0;

	const undo = useCallback(() => {
		if (canUndo) {
			dispatch({ type: "UNDO" });
		}
	}, [canUndo]);

	const redo = useCallback(() => {
		if (canRedo) {
			dispatch({ type: "REDO" });
		}
	}, [canRedo]);

	const set = useCallback(
		(newPresent: object) => {
			dispatch({ type: "SET", newPresent });
		},
		[state.present]
	);

	const clear = useCallback(() => dispatch({ type: "CLEAR", initialPresent: initialPresentRef.current }), []);

	return { state: { ...state.present }, set, undo, redo, clear, canUndo, canRedo };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const useHistoryStateReducer = (
	state: { past: object[]; present: object; future: object[] },
	action: {
		type: string;
		newPresent?: object;
		initialPresent?: object;
	}
) => {
	const { past, present, future } = state;

	if (action.type === "UNDO") {
		return {
			past: past.slice(0, past.length - 1),
			present: { ...past[past.length - 1] },
			future: [present, ...future],
		};
	} else if (action.type === "REDO") {
		return {
			past: [...past, present],
			present: { ...future[0] },
			future: future.slice(1),
		};
	} else if (action.type === "SET") {
		const { newPresent } = action;

		if (deepEqual(action.newPresent as object, present)) {
			return { ...state };
		}

		return {
			past: [...past, present],
			present: { ...newPresent },
			future: [],
		};
	} else if (action.type === "CLEAR") {
		return {
			...initialUseHistoryStateState,
			present: { ...action.initialPresent },
		};
	} else {
		throw new Error("Unsupported action type");
	}
};
