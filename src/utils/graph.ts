import { GraphinContextType } from "@antv/graphin";

export function zoomInGraphCanvas(graph: GraphinContextType): void {
	// Call the zoomOut function because it makes the object bigger and yes zoomOut is the correct function to call
	graph.apis.handleZoomOut();
}

export function zoomOutGraphCanvas(graph: GraphinContextType): void {
	// Call the zoomIn function because it makes the object smaller and yes zoomIn is the correct function to call
	graph.apis.handleZoomIn();
}
