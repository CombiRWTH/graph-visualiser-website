import React from "react";
import { Info } from "lucide-react";
import { ModalKit } from "./Modal";
/*
The InfoTooltip is placed on the AlgorithmPages (bottom left corner) to give the user some information about the algorithm's functionalities.
The tooltip content is set within each AlgorithmPage and replaces the ReactNode {children}.
You can find more information about react-tooltip on https://react-tooltip.com.
 */

interface InfoTooltipProps {
	children: React.ReactNode;
	title: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ children, title }: InfoTooltipProps) => {
	return (
		<div className="group relative">
			<ModalKit
				id="algorithm-Introduction"
				title={title}
				body={<div className="flex flex-col text-sm">{children}</div>}
			>
				<Info className="size-6 opacity-80 group-hover:opacity-100" />
			</ModalKit>
		</div>
	);
};
