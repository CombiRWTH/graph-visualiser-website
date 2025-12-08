import React, { useState } from "react";
import { useDebounce } from "react-use";
import { Pencil } from "lucide-react";

interface IGraphNameInputProps {
	name: string;
	onChange: (name: string) => void;
}

function GraphNameInput({ name, onChange }: IGraphNameInputProps): React.JSX.Element {
	const [editMode, setEditMode] = useState(false);
	const [inputValue, setInputValue] = useState(name);

	useDebounce(
		() => {
			onChange(inputValue);
		},
		500,
		[inputValue]
	);

	return (
		<div className="absolute left-4 top-2 z-10 size-fit">
			{editMode ? (
				<input
					type="text"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							setEditMode(false);
						}
					}}
					onBlur={() => setEditMode(false)}
					autoFocus
					className="input"
				/>
			) : (
				<div
					className="flex items-center"
					onClick={() => setEditMode(true)}
				>
					<h1 className="cursor-text font-bold">{inputValue}</h1>
					<Pencil className="ml-2 size-4 cursor-pointer" />
				</div>
			)}
		</div>
	);
}

export default GraphNameInput;
