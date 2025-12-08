import React, { useState } from "react";
import { twMerge } from "tailwind-merge";

interface IGraphSelectionCategoryProps {
	name: string;
	collapsible?: boolean;
	collapsed?: boolean;
	children: React.ReactNode;
	rankingSelector?: React.ReactNode;
}

function GraphSelectionCategory({
	name,
	collapsible = true,
	collapsed = false,
	children,
	rankingSelector,
}: IGraphSelectionCategoryProps): React.JSX.Element {
	const [isCollapsed, setIsCollapsed] = useState(collapsed);

	return (
		<div className="flex w-full justify-center">
			<div className="container mx-4 mt-6">
				<div className={twMerge(collapsible && "collapse collapse-arrow", "w-full")}>
					{collapsible && (
						<input
							type="checkbox"
							checked={!isCollapsed}
							onChange={() => setIsCollapsed(!isCollapsed)}
						/>
					)}
					<div
						className={twMerge(
							"collapse-title text-xl font-medium border-b-2 border-secondary p-2 cursor-pointer",
							collapsed ? "collapse-close" : "collapse-open"
						)}
					>
						{name}
					</div>
					<div className="collapse-content relative">
						{Boolean(rankingSelector) && <div className="mb-4">{rankingSelector}</div>}
						<div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
							{children}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default GraphSelectionCategory;
