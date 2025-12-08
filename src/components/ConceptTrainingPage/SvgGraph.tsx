import React, { useRef, useEffect, useState } from "react";
import { GraphTS } from "../../utils/graphs";
import { IUserEdge, IUserNode } from "@antv/graphin";

interface SimpleGraphProps {
	graph: GraphTS<IUserNode, IUserEdge>;
	nodeRadius?: number;
	nodeColor?: string;
	edgeColor?: string;
}

const SimpleGraph: React.FC<SimpleGraphProps> = ({
	graph,
	nodeRadius = 20,
	nodeColor = "#2e3440",
	edgeColor = "#2e3440",
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const padding = nodeRadius * 2; // Add padding to prevent cutoff
	const isDirected = graph.directed;

	useEffect(() => {
		const updateDimensions = (): void => {
			if (containerRef.current !== null) {
				setDimensions({
					width: containerRef.current.clientWidth,
					height: Math.max(containerRef.current.clientWidth * 0.75, 300),
				});
			}
		};

		updateDimensions();
		const observer = new ResizeObserver(updateDimensions);
		if (containerRef.current !== null) {
			observer.observe(containerRef.current);
		}

		return () => {
			if (containerRef.current !== null) {
				observer.unobserve(containerRef.current);
			}
		};
	}, []);

	// Adjust center points to include padding
	const centerX = dimensions.width / 2;
	const centerY = dimensions.height / 2;
	// Reduce radius to account for padding
	const radius = (Math.min(dimensions.width, dimensions.height) - padding * 2) / 3;

	const nodesWithPositions = graph.nodes.map((node, index) => {
		const angle = (2 * Math.PI * index) / graph.nodes.length;
		return {
			...node,
			x: node.x ?? centerX + radius * Math.cos(angle),
			y: node.y ?? centerY + radius * Math.sin(angle),
		};
	});

	// Calculate actual bounds of the graph
	const minX = Math.min(...nodesWithPositions.map((n) => n.x)) - nodeRadius;
	const maxX = Math.max(...nodesWithPositions.map((n) => n.x)) + nodeRadius;
	const minY = Math.min(...nodesWithPositions.map((n) => n.y)) - nodeRadius;
	const maxY = Math.max(...nodesWithPositions.map((n) => n.y)) + nodeRadius;

	const viewBoxWidth = maxX - minX + padding * 2;
	const viewBoxHeight = maxY - minY + padding * 2;

	return (
		<div
			ref={containerRef}
			className="w-full"
		>
			<svg
				width="100%"
				height={dimensions.height}
				viewBox={`${minX - padding} ${minY - padding} ${viewBoxWidth} ${viewBoxHeight}`}
				preserveAspectRatio="xMidYMid meet"
				className="rounded-lg bg-base-100 shadow-lg"
			>
				{/* Create the arrow for the edges */}
				<defs>
					<marker
						id="arrowhead"
						markerWidth="10"
						markerHeight="10"
						refX="0.5"
						refY="5"
						orient="auto"
						markerUnits="userSpaceOnUse"
					>
						<polygon
							points="0 0, 10 5, 0 10"
							fill={edgeColor}
						/>
					</marker>
				</defs>

				{/* Draw edges */}
				{graph.edges.map((edge, index) => {
					const source = nodesWithPositions.find((n) => n.id === edge.source);
					const target = nodesWithPositions.find((n) => n.id === edge.target);

					if (source === null || source === undefined || target === null || target === undefined) return null;

					/* Calculations for directed graphs with bidirectional edges so that they don't lie on top of each other
					   If there are no bidirectional edges, only straight lines will be drawn */
					const dx = target.x - source.x;
					const dy = target.y - source.y;

					const angle = Math.atan2(dy, dx);

					const isBidirectional = graph.edges.some(
						(e) => e.source === edge.target && e.target === edge.source
					);

					const curveOffset = isBidirectional ? 30 : 0;

					const offsetX = curveOffset * Math.sin(angle);
					const offsetY = -curveOffset * Math.cos(angle);

					const mx = (source.x + target.x) / 2 + offsetX;
					const my = (source.y + target.y) / 2 + offsetY;

					let pathData;

					// If the graph is directed, cut off the edge so that the arrow can point exactly to the edge of the vertex
					if (isDirected === true) {
						const fullPath = `M ${source.x} ${source.y} Q ${mx} ${my} ${target.x} ${target.y}`;
						const tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
						tempPath.setAttribute("d", fullPath);

						document.body.appendChild(tempPath);

						const totalLength = tempPath.getTotalLength();
						const shortenBy = nodeRadius + 10;
						const newLength = Math.max(0, totalLength - shortenBy);
						const newEnd = tempPath.getPointAtLength(newLength);

						document.body.removeChild(tempPath);

						pathData = `M ${source.x} ${source.y} Q ${mx} ${my} ${newEnd.x} ${newEnd.y}`;
					} else {
						pathData = `M ${source.x} ${source.y} Q ${mx} ${my} ${target.x} ${target.y}`;
					}

					return (
						<path
							key={`edge-${index}`}
							d={pathData}
							stroke={edgeColor}
							strokeWidth="2"
							fill="none"
							markerEnd={isDirected === true ? "url(#arrowhead)" : undefined}
						/>
					);
				})}

				{/* Draw nodes */}
				{nodesWithPositions.map((node) => (
					<g key={`node-${node.id}`}>
						<circle
							cx={node.x}
							cy={node.y}
							r={nodeRadius}
							fill={nodeColor}
							stroke="#000"
							strokeWidth="2"
						/>
						<text
							x={node.x}
							y={node.y}
							textAnchor="middle"
							dominantBaseline="middle"
							fontSize={nodeRadius * 0.8}
							fontWeight="bold"
							fill="#fff"
						>
							{node.id}
						</text>
					</g>
				))}
			</svg>
		</div>
	);
};

export default SimpleGraph;
