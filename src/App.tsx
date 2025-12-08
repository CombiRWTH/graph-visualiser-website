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
import { FeedbackDialog } from "./components/HomePage/FeedbackDialog";
import AppliedExamplePage from "./components/AppliedExamples/AppliedExamplePage";

const App: React.FC = () => (
	<HashRouter>
		{/* <div className="flex min-h-dvh w-full flex-col"> */}
		<Header />
		<FeedbackDialog />
		<AnimatedRoutes className="flex grow flex-col">
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
		{/* </div> */}
	</HashRouter>
);

export default App;
