import React, { useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

// Context for the toolbar
interface IToolbarContext {
	orientation: "horizontal" | "vertical";
	items: Array<{
		id: string;
		timestamp?: Date;
		groupId: string;
		active: boolean;
		onChange?: (active: boolean) => void;
		exclusive: boolean;
	}>;
	groups: Array<{
		id: string;
		maxActiveItems: number | null;
		exclusive: boolean;
	}>;
	addItem: (
		id: string,
		groupId: string,
		active: boolean,
		exclusive: boolean,
		onChange?: (active: boolean) => void
	) => void;
	removeItem: (id: string) => void;
	addGroup: (id: string, exclusive: boolean, maxActiveItems: number | null) => void;
	removeGroup: (id: string) => void;
	isActive: (id: string) => boolean;
	setActive: (id: string) => void;
	setNotActive: (id: string) => void;
}

export const ToolbarContext = React.createContext<IToolbarContext | null>(null);

interface IToolbarProps {
	orientation?: "horizontal" | "vertical";
	className?: string;
	children?: React.ReactNode;
}

/**
 * Toolbar component
 * @param orientation The orientation of the toolbar - horizontal or vertical
 * @param size The size of the toolbar - small, medium, or large
 * @param className CSS classes to override the default styling
 * @param children Child components
 * @constructor
 */
function Toolbar({ orientation = "horizontal", className, children }: IToolbarProps): React.JSX.Element {
	const [items, setItems] = useState<IToolbarContext["items"]>([]);
	const [groups, setGroups] = useState<IToolbarContext["groups"]>([]);

	const addItem = (
		id: string,
		groupId: string,
		active: boolean,
		exclusive: boolean,
		onChange?: (active: boolean) => void
	): void => {
		setItems((prevItems) => [
			...prevItems,
			{
				id,
				groupId,
				active,
				onChange,
				exclusive,
			},
		]);
	};

	const setActive = useCallback(
		(id: string): void => {
			setItems((prevItems) => {
				const item = prevItems.find((item) => item.id === id);

				// Activate the item
				if (item?.groupId != null && groups.find((group) => group.id === item.groupId)?.maxActiveItems !== 0) {
					item.active = true;
					item.timestamp = new Date();
					item.onChange?.(true);
				}
				// If the group has a max active limit of 0 just call the onChange function with false
				else if (
					item?.groupId != null &&
					groups.find((group) => group.id === item.groupId)?.maxActiveItems === 0
				) {
					item.onChange?.(false);
					return [...prevItems];
				} else {
					return [...prevItems];
				}

				// If the item is exclusive, deactivate all other items in the group
				if (item?.exclusive) {
					prevItems.forEach((otherItem) => {
						if (otherItem.groupId === item.groupId && otherItem.id !== item.id) {
							otherItem.active = false;
							otherItem.timestamp = undefined;
							otherItem.onChange?.(false);
						}
					});
				} else {
					// If the item is not exclusive, check if the group has a max active limit and deactivate the oldest item if necessary
					const group = groups.find((group) => group.id === item?.groupId);
					if (group?.maxActiveItems != null) {
						const activeItems = prevItems.filter((item) => item.groupId === group.id && item.active);
						if (activeItems.length > group.maxActiveItems) {
							const oldestItem = activeItems.sort(
								(a, b) =>
									(a.timestamp?.getTime() ?? new Date().getTime()) -
									(b.timestamp?.getTime() ?? new Date().getTime())
							)[0];
							oldestItem.active = false;
							oldestItem.timestamp = undefined;
							oldestItem.onChange?.(false);
						}
					}

					// If the group is exclusive, deactivate all other items of other groups
					if (group?.exclusive === true) {
						prevItems.forEach((otherItem) => {
							if (otherItem.groupId !== item.groupId) {
								otherItem.active = false;
								otherItem.timestamp = undefined;
								otherItem.onChange?.(false);
							}
						});
					}
				}

				return [...prevItems];
			});
		},
		[items, groups]
	);

	const removeItem = (id: string): void => {
		setItems((prevItems) => prevItems.filter((item) => item.id !== id));
	};

	const addGroup = (id: string, exclusive: boolean, maxActiveItems: number | null): void => {
		setGroups((prevGroups) => [...prevGroups, { id, maxActiveItems, exclusive }]);
	};

	const removeGroup = (id: string): void => {
		setGroups((prevGroups) => prevGroups.filter((group) => group.id !== id));
	};

	const isActive = (id: string): boolean => {
		const item = items.find((item) => item.id === id);
		return item?.active ?? false;
	};

	const setNotActive = (id: string): void => {
		setItems((prevItems) => {
			const item = prevItems.find((item) => item.id === id);
			if (item != null) {
				item.active = false;
				item.timestamp = undefined;
				item.onChange?.(false);
			}
			return [...prevItems];
		});
	};

	const contextValue = {
		orientation,
		items,
		groups,
		addItem,
		removeItem,
		addGroup,
		removeGroup,
		isActive,
		setActive,
		setNotActive,
	};

	return (
		<ToolbarContext.Provider value={contextValue}>
			<div
				className={twMerge(
					className,
					"bg-base-300 z-40 rounded-xl p-1 flex justify-center items-center gap-1",
					orientation === "horizontal" && "flex-row",
					orientation === "vertical" && "flex-col"
				)}
			>
				{children}
			</div>
		</ToolbarContext.Provider>
	);
}

interface IToolbarGroupProps {
	className?: string;
	children?: React.ReactNode;
	maxActiveItems?: number;
	exclusive?: boolean;
}

/**
 * Toolbar group component
 * @param className CSS classes to override the default styling
 * @param children Child components
 * @param maxActiveItems The maximum number of active items in the group
 * @param exclusive Whether the group is exclusive or not - if true, selecting an item will deactivate all other items outside the group
 * @constructor
 */
function ToolbarGroup({ className, children, maxActiveItems, exclusive }: IToolbarGroupProps): React.JSX.Element {
	const id = useRef<string>(
		typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
			? crypto.randomUUID()
			: Math.random().toString(36).substring(2)
	);

	const context = React.useContext(ToolbarContext);

	if (context === null) {
		throw new Error("ToolbarGroup must be a child of Toolbar");
	}

	// Register the group with the context
	useEffect(() => {
		context.addGroup(id.current, exclusive ?? false, maxActiveItems ?? null);
		return () => {
			context.removeGroup(id.current);
		};
	}, []);

	const { orientation } = context;

	const groupClassName = twMerge(
		"flex gap-1 justify-center items-center",
		orientation === "horizontal" && "flex-row",
		orientation === "vertical" && "flex-col",
		className
	);

	const childrenWithProps = React.Children.map(children, (child) => {
		// Checking isValidElement is the safe way and avoids a
		// typescript error too.
		if (React.isValidElement(child)) {
			// @ts-expect-error - groupId is not a valid prop for this component
			return React.cloneElement(child, { groupId: id.current });
		}
		return child;
	});

	return <div className={groupClassName}>{childrenWithProps}</div>;
}

interface IToolbarItemProps {
	className?: string;
	customContent?: boolean;
	children?: React.ReactNode;
	icon?: React.ReactNode;
	asChild?: boolean;
	onChange?: (active: boolean) => void;
	active?: boolean;
	exclusive?: boolean;
	groupId?: string;
	hint?: string;
	disabled?: boolean;
	onClick?: () => void;
}

/**
 * Toolbar item component
 * @param className CSS classes to override the default styling
 * @param children Child components if asChild is true
 * @param icon Icon component to display if asChild is false
 * @param asChild If true, children will be displayed instead of the icon
 * @param groupId The group id to associate this item with - will be set automatically
 * @param active Whether the item is active or not
 * @param exclusive Whether the item is exclusive or not - if true, the item will deactivate all other items in the group when clicked
 * @param onChange Callback when the item is clicked
 * @param hint Hint text to display when hovering over the item
 * @param disabled Whether the item is disabled or not
 * @param onClick Callback when the item is clicked
 * @constructor
 */
function ToolbarItem({
	className,
	customContent = false,
	children,
	icon,
	asChild = false,
	groupId,
	active,
	exclusive,
	onChange,
	hint,
	disabled,
	onClick,
}: IToolbarItemProps): React.JSX.Element {
	const id = useRef<string>(
		typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
			? crypto.randomUUID()
			: Math.random().toString(36).substring(2)
	);

	const context = React.useContext(ToolbarContext);

	if (context === null) {
		throw new Error("ToolbarItem must be a child of Toolbar");
	}

	// Register the item with the context
	useEffect(() => {
		context.addItem(id.current, groupId ?? "", active ?? false, exclusive ?? false, onChange);
		return () => {
			context.removeItem(id.current);
		};
	}, [onChange]);

	const { orientation } = context;
	const isActive = active !== false && context.isActive(id.current);

	const tooltipClassName = twMerge(
		"tooltip",
		orientation === "vertical" && "tooltip-right",
		orientation === "horizontal" && "tooltip-bottom"
	);

	const itemClassName = twMerge(
		"flex items-center justify-center p-1 rounded-md mx-0.5",
		orientation === "horizontal" && "flex-row",
		orientation === "vertical" && "flex-col",
		isActive ? "bg-primary text-primary-content" : "hover:bg-base-300",
		disabled === true && "cursor-not-allowed opacity-25 hover:bg-transparent",
		className
	);

	if (asChild) {
		if (customContent) {
			return (
				<div
					className={tooltipClassName}
					data-tip={hint}
				>
					<div className={itemClassName}>{children}</div>
				</div>
			);
		} else {
			return (
				<div
					className={tooltipClassName}
					data-tip={hint}
				>
					<button
						className={itemClassName}
						disabled={disabled}
						onClick={() => {
							isActive ? context?.setNotActive(id.current) : context?.setActive(id.current);
							onClick?.();
						}}
					>
						{children}
					</button>
				</div>
			);
		}
	}

	return (
		<div
			className={tooltipClassName}
			data-tip={hint}
		>
			<button
				className={itemClassName}
				disabled={disabled}
				onClick={() => {
					isActive ? context?.setNotActive(id.current) : context?.setActive(id.current);
					onClick?.();
				}}
			>
				{icon}
			</button>
		</div>
	);
}

interface IToolbarSeparatorProps {
	className?: string;
}

function ToolbarSeparator({ className }: IToolbarSeparatorProps): React.JSX.Element {
	const context = React.useContext(ToolbarContext);

	if (context === null) {
		throw new Error("ToolbarItem must be a child of Toolbar");
	}

	const { orientation } = context;

	const separatorClassName = twMerge(
		orientation === "horizontal" && "border-l-2 border-gray-700 h-6",
		orientation === "vertical" && "border-t-2 border-gray-700 w-6",
		className
	);

	return <div className={separatorClassName} />;
}

export { Toolbar, ToolbarItem, ToolbarGroup, ToolbarSeparator };
