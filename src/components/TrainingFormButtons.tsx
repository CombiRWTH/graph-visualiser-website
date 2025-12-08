import {
	Check,
	ChevronRight,
	CirclePlus,
	CircleStop,
	Eraser,
	LucideIcon,
	RefreshCcw,
	SendHorizontal,
	TrophyIcon,
	X,
	CircleChevronRight,
} from "lucide-react";
import { ButtonHTMLAttributes } from "react";

interface ButtonOptions {
	buttonText?: string;
	Icon: LucideIcon;
	buttonStyle?: string;
	buttonType?: "submit" | "reset" | "button" | undefined;
}

const createButtonComponent = ({
	buttonText,
	Icon,
	buttonStyle = "btn-neutral",
	buttonType = "button",
}: ButtonOptions) => {
	return (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
		<button
			type={`${buttonType}`}
			{...props}
			className={`${buttonStyle} btn btn-sm flex items-center gap-4 text-sm md:btn-md md:text-base`}
		>
			{buttonText !== undefined && <div className="text-xs sm:text-sm">{buttonText}</div>}
			<Icon className={"size-4 sm:size-5 md:size-6 lg:size-8"} />
		</button>
	);
};
export const TrainingFormTerminateButton = createButtonComponent({ buttonText: "Done", Icon: CircleStop });
export const TrainingFormResetButton = createButtonComponent({ buttonText: "Reset", Icon: Eraser });
export const TrainingFormNewGraphButton = createButtonComponent({ buttonText: "New Graph", Icon: RefreshCcw });
export const TrainingFormNextQuestionButton = createButtonComponent({
	buttonText: "Next Question",
	Icon: CircleChevronRight,
});
export const TrainingFormContinueButton = createButtonComponent({ buttonText: "Continue", Icon: ChevronRight });
export const TrainingFormAddEdgeButton = createButtonComponent({ buttonText: "Add Edge", Icon: CirclePlus });
export const TrainingFormResultButton = createButtonComponent({ buttonText: "Result", Icon: TrophyIcon });
export const TrainingFormSubmitButton = createButtonComponent({
	buttonText: "Submit",
	Icon: SendHorizontal,
	buttonStyle: "btn-success",
	buttonType: "submit",
});
export const TrainingFormAcceptButton = createButtonComponent({ Icon: Check, buttonStyle: "btn-circle btn-success" });
export const TrainingFormRejectButton = createButtonComponent({ Icon: X, buttonStyle: "btn-circle btn-error" });
