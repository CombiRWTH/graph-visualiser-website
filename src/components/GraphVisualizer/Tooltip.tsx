import React, { useState } from "react";

interface TooltipProps {
	helptext: string;
	Trigger: JSX.Element;
	defaultOpen?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ helptext, Trigger, defaultOpen = false }) => {
	const [visible, setVisible] = useState<boolean>(defaultOpen);

	return (
		<div className="relative w-fit">
			{/* Info Icon in the Top Right */}
			{React.cloneElement(Trigger, {
				className: `absolute cursor-pointer ${!visible ? "opacity-40" : ""}`,
				onClick: () => setVisible(!visible),
			})}

			{/* Tooltip Content */}
			<div
				className={`ml-8 rounded-2xl bg-secondary p-4 text-sm text-secondary-content transition-all duration-300 ease-in-out ${
					visible && helptext !== ""
						? "translate-y-0 opacity-100"
						: "pointer-events-none translate-y-5 opacity-0"
				}`}
			>
				{helptext}
			</div>
		</div>
	);
};
