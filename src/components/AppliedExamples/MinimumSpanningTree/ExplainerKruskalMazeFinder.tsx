import { getDaisyuiColor, ThemeColor } from "../../../utils/daisyui-colors";

const mazeState1 = [
	{ x: 0, y: 0, text: "A", isOpen: true },
	{ x: 1, y: 0, text: "", isOpen: false },
	{ x: 2, y: 0, text: "B", isOpen: true },
	{ x: 3, y: 0, text: "", isOpen: false },
	{ x: 4, y: 0, text: "C", isOpen: true },
	{ x: 0, y: 1, text: "", isOpen: false },
	{ x: 1, y: 1, text: "", isOpen: false },
	{ x: 2, y: 1, text: "", isOpen: false },
	{ x: 3, y: 1, text: "", isOpen: false },
	{ x: 4, y: 1, text: "", isOpen: false },
	{ x: 0, y: 2, text: "D", isOpen: true },
	{ x: 1, y: 2, text: "", isOpen: false },
	{ x: 2, y: 2, text: "E", isOpen: true },
	{ x: 3, y: 2, text: "", isOpen: false },
	{ x: 4, y: 2, text: "F", isOpen: true },
	{ x: 0, y: 3, text: "", isOpen: false },
	{ x: 1, y: 3, text: "", isOpen: false },
	{ x: 2, y: 3, text: "", isOpen: false },
	{ x: 3, y: 3, text: "", isOpen: false },
	{ x: 4, y: 3, text: "", isOpen: false },
	{ x: 0, y: 4, text: "G", isOpen: true },
	{ x: 1, y: 4, text: "", isOpen: false },
	{ x: 2, y: 4, text: "H", isOpen: true },
	{ x: 3, y: 4, text: "", isOpen: false },
	{ x: 4, y: 4, text: "I", isOpen: true },
];

const mazeState2 = [
	{ x: 0, y: 0, text: "A", isOpen: true },
	{ x: 1, y: 0, text: "", isOpen: false },
	{ x: 2, y: 0, text: "B", isOpen: true },
	{ x: 3, y: 0, text: "", isOpen: false },
	{ x: 4, y: 0, text: "C", isOpen: true },
	{ x: 0, y: 1, text: "", isOpen: false },
	{ x: 1, y: 1, text: "", isOpen: false },
	{ x: 2, y: 1, text: "", isOpen: false },
	{ x: 3, y: 1, text: "", isOpen: false },
	{ x: 4, y: 1, text: "", isOpen: false },
	{ x: 0, y: 2, text: "D", isOpen: true },
	{ x: 1, y: 2, text: "", isOpen: false },
	{ x: 2, y: 2, text: "E", isOpen: true },
	{ x: 3, y: 2, text: "", isOpen: false },
	{ x: 4, y: 2, text: "F", isOpen: true },
	{ x: 0, y: 3, text: "", isOpen: false },
	{ x: 1, y: 3, text: "", isOpen: false },
	{ x: 2, y: 3, text: "", isOpen: false },
	{ x: 3, y: 3, text: "", isOpen: false },
	{ x: 4, y: 3, text: "", isOpen: false },
	{ x: 0, y: 4, text: "G", isOpen: true },
	{ x: 1, y: 4, text: "G", isOpen: true },
	{ x: 2, y: 4, text: "G", isOpen: true },
	{ x: 3, y: 4, text: "", isOpen: false },
	{ x: 4, y: 4, text: "I", isOpen: true },
];

const mazeState3 = [
	{ x: 0, y: 0, text: "A", isOpen: true },
	{ x: 1, y: 0, text: "", isOpen: false },
	{ x: 2, y: 0, text: "B", isOpen: true },
	{ x: 3, y: 0, text: "", isOpen: false },
	{ x: 4, y: 0, text: "C", isOpen: true },
	{ x: 0, y: 1, text: "", isOpen: false },
	{ x: 1, y: 1, text: "", isOpen: false },
	{ x: 2, y: 1, text: "", isOpen: false },
	{ x: 3, y: 1, text: "", isOpen: false },
	{ x: 4, y: 1, text: "", isOpen: false },
	{ x: 0, y: 2, text: "G", isOpen: true },
	{ x: 1, y: 2, text: "", isOpen: false },
	{ x: 2, y: 2, text: "E", isOpen: true },
	{ x: 3, y: 2, text: "", isOpen: false },
	{ x: 4, y: 2, text: "F", isOpen: true },
	{ x: 0, y: 3, text: "G", isOpen: true },
	{ x: 1, y: 3, text: "", isOpen: false },
	{ x: 2, y: 3, text: "", isOpen: false },
	{ x: 3, y: 3, text: "", isOpen: false },
	{ x: 4, y: 3, text: "", isOpen: false },
	{ x: 0, y: 4, text: "G", isOpen: true },
	{ x: 1, y: 4, text: "G", isOpen: true },
	{ x: 2, y: 4, text: "G", isOpen: true },
	{ x: 3, y: 4, text: "", isOpen: false },
	{ x: 4, y: 4, text: "I", isOpen: true },
];

const mazeState4 = [
	{ x: 0, y: 0, text: "A", isOpen: true },
	{ x: 1, y: 0, text: "", isOpen: false },
	{ x: 2, y: 0, text: "B", isOpen: true },
	{ x: 3, y: 0, text: "B", isOpen: true },
	{ x: 4, y: 0, text: "B", isOpen: true },
	{ x: 0, y: 1, text: "", isOpen: false },
	{ x: 1, y: 1, text: "", isOpen: false },
	{ x: 2, y: 1, text: "", isOpen: false },
	{ x: 3, y: 1, text: "", isOpen: false },
	{ x: 4, y: 1, text: "", isOpen: false },
	{ x: 0, y: 2, text: "G", isOpen: true },
	{ x: 1, y: 2, text: "", isOpen: false },
	{ x: 2, y: 2, text: "E", isOpen: true },
	{ x: 3, y: 2, text: "", isOpen: false },
	{ x: 4, y: 2, text: "F", isOpen: true },
	{ x: 0, y: 3, text: "G", isOpen: true },
	{ x: 1, y: 3, text: "", isOpen: false },
	{ x: 2, y: 3, text: "", isOpen: false },
	{ x: 3, y: 3, text: "", isOpen: false },
	{ x: 4, y: 3, text: "", isOpen: false },
	{ x: 0, y: 4, text: "G", isOpen: true },
	{ x: 1, y: 4, text: "G", isOpen: true },
	{ x: 2, y: 4, text: "G", isOpen: true },
	{ x: 3, y: 4, text: "", isOpen: false },
	{ x: 4, y: 4, text: "I", isOpen: true },
];

const mazeState5 = [
	{ x: 0, y: 0, text: "B", isOpen: true },
	{ x: 1, y: 0, text: "B", isOpen: true },
	{ x: 2, y: 0, text: "B", isOpen: true },
	{ x: 3, y: 0, text: "B", isOpen: true },
	{ x: 4, y: 0, text: "B", isOpen: true },
	{ x: 0, y: 1, text: "", isOpen: false },
	{ x: 1, y: 1, text: "", isOpen: false },
	{ x: 2, y: 1, text: "", isOpen: false },
	{ x: 3, y: 1, text: "", isOpen: false },
	{ x: 4, y: 1, text: "", isOpen: false },
	{ x: 0, y: 2, text: "G", isOpen: true },
	{ x: 1, y: 2, text: "", isOpen: false },
	{ x: 2, y: 2, text: "E", isOpen: true },
	{ x: 3, y: 2, text: "", isOpen: false },
	{ x: 4, y: 2, text: "F", isOpen: true },
	{ x: 0, y: 3, text: "G", isOpen: true },
	{ x: 1, y: 3, text: "", isOpen: false },
	{ x: 2, y: 3, text: "", isOpen: false },
	{ x: 3, y: 3, text: "", isOpen: false },
	{ x: 4, y: 3, text: "", isOpen: false },
	{ x: 0, y: 4, text: "G", isOpen: true },
	{ x: 1, y: 4, text: "G", isOpen: true },
	{ x: 2, y: 4, text: "G", isOpen: true },
	{ x: 3, y: 4, text: "", isOpen: false },
	{ x: 4, y: 4, text: "I", isOpen: true },
];

const mazeState6 = [
	{ x: 0, y: 0, text: "B", isOpen: true },
	{ x: 1, y: 0, text: "B", isOpen: true },
	{ x: 2, y: 0, text: "B", isOpen: true },
	{ x: 3, y: 0, text: "B", isOpen: true },
	{ x: 4, y: 0, text: "B", isOpen: true },
	{ x: 0, y: 1, text: "", isOpen: false },
	{ x: 1, y: 1, text: "", isOpen: false },
	{ x: 2, y: 1, text: "", isOpen: false },
	{ x: 3, y: 1, text: "", isOpen: false },
	{ x: 4, y: 1, text: "", isOpen: false },
	{ x: 0, y: 2, text: "G", isOpen: true },
	{ x: 1, y: 2, text: "", isOpen: false },
	{ x: 2, y: 2, text: "E", isOpen: true },
	{ x: 3, y: 2, text: "", isOpen: false },
	{ x: 4, y: 2, text: "F", isOpen: true },
	{ x: 0, y: 3, text: "G", isOpen: true },
	{ x: 1, y: 3, text: "", isOpen: false },
	{ x: 2, y: 3, text: "", isOpen: false },
	{ x: 3, y: 3, text: "", isOpen: false },
	{ x: 4, y: 3, text: "", isOpen: false },
	{ x: 0, y: 4, text: "G", isOpen: true },
	{ x: 1, y: 4, text: "G", isOpen: true },
	{ x: 2, y: 4, text: "G", isOpen: true },
	{ x: 3, y: 4, text: "G", isOpen: true },
	{ x: 4, y: 4, text: "G", isOpen: true },
];

const mazeState7 = [
	{ x: 0, y: 0, text: "B", isOpen: true },
	{ x: 1, y: 0, text: "B", isOpen: true },
	{ x: 2, y: 0, text: "B", isOpen: true },
	{ x: 3, y: 0, text: "B", isOpen: true },
	{ x: 4, y: 0, text: "B", isOpen: true },
	{ x: 0, y: 1, text: "", isOpen: false },
	{ x: 1, y: 1, text: "", isOpen: false },
	{ x: 2, y: 1, text: "", isOpen: false },
	{ x: 3, y: 1, text: "", isOpen: false },
	{ x: 4, y: 1, text: "", isOpen: false },
	{ x: 0, y: 2, text: "G", isOpen: true },
	{ x: 1, y: 2, text: "", isOpen: false },
	{ x: 2, y: 2, text: "E", isOpen: true },
	{ x: 3, y: 2, text: "E", isOpen: true },
	{ x: 4, y: 2, text: "E", isOpen: true },
	{ x: 0, y: 3, text: "G", isOpen: true },
	{ x: 1, y: 3, text: "", isOpen: false },
	{ x: 2, y: 3, text: "", isOpen: false },
	{ x: 3, y: 3, text: "", isOpen: false },
	{ x: 4, y: 3, text: "", isOpen: false },
	{ x: 0, y: 4, text: "G", isOpen: true },
	{ x: 1, y: 4, text: "G", isOpen: true },
	{ x: 2, y: 4, text: "G", isOpen: true },
	{ x: 3, y: 4, text: "G", isOpen: true },
	{ x: 4, y: 4, text: "G", isOpen: true },
];

const mazeState8 = [
	{ x: 0, y: 0, text: "B", isOpen: true },
	{ x: 1, y: 0, text: "B", isOpen: true },
	{ x: 2, y: 0, text: "B", isOpen: true },
	{ x: 3, y: 0, text: "B", isOpen: true },
	{ x: 4, y: 0, text: "B", isOpen: true },
	{ x: 0, y: 1, text: "", isOpen: false },
	{ x: 1, y: 1, text: "", isOpen: false },
	{ x: 2, y: 1, text: "", isOpen: false },
	{ x: 3, y: 1, text: "", isOpen: false },
	{ x: 4, y: 1, text: "", isOpen: false },
	{ x: 0, y: 2, text: "G", isOpen: true },
	{ x: 1, y: 2, text: "G", isOpen: true },
	{ x: 2, y: 2, text: "G", isOpen: true },
	{ x: 3, y: 2, text: "G", isOpen: true },
	{ x: 4, y: 2, text: "G", isOpen: true },
	{ x: 0, y: 3, text: "G", isOpen: true },
	{ x: 1, y: 3, text: "", isOpen: false },
	{ x: 2, y: 3, text: "", isOpen: false },
	{ x: 3, y: 3, text: "", isOpen: false },
	{ x: 4, y: 3, text: "", isOpen: false },
	{ x: 0, y: 4, text: "G", isOpen: true },
	{ x: 1, y: 4, text: "G", isOpen: true },
	{ x: 2, y: 4, text: "G", isOpen: true },
	{ x: 3, y: 4, text: "G", isOpen: true },
	{ x: 4, y: 4, text: "G", isOpen: true },
];

const mazeState9 = [
	{ x: 0, y: 0, text: "G", isOpen: true },
	{ x: 1, y: 0, text: "G", isOpen: true },
	{ x: 2, y: 0, text: "G", isOpen: true },
	{ x: 3, y: 0, text: "G", isOpen: true },
	{ x: 4, y: 0, text: "G", isOpen: true },
	{ x: 0, y: 1, text: "G", isOpen: true },
	{ x: 1, y: 1, text: "", isOpen: false },
	{ x: 2, y: 1, text: "", isOpen: false },
	{ x: 3, y: 1, text: "", isOpen: false },
	{ x: 4, y: 1, text: "", isOpen: false },
	{ x: 0, y: 2, text: "G", isOpen: true },
	{ x: 1, y: 2, text: "G", isOpen: true },
	{ x: 2, y: 2, text: "G", isOpen: true },
	{ x: 3, y: 2, text: "G", isOpen: true },
	{ x: 4, y: 2, text: "G", isOpen: true },
	{ x: 0, y: 3, text: "G", isOpen: true },
	{ x: 1, y: 3, text: "", isOpen: false },
	{ x: 2, y: 3, text: "", isOpen: false },
	{ x: 3, y: 3, text: "", isOpen: false },
	{ x: 4, y: 3, text: "", isOpen: false },
	{ x: 0, y: 4, text: "G", isOpen: true },
	{ x: 1, y: 4, text: "G", isOpen: true },
	{ x: 2, y: 4, text: "G", isOpen: true },
	{ x: 3, y: 4, text: "G", isOpen: true },
	{ x: 4, y: 4, text: "G", isOpen: true },
];

export default function ExplainerKruskalMazeFinder(): JSX.Element {
	const openColor = getDaisyuiColor(ThemeColor.PRIMARY);
	const wallColor = getDaisyuiColor(ThemeColor.BASE_CONTENT);

	const renderMazeState = (
		mazeState: Array<{ x: number; y: number; text: string; isOpen: boolean }>
	): JSX.Element => (
		<svg
			viewBox="0 0 5 5"
			width={80}
			height={80}
		>
			{mazeState.map((cell, index) => (
				<g key={index}>
					<rect
						x={cell.x}
						y={cell.y}
						width="1"
						height="1"
						fill={cell.isOpen ? openColor : wallColor}
					/>
					{cell.isOpen && cell.text !== "" && (
						<text
							x={cell.x + 0.5}
							y={cell.y + 0.5}
							textAnchor="middle"
							dominantBaseline="middle"
							fontSize="0.5"
							fill="white"
							fontWeight={"bold"}
						>
							{cell.text}
						</text>
					)}
				</g>
			))}
		</svg>
	);

	return (
		<>
			<div className="mb-7 w-3/6 min-w-[600px] rounded-3xl bg-base-200 p-5 shadow-lg">
				<div className=" mx-auto text-center text-lg font-semibold">
					Kruskal’s algorithm builds a maze by treating each cell as part of a disjoint set and connecting
					them by removing walls between them. Starting with all walls intact, the algorithm randomly picks
					walls and removes them only if they connect two separate regions, ensuring no loops are formed. This
					continues until the entire grid is connected, forming a perfect maze with exactly one path between
					any two cells.
				</div>
				<div className="mt-4 flex items-center justify-center gap-4">
					{renderMazeState(mazeState1)}
					{renderMazeState(mazeState2)}
					{renderMazeState(mazeState3)}
					{renderMazeState(mazeState4)}
					{renderMazeState(mazeState5)}
					{renderMazeState(mazeState6)}
					{renderMazeState(mazeState7)}
					{renderMazeState(mazeState8)}
					{renderMazeState(mazeState9)}
				</div>
				<div className="mx-auto mt-5 text-center text-lg font-semibold">
					Now try it out yourself and run Dijkstra algorithm to find the shortest path in the maze!
				</div>
			</div>
		</>
	);
}
