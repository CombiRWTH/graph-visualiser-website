import React, { ReactElement, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { capitalizeFirstLetters } from "../utils/string-utils";
import { ChevronLeft } from "lucide-react";
import { useWalkthroughStore } from "../stores/algorithm-walkthrough-store";

/**
 * The navigation bar of the application
 * It displays the logo and the current page name
 * If not on the homepage, it also displays a back button which navigates one page back in the history
 */
export const Header: React.FC = (): ReactElement => {
	const navigate = useNavigate();
	const location = useLocation();
	const [title, setTitle] = useState<string | undefined>(undefined);

	function getPageName(): string {
		const pathname: string[] = location.pathname.split("/");
		let newAlgorithm: string = capitalizeFirstLetters(pathname[1]);
		if (pathname[2] === "practice") {
			if (pathname[3] == null) {
				newAlgorithm = `${newAlgorithm} Training Selection`;
			} else {
				newAlgorithm = `${newAlgorithm} ${capitalizeFirstLetters(pathname[3].replace("step-by-step", "Step"))} Training`;
			}
		} else if (pathname[2] === "graph") {
			newAlgorithm = `Dive into ${newAlgorithm}`;
		} else if (pathname[2] === "algorithm") {
			newAlgorithm = `${newAlgorithm} Algorithm`;
		}
		return newAlgorithm;
	}

	// Update the algorithm when the location changes
	useEffect(() => {
		const page: string = getPageName();
		switch (page) {
			case "":
				setTitle(undefined);
				break;
			case "Graph-Builder":
				setTitle("Graph Builder");
				break;
			case "Graph-Select":
				setTitle("Graph Selection");
				break;
			case "Graph-Concepts":
				setTitle("Graph Concepts Training");
				break;
			case "Applied-Examples":
				setTitle("Fun with Mazes");
				break;
			default:
				setTitle(page.charAt(0).toUpperCase() + page.slice(1));
		}
	}, [location]);

	const { setShowAlgoWalkthrough } = useWalkthroughStore();

	return (
		/* Header：
		---------------------------------------------------------
		|navbar-start|        navbar-center          |navbar-end|
		---------------------------------------------------------
		putting the Component into the blocks */
		<nav className="navbar sticky top-0 z-10 h-12 min-h-12 bg-base-300 sm:h-16">
			<div className={"navbar-start flex items-center"}>
				<img
					src={`${import.meta.env.BASE_URL}logo.svg`}
					alt={"logo"}
					className={"mr-2 size-8 cursor-pointer sm:mr-4 sm:size-10"}
					onClick={() => {
						setShowAlgoWalkthrough(false);
						navigate("/");
					}}
				/>
				<button
					className={`hidden md:block ${title == null ? "hidden" : ""}`}
					onClick={() => {
						setShowAlgoWalkthrough(false);
						navigate(-1);
					}}
				>
					<ChevronLeft className="size-8 cursor-pointer" />
				</button>
			</div>
			{title != null ? (
				<h1 className={"navbar-center text-2xl"}>{capitalizeFirstLetters(title)}</h1>
			) : (
				<h1
					className="navbar-center text-2xl"
					onClick={() => navigate("/")}
				>
					Graph Algorithm Visualiser
				</h1>
			)}
			<div className={"navbar-end"}></div>
		</nav>
	);
};
