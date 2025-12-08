import React from "react";
import { IAlgorithmInformation } from "../../utils/available-algorithms";
import { IAlgorithmStore } from "../../algorithms/algorithm-interfaces";
import { SplitView } from "../SplitView";
import { Spinner } from "../Spinner";
import { GraphCard } from "./GraphCard";
import { GraphTS } from "../../utils/graphs";
import { LinkTS, NodeTS } from "../../algorithms/adapter";

export interface IGraphSplitViewProps {
	algorithm: IAlgorithmInformation;
	actionButtons: IGraphActionButtons;
	children?: React.ReactNode;
	className?: string;
	classNameRight?: string;
	classNameLeft?: string;
	classNameGraphCard?: string;
	classNameDownloadGraph?: string;
	graphState?: GraphTS<NodeTS, LinkTS>;
	onNodeClick?: (nodeId: string) => void;
}

interface IGraphActionButtons {
	showInfo: boolean;
	showHints: boolean;
	showColorPicker: boolean;
	showFeatureExplain: boolean;
}

/**
 * The GraphSplitView component. It should be used whenever the graph is displayed on the left side
 * and additional information on the right side to have a uniform design
 * @param algorithm The algorithm to use (includes useAlgorithmStore function)
 * @param children The children to display on the right side, should have className "right-body" to be displayed correctly
 * @param actionButtons Boolean values to show the info, hints and color picker buttons
 * @param className The className for the outer SplitView
 * @param classNameLeft The className for the left side of the SplitView, only use if really necessary
 * @param classNameRight The className for the right side of the SplitView, only use if really necessary
 * @param classNameGraphCard The className for the GraphCard, can be used e.g. to set the size of the card, only use if really necessary
 * @param graphState The graph to be displayed. If not provide, the graph from the algorithms visState is displayed
 * @param onNodeClick A function to be executed when a node is clicked (like selecting it as the start node)
 */
export const GraphSplitView: React.FC<IGraphSplitViewProps> = ({
	algorithm,
	children,
	actionButtons,
	className,
	classNameLeft,
	classNameRight,
	classNameGraphCard,
	graphState,
	onNodeClick,
	classNameDownloadGraph,
}: IGraphSplitViewProps) => {
	const { isInitialized, visState }: IAlgorithmStore = algorithm.useAlgorithmStore((state: IAlgorithmStore) => ({
		...state,
		visState: state.getVisState(),
	}));

	// --------------------------------------
	// |	left-header	|	right-header	|
	// --------------------------------------
	// |				|					|
	// |	graph-card	|	children		|
	// |				|					|
	// --------------------------------------
	// |	left-footer	|	right-footer	|
	// --------------------------------------

	return isInitialized && visState !== null ? (
		<SplitView
			className={`box-border flex h-full flex-col lg:gap-5 lg:p-5 ${className ?? ""} w-full max-w-none grow`}
			classNameLeft={`flex flex-col justify-center items-center lg:items-end grow ${classNameLeft ?? ""}`}
			classNameRight={`flex flex-col justify-center overflow-hidden items-center lg:max-w-screen-md lg:items-start h-2/3 sm:h-1/2 lg:h-full ${classNameRight ?? ""}`}
		>
			<GraphCard
				className={`left-body card card-body
						 w-full overflow-hidden
							bg-transparent
							max-lg:rounded-none
							lg:bg-base-300
							 ${classNameGraphCard ?? ""}`}
				algorithm={algorithm}
				showHints={actionButtons.showHints}
				showColorPicker={actionButtons.showColorPicker}
				showInfo={actionButtons.showInfo}
				showFeatureExplain={actionButtons.showFeatureExplain}
				graphState={graphState}
				onNodeClick={onNodeClick}
				classNameDownloadGraph={classNameDownloadGraph}
			/>
			{children}
		</SplitView>
	) : (
		<Spinner />
	);
};
