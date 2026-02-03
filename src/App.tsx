import React from "react";
import { HomePage } from "./components/HomePage/HomePage";
import { HashRouter, Route } from "react-router-dom";
import { GraphRouter } from "./routes/GraphRouter";
import { AlgorithmRouter } from "./routes/AlgorithmRouter";
import { AnimatedRoutes } from "react-animated-router";
import { PracticeRouter } from "./routes/PracticeRouter";

import "./animate.css";
import { Header } from "./components/Header";
import GraphSelectionRouter from "./routes/GraphSelectionRouter";
import GraphBuilderRouter from "./routes/GraphBuilderRouter";
import { GraphConceptTrainingPage } from "./components/ConceptTrainingPage/GraphConceptTainingPage";
// import { FeedbackDialog } from "./components/HomePage/FeedbackDialog";
import AppliedExamplePage from "./components/AppliedExamples/AppliedExamplePage";

const App: React.FC = () => (
	<HashRouter>
		<div className="relative size-full">
			<Header />

			{/* Scrollable content area */}
			<div
				className="absolute inset-x-0 overflow-y-auto"
				style={{
					top: "var(--height-navbar)",
					bottom: "3rem", // footer height
				}}
			>
				<AnimatedRoutes>
					<Route
						path="/"
						element={<HomePage />}
					/>
					<Route
						path="/:algorithm/graph"
						element={<GraphRouter />}
					/>
					<Route
						path="/:algorithm/algorithm"
						element={<AlgorithmRouter />}
					/>
					<Route
						path="/graph-select/*"
						element={<GraphSelectionRouter />}
					/>
					<Route
						path="/graph-concepts/"
						element={<GraphConceptTrainingPage />}
					/>
					<Route
						path="/graph-builder/*"
						element={<GraphBuilderRouter />}
					/>
					<Route
						path="/:algorithm/practice/*"
						element={<PracticeRouter />}
					/>
					<Route
						path="applied-examples"
						element={<AppliedExamplePage />}
					/>
				</AnimatedRoutes>
			</div>

			{/* Footer */}
			<footer className="absolute bottom-0 w-full">
				<hr className="border-t border-gray-300" />

				<div className="flex justify-end px-6 py-2 text-sm text-gray-600">
					<a
						href="https://combi.rwth-aachen.de/en/imprint"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:underline"
					>
						Imprint
					</a>
				</div>
			</footer>
		</div>
	</HashRouter>
);

export default App;
