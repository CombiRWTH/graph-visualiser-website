/**
 * Compares two directed edges for equality.
 *
 * @param edge1 - The first directed edge represented as a tuple of two strings.
 * @param edge2 - The second directed edge represented as a tuple of two strings.
 * @returns True if both edges are equal, i.e., have the same start and end nodes in the same order.
 */
export const compareDirectedEdges = (edge1: [string, string], edge2: [string, string]): boolean => {
	if (edge1 === undefined || edge2 === undefined) return false;
	return String(edge1[0]) === String(edge2[0]) && String(edge1[1]) === String(edge2[1]);
};

/**
 * Compares two undirected edges for equality.
 * The order of nodes does not matter in an undirected edge.
 *
 * @param edge1 - The first undirected edge represented as a tuple of two strings.
 * @param edge2 - The second undirected edge represented as a tuple of two strings.
 * @returns True if both edges are equal, i.e., have the same nodes regardless of order.
 */
export const compareUndirectedEdges = (edge1: [string, string], edge2: [string, string]): boolean => {
	if (edge1 === undefined || edge2 === undefined) return false;

	const sortedEdge1 = edge1.slice().sort() as [string, string];
	const sortedEdge2 = edge2.slice().sort() as [string, string];

	return compareDirectedEdges(sortedEdge1, sortedEdge2);
};
