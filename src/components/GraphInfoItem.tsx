import { CircleCheck, CircleX } from "lucide-react";
import React from "react";
interface GraphInfoItemProps {
	property: string;
	isFulfilled: boolean;
}

export function GraphInfoItem({ property, isFulfilled }: GraphInfoItemProps): React.JSX.Element | null {
	return (
		<li>
			<label className="cursor-default pt-2 hover:bg-transparent active:bg-transparent active:text-current">
				{isFulfilled ? <CircleCheck className="text-success" /> : <CircleX className="text-error" />}
				{property}
			</label>
		</li>
	);
}
