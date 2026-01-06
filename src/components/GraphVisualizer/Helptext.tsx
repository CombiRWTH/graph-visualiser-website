import React, { useState } from "react";
import { CircleHelp } from "lucide-react";

interface HelptextProps {
	helptext: string;
}
/**
 * The helptext component which will display the text for each step of the algorithm if the help icon on the graph card is clicked
 * @param helptext The helptext to display
 */
export const Helptext: React.FC<HelptextProps> = ({ helptext }) => {
	const [visible, setVisible] = useState<boolean>(true);
	return (
		<div className="ml-auto flex w-fit max-w-md flex-row">
			<div
				className={`mr-5 rounded-2xl bg-secondary p-4 text-sm text-secondary-content transition-all ${
					visible && helptext !== "" ? "" : "translate-y-[calc(100%+1.25rem)]"
				}`}
			>
				{helptext}
			</div>
			<CircleHelp
				className={`size-6 shrink-0 cursor-pointer self-end ${!visible ? "opacity-40" : ""}`}
				onClick={() => setVisible(!visible)}
			/>
		</div>
	);
};
