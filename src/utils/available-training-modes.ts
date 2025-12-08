export interface IAvailableTrainingMode {
	// The name has to be the same as the key in the availableTrainingModes object
	name: string;
	description: string;
	buttonText: string;
}

export const availableTrainingModes: IAvailableTrainingMode[] = [
	{
		name: "quick",
		description: "This mode lets you just enter the solution.",
		buttonText: "Quick Training",
	},
	{
		name: "step-by-step",
		description: "This mode guides you through the algorithm.",
		buttonText: "Step by Step",
	},
	{
		name: "random",
		description: "This mode presents standalone questions.",
		buttonText: "Random",
	},
];
