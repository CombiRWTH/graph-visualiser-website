import { getDaisyuiColor, ThemeColor } from "../../../utils/daisyui-colors";

const mazeState1 = [
	{ x: 0, y: 0, text: "", status: "source" },
	{ x: 1, y: 0, text: "", status: "open" },
	{ x: 2, y: 0, text: "", status: "wall" },
	{ x: 3, y: 0, text: "", status: "wall" },
	{ x: 4, y: 0, text: "", status: "wall" },
	{ x: 0, y: 1, text: "", status: "open" },
	{ x: 1, y: 1, text: "", status: "open" },
	{ x: 2, y: 1, text: "", status: "open" },
	{ x: 3, y: 1, text: "", status: "wall" },
	{ x: 4, y: 1, text: "", status: "wall" },
	{ x: 0, y: 2, text: "", status: "wall" },
	{ x: 1, y: 2, text: "", status: "target" },
	{ x: 2, y: 2, text: "", status: "open" },
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
	{ x: 0, y: 0, text: "", status: "source" },
	{ x: 1, y: 0, text: "", status: "visited" },
	{ x: 2, y: 0, text: "", status: "wall" },
	{ x: 3, y: 0, text: "", status: "wall" },
	{ x: 4, y: 0, text: "", status: "wall" },
	{ x: 0, y: 1, text: "", status: "open" },
	{ x: 1, y: 1, text: "", status: "open" },
	{ x: 2, y: 1, text: "", status: "open" },
	{ x: 3, y: 1, text: "", status: "wall" },
	{ x: 4, y: 1, text: "", status: "wall" },
	{ x: 0, y: 2, text: "", status: "wall" },
	{ x: 1, y: 2, text: "", status: "target" },
	{ x: 2, y: 2, text: "", status: "open" },
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

const mazeState3 = [
	{ x: 0, y: 0, text: "", status: "source" },
	{ x: 1, y: 0, text: "", status: "visited" },
	{ x: 2, y: 0, text: "", status: "wall" },
	{ x: 3, y: 0, text: "", status: "wall" },
	{ x: 4, y: 0, text: "", status: "wall" },
	{ x: 0, y: 1, text: "", status: "visited" },
	{ x: 1, y: 1, text: "", status: "open" },
	{ x: 2, y: 1, text: "", status: "open" },
	{ x: 3, y: 1, text: "", status: "wall" },
	{ x: 4, y: 1, text: "", status: "wall" },
	{ x: 0, y: 2, text: "", status: "wall" },
	{ x: 1, y: 2, text: "", status: "target" },
	{ x: 2, y: 2, text: "", status: "open" },
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

const mazeState4 = [
	{ x: 0, y: 0, text: "", status: "source" },
	{ x: 1, y: 0, text: "", status: "visited" },
	{ x: 2, y: 0, text: "", status: "wall" },
	{ x: 3, y: 0, text: "", status: "wall" },
	{ x: 4, y: 0, text: "", status: "wall" },
	{ x: 0, y: 1, text: "", status: "visited" },
	{ x: 1, y: 1, text: "", status: "visited" },
	{ x: 2, y: 1, text: "", status: "open" },
	{ x: 3, y: 1, text: "", status: "wall" },
	{ x: 4, y: 1, text: "", status: "wall" },
	{ x: 0, y: 2, text: "", status: "wall" },
	{ x: 1, y: 2, text: "", status: "target" },
	{ x: 2, y: 2, text: "", status: "open" },
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

const mazeState5 = [
	{ x: 0, y: 0, text: "", status: "source" },
	{ x: 1, y: 0, text: "", status: "visited" },
	{ x: 2, y: 0, text: "", status: "wall" },
	{ x: 3, y: 0, text: "", status: "wall" },
	{ x: 4, y: 0, text: "", status: "wall" },
	{ x: 0, y: 1, text: "", status: "visited" },
	{ x: 1, y: 1, text: "", status: "visited" },
	{ x: 2, y: 1, text: "", status: "visited" },
	{ x: 3, y: 1, text: "", status: "wall" },
	{ x: 4, y: 1, text: "", status: "wall" },
	{ x: 0, y: 2, text: "", status: "wall" },
	{ x: 1, y: 2, text: "", status: "target" },
	{ x: 2, y: 2, text: "", status: "open" },
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

const mazeState6 = [
	{ x: 0, y: 0, text: "", status: "source" },
	{ x: 1, y: 0, text: "", status: "shortestPath" },
	{ x: 2, y: 0, text: "", status: "wall" },
	{ x: 3, y: 0, text: "", status: "wall" },
	{ x: 4, y: 0, text: "", status: "wall" },
	{ x: 0, y: 1, text: "", status: "visited" },
	{ x: 1, y: 1, text: "", status: "shortestPath" },
	{ x: 2, y: 1, text: "", status: "visited" },
	{ x: 3, y: 1, text: "", status: "wall" },
	{ x: 4, y: 1, text: "", status: "wall" },
	{ x: 0, y: 2, text: "", status: "wall" },
	{ x: 1, y: 2, text: "", status: "target" },
	{ x: 2, y: 2, text: "", status: "open" },
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

export default function ExplainerDijkstraGridDrawer(): JSX.Element {
	const openColor = getDaisyuiColor(ThemeColor.BASE3);
	const wallColor = getDaisyuiColor(ThemeColor.BASE_CONTENT);
	const sourceColor = "red";
	const targetColor = getDaisyuiColor(ThemeColor.SUCCESS);
	const visitedColor = getDaisyuiColor(ThemeColor.SECONDARY);
	const shortestPathColor = "orange";

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
							cell.status === "open"
								? openColor
								: cell.status === "wall"
									? wallColor
									: cell.status === "source"
										? sourceColor
										: cell.status === "target"
											? targetColor
											: cell.status === "visited"
												? visitedColor
												: cell.status === "shortestPath"
													? shortestPathColor
													: "transparent"
						}
					/>
					{cell.status !== null && cell.text !== "" && (
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
				<div className="mx-auto text-center text-lg font-semibold">
					Dijkstra’s algorithm finds the shortest path between a source and target cell in a weighted
					graph—here visualized as a grid maze. It starts at the source, exploring neighboring cells in order
					of increasing distance. Each step marks visited cells and keeps track of how it reached them. Once
					the target is reached, the algorithm traces back the shortest path. Walls are treated as impassable,
					and only the lowest-cost paths are followed.
				</div>

				<div className="mt-4 flex items-center justify-center gap-4">
					{renderMazeState(mazeState1)}
					{renderMazeState(mazeState2)}
					{renderMazeState(mazeState3)}
					{renderMazeState(mazeState4)}
					{renderMazeState(mazeState5)}
					{renderMazeState(mazeState6)}
				</div>
				<div className="mx-auto mt-5 text-center text-lg font-semibold">
					Now try it out yourself! Place walls, set a source and target, and run Dijkstra's algorithm to find
					the shortest path between them!
				</div>
			</div>
		</>
	);
}
