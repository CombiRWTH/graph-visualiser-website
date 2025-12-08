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
			className="hover:bg-primary-focus card flex w-full max-w-96 cursor-pointer items-center gap-5 bg-primary p-5 shadow-xl transition-transform hover:-translate-y-2 "
			onClick={() => {
				navigate(`/graph-select/${algorithm.name.toLowerCase()}`);
			}}
		>
			<div className={"flex w-full flex-col items-center "}>
				<h1 className="card-title text-2xl font-normal text-primary-content lg:text-xl">{algorithm.name}</h1>
			</div>
		</div>
	);
}
