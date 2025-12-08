import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ISortableItemProps {
	id: number;

	// functions to simulate a hover behaviour
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;

	// isMarked  can be used to change the style of the item depending on the context
	isMarked?: boolean;
	disabled?: boolean;
	children: React.ReactNode;
}

/* Using the Sortable preset from dnd-kit: https://docs.dndkit.com/presets/sortable */

export const SortableItem: React.FC<ISortableItemProps> = ({
	id,
	onMouseEnter,
	onMouseLeave,
	isMarked,
	disabled,
	children,
}) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

	const findColor = (): string => {
		if (isMarked !== undefined && isMarked) {
			return "bg-primary text-primary-content";
		} else {
			return "bg-base-300 text-base-content";
		}
	};

	return (
		<li
			ref={setNodeRef}
			className={`rounded-btn ${findColor()} my-[5px] flex aspect-[10/1] w-3/5 items-center justify-between md:h-12
				${isDragging ? "z-1" : "z-0"} ${disabled === true ? "cursor-default" : ""}
			`}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
			}}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			{...attributes}
			{...listeners}
		>
			{children}
		</li>
	);
};
