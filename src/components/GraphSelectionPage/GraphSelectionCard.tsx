import React, { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { IGraphStorage } from "../../types/graph";
import { PenIcon, PlusCircleIcon, Trash2 } from "lucide-react";
import Graphin, { Behaviors } from "@antv/graphin";
import GraphFitView from "../GraphFitView";
import { getDaisyuiColor, ThemeColor } from "../../utils/daisyui-colors";
import { ILayoutAlgorithm } from "../../algorithms/algorithm-interfaces";
import { graphLayouts } from "../../utils/layouts";

interface IGraphSelectionCardProps {
	graph?: Partial<IGraphStorage>;
	deletable?: boolean;
	children?: React.ReactNode;
	onClick?: () => void;
	className?: string;
	onDelete?: () => void;
	layout?: ILayoutAlgorithm;
}

function GraphSelectionCard({
	graph,
	children,
	onClick,
	className,
	deletable = false,
	onDelete,
	layout,
}: IGraphSelectionCardProps): React.JSX.Element {
	const containerRef = useRef<HTMLDivElement>(null);
	const [init, setInit] = useState(false);

	const { ZoomCanvas, DragCanvas, DragNode } = Behaviors;

	useEffect(() => {
		setInit(true);
	}, []);

	const colorBaseContent = getDaisyuiColor(ThemeColor.BASE_CONTENT);
	return (
		<div
			className={twMerge(
				"input:an custom-btn-card card overflow-visible flex w-full cursor-pointer items-center gap-5 bg-base-300 text-base-content shadow-xl transition-transform hover:-translate-y-3 hover:bg-base-300-focus hover:overflow-visible",
				className
			)}
			onClick={() => {
				onClick?.();
			}}
			ref={containerRef}
		>
			{children !== undefined ? (
				children
			) : (
				<div className="relative flex min-h-[200px] grow flex-col">
					<div className="flex max-h-[200px] cursor-pointer overflow-hidden rounded-2xl">
						{init && (
							<Graphin
								data={graph?.graph ?? { nodes: [], edges: [] }}
								width={containerRef.current?.clientWidth ?? 300}
								height={180}
								theme={{
									mode: "dark",
									background: "hsla(0, 0%, 100%, 0)",
									primaryColor: colorBaseContent,
									primaryEdgeColor: colorBaseContent,
								}}
								layout={layout ?? graphLayouts.Free}
								defaultNode={{
									// @ts-expect-error Wrong type definition in library
									style: {
										label: {
											position: "center",
											offset: [0, 6.5],
										},
										keyshape: {
											size: 50,
										},
									},
								}}
								animate={false}
							>
								<ZoomCanvas disabled />
								<DragCanvas disabled />
								<DragNode disabled />
								<GraphFitView />
							</Graphin>
						)}
					</div>
					<div className="group absolute bottom-0 w-full rounded-b-2xl bg-base-200/30 px-4 py-2 backdrop-blur-md">
						<div className="flex flex-col gap-1 opacity-100">
							<h1 className="card-title text-xl font-normal">{graph?.name}</h1>
							{graph?.description !== undefined && (
								// <p className="text-sm line-clamp-1 text-neutral-content/70">{graph.description}</p>
								<p className="line-clamp-2 text-sm leading-snug text-base-content/70 transition-all duration-300 group-hover:line-clamp-none">
									{graph.description}
								</p>
							)}
							<div className="flex justify-between gap-1">
								{graph?.createdAt != null && (
									<span className="flex items-center gap-1 text-sm">
										<PlusCircleIcon className="size-3" />{" "}
										{new Date(graph?.createdAt ?? Date.now()).toDateString()}
									</span>
								)}
								{graph?.updatedAt != null && (
									<span className="flex items-center gap-1 text-sm">
										<PenIcon className="size-3" />{" "}
										{new Date(graph?.createdAt ?? Date.now()).toDateString()}
									</span>
								)}
							</div>
						</div>
					</div>
					{deletable && (
						<div
							className="absolute right-1 top-1"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<div className="dropdown dropdown-end z-30 ">
								<div
									className="btn btn-circle btn-ghost hover:bg-error hover:text-error-content"
									onClick={() => {
										onDelete?.();
									}}
								>
									<Trash2 />
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default GraphSelectionCard;
