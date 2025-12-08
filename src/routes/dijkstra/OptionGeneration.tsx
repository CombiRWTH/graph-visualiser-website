import { LinkTS } from "../../algorithms/adapter";
import { getRandomInt } from "../../utils/randomInt";
import { NumberOrInfinity, NumberOrNull } from "./types";

// generates a sorted list of possible distances including the correct distance and some wrong options
// used for the distance update step in dijkstra step mode as well as dijkstra quick mode
export const getDistOptions = (
	correct: NumberOrInfinity,
	numberOfOptions: number,
	current?: NumberOrInfinity
): NumberOrInfinity[] => {
	// define range from which wrong answers are sampled
	const optionsMin = 0;
	const optionsMax = correct === "∞" ? 10 : Number(correct) + 5;
	const options: NumberOrInfinity[] = [correct];
	if (current !== undefined && correct !== current) options.push(current);
	// in one third of the cases we want to add ∞ as a wrong answer
	if (!options.includes("∞") && getRandomInt(0, 2) > 1) {
		options.push("∞");
	}
	// generate the (other) wrong options
	if (optionsMax - optionsMin + 1 < numberOfOptions)
		throw new Error("Not enough valid options for Dropdown component"); // loop would run infinitely
	while (numberOfOptions > options.length) {
		let newOption = getRandomInt(optionsMin, optionsMax);
		while (options.includes(newOption)) {
			// reroll if option already exists
			newOption = getRandomInt(optionsMin, optionsMax);
		}
		options.push(newOption);
	}
	// sort options
	const sortedOptions = options.sort((a, b) => {
		if (a === "∞") {
			return 1;
		} else if (b === "∞") {
			return -1;
		} else {
			return Number(a) - Number(b);
		}
	});
	return sortedOptions;
};

// extracts a potential predecessor candidate for a given node as wrong answer for the initialization stage
export const getPredOptions = (numberOfNodes: number, edges: LinkTS[]): { [id: number]: NumberOrNull[] } => {
	// initialize options dictionary
	const result: { [id: number]: NumberOrNull[] } = {};
	const nodeIds = Array.from(Array(numberOfNodes).keys());
	// add options for each id
	nodeIds.forEach((id) => {
		const options = ["Null", id !== 0 ? 0 : 1, id] as NumberOrNull[];
		// now we add the fourth option (neighbour/random node)
		// first we look if there are any incoming egdes from nodes that are not in the options list yet
		const incoming = edges
			.filter((edge) => edge.target === id.toString()) // filter out nodes that are not pointing at our current node
			.map((edge) => +edge.source) // map to the source node and convert the id to number
			.filter((neighbour) => !options.includes(neighbour)); // filter out neighbours that are considered as an option already
		if (incoming.length > 0) {
			options.push(incoming[getRandomInt(0, incoming.length - 1)]);
		} else {
			// now we look if there are any outgoing egdes that point to nodes that are not in the options list yet
			const outgoing = edges
				.filter((edge) => edge.source === id.toString()) // filter out nodes that are not coming from the current node
				.map((edge) => +edge.target) // map to the target node and convert the id to number
				.filter((neighbour) => !options.includes(neighbour)); // filter out neighbours that are considered as an option already
			if (outgoing.length > 0) {
				options.push(outgoing[getRandomInt(0, outgoing.length - 1)]);
			} else {
				// as a last resort we add just some random node that is not in options yet
				const remainingOptions = options.filter((id) => !options.includes(id));
				if (remainingOptions.length > 0) {
					options.push(remainingOptions[getRandomInt(0, remainingOptions.length - 1)]);
				}
			}
		}

		result[id] = options;
	});

	return result;
};
