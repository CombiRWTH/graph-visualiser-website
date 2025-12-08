import { GraphData, GraphinData } from "@antv/graphin";
import { useLocalStorage } from "react-use";

interface IUseLocalStorageGraphsReturn {
	saveGraph: (graph: GraphinData) => void;
	getGraph: (id: string | undefined) => GraphinData | undefined;
	getAllGraphs: () => GraphinData[];
}

function useLocalStorageGraphs(): IUseLocalStorageGraphsReturn {
	const [graphLocator, setGraphLocator] = useLocalStorage<string[]>("graphLocator", []);

	const saveGraph = (graph: GraphinData): void => {
		const graphData = graph as GraphData;
		const graphString = JSON.stringify(graphData);
		localStorage.setItem(graphData.id, graphString);

		if (graphLocator == null) {
			setGraphLocator([graphData.id].concat(graphLocator));
		}
	};

	const getGraph = (id: string | undefined): GraphinData | undefined => {
		if (id == null) {
			return undefined;
		}

		const graphString = localStorage.getItem(id);
		if (graphString == null) {
			return undefined;
		}

		return JSON.parse(graphString) as GraphinData;
	};

	const getAllGraphs = (): GraphinData[] => {
		const graphs: GraphinData[] = [];
		graphLocator?.forEach((id) => {
			const graph = getGraph(id);
			if (graph != null) {
				graphs.push(graph);
			}
		});
		return graphs;
	};

	return { saveGraph, getGraph, getAllGraphs };
}

export default useLocalStorageGraphs;
