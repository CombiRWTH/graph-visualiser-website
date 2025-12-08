import React, { ReactElement } from "react";

interface ISplitViewProps {
	children: React.ReactNode;
	className?: string;
	classNameLeft?: string;
	classNameRight?: string;
}

/**
 * SplitView that splits the children into two sides. The children will be split based on the className of the children.
 * If the screen is smaller than lg, the SplitView will be displayed as a column.
 * Available classNames are: left-header, left-body, left-footer, right-header, right-body, right-footer
 * @param children
 * @param className The className of the whole SplitView
 * @param classNameRight The className of the right side wrapper
 * @param classNameLeft The className of the left side wrapper
 */
export const SplitView = ({ children, className, classNameRight, classNameLeft }: ISplitViewProps): ReactElement => {
	const filterChildrenByClass = (filterBy: string): React.ReactNode => {
		return React.Children.map(children, (child) => {
			if (React.isValidElement(child)) {
				const classNames = child.props.className;
				if (typeof classNames === "string" && classNames.includes(filterBy)) {
					return child;
				}
			}
			return null;
		});
	};

	// --------------------------------------
	// |	left-header	|	right-header	|
	// --------------------------------------
	// |				|					|
	// |	left-body	|	right-body		|
	// |				|					|
	// --------------------------------------
	// |	left-footer	|	right-footer	|
	// --------------------------------------

	return (
		<div className={`w-full overflow-auto lg:grid lg:h-full lg:grid-cols-2 ${className ?? ""}`}>
			{/* Left Side */}
			<div className="flex flex-col items-center lg:items-end">
				<div className={`h-full items-center ${classNameLeft ?? ""}`}>
					<div className="w-full pt-3 text-center lg:pt-0">{filterChildrenByClass("left-header")}</div>
					{filterChildrenByClass("left-body")}
				</div>
				{filterChildrenByClass("left-footer")}
			</div>
			{/* Right Side */}
			<div className={`flex flex-col ${classNameRight ?? ""}`}>
				{filterChildrenByClass("right-header")}
				{filterChildrenByClass("right-body")}
				{filterChildrenByClass("right-footer")}
			</div>
		</div>
	);
};
