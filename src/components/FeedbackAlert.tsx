import { AnimatePresence, motion } from "framer-motion";

export interface Feedback {
	isAnswerCorrect: boolean;
	feedbackText?: string;
}

interface FeedbackAlertProps {
	feedback: Feedback;
	isFeedbackVisible?: boolean;
}

export const FeedbackAlert: React.FC<FeedbackAlertProps> = ({ feedback, isFeedbackVisible = true }) => {
	const text: string = feedback.isAnswerCorrect ? "Correct!" : `${feedback.feedbackText ?? "Wrong!"}`;
	const alertType = feedback.isAnswerCorrect ? "alert-success" : "alert-error";

	return (
		<AnimatePresence>
			{isFeedbackVisible && (
				<motion.div
					initial={{ minHeight: 0, height: 0, overflow: "hidden" }}
					animate={{ height: "auto" }}
					exit={{ minHeight: 0, height: 0 }}
				>
					<div className="w-full px-2 pb-2">
						<div className={`alert ${alertType}`}>
							<span>{text}</span>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
