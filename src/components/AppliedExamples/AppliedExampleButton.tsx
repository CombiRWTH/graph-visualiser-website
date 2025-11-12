import { useNavigate } from "react-router-dom";

export default function AppliedExampleButton(): JSX.Element {
	const navigate = useNavigate();

	return (
		<>
			<button
				className="btn btn-primary flex h-full flex-col items-center justify-center gap-2 p-4"
				onClick={() => {
					navigate("applied-examples");
				}}
			>
				Fun with Mazes!
			</button>
		</>
	);
}
