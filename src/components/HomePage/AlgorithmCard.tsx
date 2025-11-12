import { IAlgorithmInformation } from "../../utils/available-algorithms";
import React, { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

export interface IAlgorithmCardProps {
	algorithm: IAlgorithmInformation;
}

/**
 * Component to display an algorithm card on the home page
 * @param algorithm The algorithm to display
 */
export function AlgorithmCard({ algorithm }: IAlgorithmCardProps): ReactElement {
	const navigate = useNavigate();

	return (
		<div
			className="
				flex 
				w-full 
				cursor-pointer 
				items-center 
				justify-center rounded-md 
				bg-base-200
				px-3 
				py-2 
				text-sm 
				transition-all
				duration-200 hover:bg-primary/20 hover:shadow-sm
			"
			onClick={() => navigate(`/graph-select/${algorithm.name.toLowerCase()}`)}
		>
			<h3 className="text-center font-medium text-base-content">{algorithm.name}</h3>
		</div>
	);
}
