import React, { useRef } from "react";
import { Utils } from "@antv/graphin";
import { AvailableAlgorithm, IAlgorithmInformation } from "../../utils/available-algorithms";
import { ModalKit } from "../Modal";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface IGraphSelectionAlgorithmDialogProps {
	trigger: React.ReactElement;
	includeNone?: boolean;
	callbackFn?: (algorithm: IAlgorithmInformation | undefined) => void;
	disabledAlgorithms?: string[];
	cid?: string;
}

function GraphSelectionAlgorithmDialog({
	trigger,
	includeNone,
	callbackFn,
	disabledAlgorithms,
	cid,
}: IGraphSelectionAlgorithmDialogProps): React.JSX.Element {
	const id = useRef(cid ?? Utils.uuid());

	const algs: Array<{
		name: string;
		algorithms: IAlgorithmInformation | undefined;
	}> = [];
	Object.values(AvailableAlgorithm).forEach((alg) => {
		algs.push({ name: alg.name, algorithms: alg });
	});

	if (includeNone === true) {
		algs.push({ name: "Universal (No restrictions)", algorithms: undefined });
	}

	function isDisabled(algorithm: string): boolean {
		if (disabledAlgorithms === undefined) return false;
		return disabledAlgorithms.includes(algorithm);
	}

	return (
		<ModalKit
			id={id.current}
			title="Choose an algorithm"
			body={
				<div className="flex flex-col gap-5">
					{algs.map((alg) => (
						<div
							key={alg.name}
							className={twMerge(
								"btn flex items-center justify-between rounded-lg bg-base-300",
								isDisabled(alg.name) ? "opacity-50 cursor-not-allowed" : "hover:base-300-dark"
							)}
							onClick={() => {
								if (!isDisabled(alg.name)) callbackFn?.(alg.algorithms);
							}}
						>
							{isDisabled(alg.name) ? (
								<div
									className="tooltip flex w-full items-center justify-between"
									data-tip="Algorithm not available - Graph does not meet requirements"
								>
									<span>{alg.name}</span>
									<AlertTriangle className="size-6 text-yellow-400" />
								</div>
							) : (
								<>
									<span>{alg.name}</span>
									<ArrowRight className="size-6" />
								</>
							)}
						</div>
					))}
				</div>
			}
		>
			{trigger}
		</ModalKit>
	);
}

export default GraphSelectionAlgorithmDialog;
