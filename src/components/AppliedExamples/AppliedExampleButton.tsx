import { useNavigate } from "react-router-dom";

export default function AppliedExampleButton(): JSX.Element {
	const navigate = useNavigate();

	return (
		<>
			<button
				className="btn btn-primary"
				onClick={() => {
					navigate("applied-examples");
				}}
			>
				Fun with Mazes!
			</button>
		</>
	);
}
