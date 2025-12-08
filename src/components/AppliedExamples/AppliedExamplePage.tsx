import MazeGeneratorKruskal from "./MinimumSpanningTree/KruskalMazeFinder";
import PrimMazeFinder from "./MinimumSpanningTree/PrimMazeFinder";
import DijkstraGridDrawer from "./Pathfinding/DijkstraGridDrawer";

export default function AppliedExamplePage(): JSX.Element {
	return (
		<div className=" overflow-y-auto">
			<div className="flex flex-col items-center">
				<h2 className="text-xl font-bold ">Dijkstra</h2>
				<DijkstraGridDrawer
					rows={50}
					cols={50}
				/>
				<h2 className="text-xl font-bold ">Kruskal</h2>
				<MazeGeneratorKruskal />
				<PrimMazeFinder />
			</div>
		</div>
	);
}
