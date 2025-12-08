import { Bug } from "lucide-react";
import { Modal, ModalToggle } from "../Modal";
import { useState } from "react";
import { useLocation } from "react-router-dom";

const MAILTO_EMAIL = "example@example.de";

export function FeedbackDialog(): JSX.Element {
	const [category, setCategory] = useState("bug");
	const [description, setDescription] = useState("");
	const location = useLocation();

	const id = "feedback-modal";
	const mailtoLink = `mailto:${MAILTO_EMAIL}?subject=${encodeURIComponent(`[${category}] - Graph visualisation tool`)}&body=${encodeURIComponent(`description: ${description}\nlocation: ${location.pathname}`)}`;

	return (
		<>
			<ModalToggle
				id={id}
				className="fixed bottom-6 right-6 z-50 cursor-pointer rounded-box bg-base-300 p-3 shadow-xl transition-transform hover:-translate-y-2 hover:text-primary"
			>
				<Bug />
			</ModalToggle>

			<Modal
				id={id}
				title="Feedback"
				hideClose
				body={
					<div className="flex flex-col gap-5">
						<p>Here you can report a bug or make a suggestion for improvement.</p>
						<form
							onSubmit={() => {
								// HERE YOU WOULD IMPLEMENT THE ENDPOINT CALL
								console.log("HOW DID YOU GET HERE? form submitted");
							}}
							className="flex flex-col gap-4"
						>
							<div>
								<label
									htmlFor="category"
									className="label"
								>
									<span className="label-text">Category</span>
								</label>
								<select
									id="category"
									value={category}
									onChange={(e) => setCategory(e.target.value)}
									className="select select-bordered w-full"
								>
									<option value="bug">Bug</option>
									<option value="improvement">Improvement</option>
									<option value="others">Other</option>
								</select>
							</div>
							<div>
								<label
									htmlFor="description"
									className="label"
								>
									<span className="label-text">Description</span>
								</label>
								<textarea
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={4}
									className="textarea textarea-bordered w-full"
									placeholder="Please give a detailed description!"
								/>
							</div>

							<a href={mailtoLink}>
								<button
									type="button"
									className="btn btn-primary"
								>
									Submit
								</button>
							</a>
						</form>
					</div>
				}
			/>
		</>
	);
}
