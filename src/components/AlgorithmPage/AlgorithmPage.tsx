import React, { useEffect } from "react";
import { IAlgorithmInformation } from "../../utils/available-algorithms";
import { IAlgorithmStore } from "../../algorithms/algorithm-interfaces";
import { GraphSplitView } from "../GraphVisualizer/GraphSplitView";
import { CodeViewer } from "../CodeViewer/CodeViewer";
import { AlgorithmPageWalkthroughGuide } from "../Walkthrough/AlgorithmPageWalkthrough";
import { useWalkthroughStore } from "../../stores/algorithm-walkthrough-store";

export interface IAlgorithmPageProps {
	algorithm: IAlgorithmInformation;
}

export const Algorithm: React.FC<IAlgorithmPageProps> = ({ algorithm }: IAlgorithmPageProps) => {
	const { visState, pseudoCode, resetGraph, setNewGraph, isInitialized }: IAlgorithmStore =
		algorithm.useAlgorithmStore((state) => ({
			...state,
			visState: state.getVisState(),
		}));

	function handleNodeClick(nodeId: string): void {
		if (algorithm.hasStartNode) {
			setNewGraph(visState!.graph, { startNode: parseInt(nodeId) });
		}
	}

	const { showAlgoWalkthrough, resetAlgoWalkthrough } = useWalkthroughStore();

	useEffect(() => {
		if (isInitialized) {
			return resetGraph();
			resetAlgoWalkthrough();
		}
	}, [isInitialized]);

	useEffect(() => {
		return () => {
			// this cleanup function should be executed on unmount to reset to the first visState
			resetGraph();
			resetAlgoWalkthrough();
		};
	}, []);

	return (
		<>
			{showAlgoWalkthrough && <AlgorithmPageWalkthroughGuide algorithmName={algorithm.name} />}
			<GraphSplitView
				algorithm={algorithm}
				actionButtons={{ showInfo: false, showHints: true, showColorPicker: true, showFeatureExplain: true }}
				onNodeClick={handleNodeClick}
				classNameLeft="w-full lg:w-5/6"
				className={"graph-splitview"}
				classNameGraphCard={"graph-card"}
				classNameDownloadGraph={"download-graph"}
			>
				<CodeViewer
					algorithm={algorithm}
					useAlgorithmStore={algorithm.useAlgorithmStore}
					lines={pseudoCode!}
					selectedLine={visState?.lineOfCode}
					className="right-body graph-info-panel mr-auto size-full max-lg:rounded-b-none"
					classNameController={"controller"}
					classNameViewVariables={"view-variables"}
				/>
			</GraphSplitView>
		</>
	);
};
