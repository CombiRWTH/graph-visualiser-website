import "intro.js/introjs.css";
import { NumberOrInfinity, NumberOrNull, NodeStateInit } from "../types";
import { ButtonToggle } from "../../../components/ButtonToggle";
import React from "react";

const textClass = "flex items-center justify-center lg:text-base xl:text-xl text-xs md:text-base";

interface IStepInitProbs {
	// contains relevant info about the graph + properties distInput and pred input that store user input
	nodeList: NodeStateInit[];
	// used to set distance inputs from user
	setDistsByIds: (updates: { [id: number]: NumberOrInfinity }) => void;
	// used to set predecessor inputs from user
	setPredsByIds: (updates: { [id: number]: NumberOrNull }) => void;
	// options from which the user has to choose the correct initial predecessor
	predecessorOptions: { [id: number]: NumberOrNull[] };
	// indicates whether the correct solution is displayed or not
	isShowingResults: boolean;
}

export const StepInitialization: React.FC<IStepInitProbs> = ({
	nodeList,
	setDistsByIds,
	setPredsByIds,
	predecessorOptions,
	isShowingResults,
}) => {
	// overwrites distInput property for all nodes in nodeList. Used for realizing user input
	const setAllDist = (value: NumberOrInfinity): void => {
		const updates: { [id: number]: NumberOrInfinity } = {};
		if (value !== undefined) {
			nodeList.forEach((node) => {
				updates[node.id] = value;
			});
		}
		setDistsByIds(updates);
	};

	// overwrites predInput property for all nodes in nodeList. Used for realizing user input
	const setAllPred = (value: NumberOrNull | "Id"): void => {
		const updates: { [id: number]: NumberOrNull } = {};
		if (value !== undefined) {
			if (value === "Id") {
				nodeList.forEach((node) => {
					updates[node.id] = node.id;
				});
			} else {
				nodeList.forEach((node) => {
					updates[node.id] = value;
				});
			}
		}
		setPredsByIds(updates);
	};

	// returns true if all the dist- and predInput properties in nodeList are defined, false otherwise

	return (
		<div className="grid-container grid grid-cols-7 gap-2 md:gap-4">
			<h1 className={textClass + ""}>Node</h1>
			<h1 className={textClass + "item2 col-span-3"}>Distance</h1>
			<h1 className={textClass + "item5 col-span-3"}>Predecessor</h1>
			<h1 className={textClass + "item1 col-span-1 mb-2"}>Set all</h1>
			<div className="item2 col-span-3 mb-2">
				<ButtonToggle
					options={[0, 1, "∞"] as NumberOrInfinity[]}
					onChange={setAllDist}
					disabled={isShowingResults}
					hideMarker={true}
				/>
			</div>
			<div className="item5 col-span-3 mb-2">
				<ButtonToggle
					options={["Null", 0, "Id"]}
					onChange={setAllPred}
					disabled={isShowingResults}
					hideMarker={true}
				/>
			</div>
			{nodeList.map(({ id, distSolution, distInput, predSolution, predInput }) => (
				<React.Fragment key={id}>
					<h1 className={textClass + "item1 col-span-1"}>{id}</h1>
					<div className="item2 col-span-3">
						<ButtonToggle
							options={[0, 1, "∞"] as NumberOrInfinity[]}
							onChange={(newDist) => setDistsByIds({ [id]: newDist })}
							selected={distInput}
							resultHighlighting={{
								isHighlightingResults: isShowingResults,
								correctOption: distSolution,
							}}
						/>
					</div>
					<div className="item5 col-span-3">
						<ButtonToggle
							options={predecessorOptions[id]}
							onChange={(newPred) => setPredsByIds({ [id]: newPred })}
							selected={predInput}
							resultHighlighting={{
								isHighlightingResults: isShowingResults,
								correctOption: predSolution,
							}}
						/>
					</div>
				</React.Fragment>
			))}
		</div>
	);
};
