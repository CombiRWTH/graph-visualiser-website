export type NumberOrInfinity = number | "∞" | "-∞" | undefined;
export type NumberOrNull = number | "Null" | undefined;

export interface ReducedNodeState {
	id: number;
	distSolution: NumberOrInfinity;
	distInput: NumberOrInfinity;
}

export interface NodeStateInit extends ReducedNodeState {
	predSolution: NumberOrNull;
	predInput: NumberOrNull;
}

export interface NodeStateSelection extends ReducedNodeState {
	marked: boolean;
	distLastIter: NumberOrInfinity;
}

export interface NodeStateUpdates extends NodeStateSelection {
	distLastIter: NumberOrInfinity;
}

export interface NodeState extends NodeStateInit, NodeStateUpdates {}
