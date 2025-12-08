interface IRenderGraphSets {
	nodes: string[];
	edges: string[];
}

export const RenderGraphSets: React.FC<IRenderGraphSets> = ({ nodes, edges }) => {
	return (
		<div>
			<div className="text-center text-xl font-medium">Selection</div>
			<LabeledSet
				label="Nodes"
				set={nodes.sort()}
			/>
			<LabeledSet
				label="Edges"
				set={edges.sort()}
			/>
		</div>
	);
};

interface ILabeledSet {
	label: string;
	set: string[];
}

const LabeledSet: React.FC<ILabeledSet> = ({ label, set }) => {
	const formattedNodes = `{${set.join(", ")}}`;

	return (
		<div className="flex gap-x-2">
			{label}:<span>{formattedNodes}</span>
		</div>
	);
};
