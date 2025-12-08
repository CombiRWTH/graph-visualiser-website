import { getDaisyuiColor, ThemeColor } from "../../../utils/daisyui-colors";

const mazeState1 = [
	{ x: 0, y: 0, text: "", status: "wall" },
	{ x: 1, y: 0, text: "", status: "wall" },
	{ x: 2, y: 0, text: "", status: "wall" },
	{ x: 3, y: 0, text: "", status: "wall" },
	{ x: 4, y: 0, text: "", status: "wall" },
	{ x: 0, y: 1, text: "", status: "wall" },
	{ x: 1, y: 1, text: "", status: "wall" },
	{ x: 2, y: 1, text: "", status: "wall" },
	{ x: 3, y: 1, text: "", status: "wall" },
	{ x: 4, y: 1, text: "", status: "wall" },
	{ x: 0, y: 2, text: "", status: "wall" },
	{ x: 1, y: 2, text: "", status: "wall" },
	{ x: 2, y: 2, text: "", status: "wall" },
	{ x: 3, y: 2, text: "", status: "wall" },
	{ x: 4, y: 2, text: "", status: "wall" },
	{ x: 0, y: 3, text: "", status: "wall" },
	{ x: 1, y: 3, text: "", status: "wall" },
	{ x: 2, y: 3, text: "", status: "wall" },
	{ x: 3, y: 3, text: "", status: "wall" },
	{ x: 4, y: 3, text: "", status: "wall" },
	{ x: 0, y: 4, text: "", status: "wall" },
	{ x: 1, y: 4, text: "", status: "wall" },
	{ x: 2, y: 4, text: "", status: "wall" },
	{ x: 3, y: 4, text: "", status: "wall" },
	{ x: 4, y: 4, text: "", status: "wall" },
];

const mazeState2 = [
	{ x: 0, y: 0, text: "", status: "wall" },
	{ x: 1, y: 0, text: "", status: "wall" },
	{ x: 2, y: 0, text: "", status: "wall" },
	{ x: 3, y: 0, text: "", status: "wall" },
	{ x: 4, y: 0, text: "", status: "wall" },
	{ x: 0, y: 1, text: "", status: "wall" },
	{ x: 1, y: 1, text: "", status: "open" },
	{ x: 2, y: 1, text: "", status: "wall" },
	{ x: 3, y: 1, text: "", status: "frontier" },
	{ x: 4, y: 1, text: "", status: "wall" },
	{ x: 0, y: 2, text: "", status: "wall" },
	{ x: 1, y: 2, text: "", status: "wall" },
	{ x: 2, y: 2, text: "", status: "wall" },
	{ x: 3, y: 2, text: "", status: "wall" },
	{ x: 4, y: 2, text: "", status: "wall" },
	{ x: 0, y: 3, text: "", status: "wall" },
	{ x: 1, y: 3, text: "", status: "frontier" },
	{ x: 2, y: 3, text: "", status: "wall" },
	{ x: 3, y: 3, text: "", status: "wall" },
	{ x: 4, y: 3, text: "", status: "wall" },
	{ x: 0, y: 4, text: "", status: "wall" },
	{ x: 1, y: 4, text: "", status: "wall" },
	{ x: 2, y: 4, text: "", status: "wall" },
	{ x: 3, y: 4, text: "", status: "wall" },
	{ x: 4, y: 4, text: "", status: "wall" },
];

const mazeState3 = [
	{ x: 0, y: 0, text: "", status: "wall" },
	{ x: 1, y: 0, text: "", status: "wall" },
	{ x: 2, y: 0, text: "", status: "wall" },
	{ x: 3, y: 0, text: "", status: "wall" },
	{ x: 4, y: 0, text: "", status: "wall" },
	{ x: 0, y: 1, text: "", status: "wall" },
	{ x: 1, y: 1, text: "", status: "open" },
	{ x: 2, y: 1, text: "", status: "open" },
	{ x: 3, y: 1, text: "", status: "open" },
	{ x: 4, y: 1, text: "", status: "wall" },
	{ x: 0, y: 2, text: "", status: "wall" },
	{ x: 1, y: 2, text: "", status: "wall" },
	{ x: 2, y: 2, text: "", status: "wall" },
	{ x: 3, y: 2, text: "", status: "wall" },
	{ x: 4, y: 2, text: "", status: "wall" },
	{ x: 0, y: 3, text: "", status: "wall" },
	{ x: 1, y: 3, text: "", status: "frontier" },
	{ x: 2, y: 3, text: "", status: "wall" },
	{ x: 3, y: 3, text: "", status: "frontier" },
	{ x: 4, y: 3, text: "", status: "wall" },
	{ x: 0, y: 4, text: "", status: "wall" },
	{ x: 1, y: 4, text: "", status: "wall" },
	{ x: 2, y: 4, text: "", status: "wall" },
	{ x: 3, y: 4, text: "", status: "wall" },
	{ x: 4, y: 4, text: "", status: "wall" },
];

const mazeState4 = [
	{ x: 0, y: 0, text: "", status: "wall" },
	{ x: 1, y: 0, text: "", status: "wall" },
	{ x: 2, y: 0, text: "", status: "wall" },
	{ x: 3, y: 0, text: "", status: "wall" },
	{ x: 4, y: 0, text: "", status: "wall" },
	{ x: 0, y: 1, text: "", status: "wall" },
	{ x: 1, y: 1, text: "", status: "open" },
	{ x: 2, y: 1, text: "", status: "open" },
	{ x: 3, y: 1, text: "", status: "open" },
	{ x: 4, y: 1, text: "", status: "wall" },
	{ x: 0, y: 2, text: "", status: "wall" },
	{ x: 1, y: 2, text: "", status: "wall" },
	{ x: 2, y: 2, text: "", status: "wall" },
	{ x: 3, y: 2, text: "", status: "open" },
	{ x: 4, y: 2, text: "", status: "wall" },
	{ x: 0, y: 3, text: "", status: "wall" },
	{ x: 1, y: 3, text: "", status: "frontier" },
	{ x: 2, y: 3, text: "", status: "wall" },
	{ x: 3, y: 3, text: "", status: "open" },
	{ x: 4, y: 3, text: "", status: "wall" },
	{ x: 0, y: 4, text: "", status: "wall" },
	{ x: 1, y: 4, text: "", status: "wall" },
	{ x: 2, y: 4, text: "", status: "wall" },
	{ x: 3, y: 4, text: "", status: "wall" },
	{ x: 4, y: 4, text: "", status: "wall" },
];

const mazeState5 = [
	{ x: 0, y: 0, text: "", status: "wall" },
	{ x: 1, y: 0, text: "", status: "wall" },
	{ x: 2, y: 0, text: "", status: "wall" },
	{ x: 3, y: 0, text: "", status: "wall" },
	{ x: 4, y: 0, text: "", status: "wall" },
	{ x: 0, y: 1, text: "", status: "wall" },
	{ x: 1, y: 1, text: "", status: "open" },
	{ x: 2, y: 1, text: "", status: "open" },
	{ x: 3, y: 1, text: "", status: "open" },
	{ x: 4, y: 1, text: "", status: "wall" },
	{ x: 0, y: 2, text: "", status: "wall" },
	{ x: 1, y: 2, text: "", status: "open" },
	{ x: 2, y: 2, text: "", status: "wall" },
	{ x: 3, y: 2, text: "", status: "open" },
	{ x: 4, y: 2, text: "", status: "wall" },
	{ x: 0, y: 3, text: "", status: "wall" },
	{ x: 1, y: 3, text: "", status: "open" },
	{ x: 2, y: 3, text: "", status: "wall" },
	{ x: 3, y: 3, text: "", status: "open" },
	{ x: 4, y: 3, text: "", status: "wall" },
	{ x: 0, y: 4, text: "", status: "wall" },
	{ x: 1, y: 4, text: "", status: "wall" },
	{ x: 2, y: 4, text: "", status: "wall" },
	{ x: 3, y: 4, text: "", status: "wall" },
	{ x: 4, y: 4, text: "", status: "wall" },
];

export default function ExplainerPrimMazeFinder(): JSX.Element {
	const openColor = getDaisyuiColor(ThemeColor.PRIMARY);
	const frontierColor = getDaisyuiColor(ThemeColor.SECONDARY);
	const wallColor = getDaisyuiColor(ThemeColor.BASE_CONTENT);

	const renderMazeState = (mazeState: Array<{ x: number; y: number; text: string; status: string }>): JSX.Element => (
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
						fill={
							cell.status === "open" ? openColor : cell.status === "frontier" ? frontierColor : wallColor
						}
					/>
					{cell.status !== null && cell.text.length > 0 && (
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
					Prim’s algorithm builds a maze by starting from a random cell and gradually expanding the maze
					outward. It keeps track of all walls that border the growing maze. At each step, it picks a random
					wall and checks if it leads to an unvisited cell. If it does, the wall is removed to connect the
					cell to the maze, and the new cell’s neighboring walls are added to the list. This process continues
					until every reachable cell has been connected, creating a perfect maze with no cycles.
				</div>
				<div className="mt-4 flex items-center justify-center gap-4">
					{renderMazeState(mazeState1)}
					{renderMazeState(mazeState2)}
					{renderMazeState(mazeState3)}
					{renderMazeState(mazeState4)}
					{renderMazeState(mazeState5)}
				</div>
				<div className="mx-auto mt-5 text-center text-lg font-semibold">
					Now try it out yourself and run Dijkstra algorithm to find the shortest path in the maze!
				</div>
			</div>
		</>
	);
}
