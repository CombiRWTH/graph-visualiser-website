import React from "react";
import { AvailableAlgorithm, IAlgorithmInformation } from "../../utils/available-algorithms";
import GraphSelectionCard from "./GraphSelectionCard";
import { TriangleAlert, Upload } from "lucide-react";
import GraphSelectionAlgorithmDialog from "./GraphSelectionAlgorithmDialog";
import { readFile } from "../../utils/files";
import { GraphTS, checkGraphForValidity } from "../../utils/graphs";
import { Modal, toggleModal } from "../Modal";
import { useNavigate } from "react-router-dom";
import { LinkTS, NodeTS } from "../../algorithms/adapter";

interface IGraphSelectionUploadCardProps {
	algorithm?: IAlgorithmInformation;
}

function GraphSelectionUploadCard({ algorithm }: IGraphSelectionUploadCardProps): React.JSX.Element {
	const navigate = useNavigate();

	const stores = Object.values(AvailableAlgorithm).map((alg) =>
		alg.useAlgorithmStore((state) => {
			return {
				...state,
				visState: state.getVisState(),
			};
		})
	);

	let setNewGraph = stores[0].setNewGraph;

	function handleClick(algorithm: IAlgorithmInformation | undefined): void {
		if (algorithm !== undefined) {
			const index = Object.values(AvailableAlgorithm).findIndex((alg) => alg.name === algorithm.name);
			navigate(`/${algorithm.name.toLowerCase()}/graph`);
			setNewGraph = stores[index].setNewGraph;
		}
	}

	if (algorithm !== undefined) {
		return (
			<>
				<Modal
					id={"invalid-graph-modal"}
					className="w-full max-w-2xl md:max-w-4xl lg:max-w-6xl"
					body={
						<div className="flex">
							<TriangleAlert className="mx-8 text-error" />
							<h1> The graph you uploaded is empty or ill-formed.</h1>
						</div>
					}
				/>
				<GraphSelectionCard>
					<label
						htmlFor="file-input"
						className="flex size-full min-h-[200px] cursor-pointer flex-col items-center justify-center gap-2"
					>
						<Upload className="size-16" />
						<h3 className="text-1xl card-title font-normal">Upload your graph</h3>
					</label>
				</GraphSelectionCard>
				<input
					id="file-input"
					className="hidden"
					accept=".json,application/JSON"
					type="file"
					onChange={(e) =>
						e.target.files !== null &&
						readFile(e.target.files[0], (json: GraphTS<NodeTS, LinkTS>) => {
							if (!checkGraphForValidity(json) || json.nodes.length === 0) {
								toggleModal("invalid-graph-modal");
								e.preventDefault();
								e.stopPropagation();
								return;
							}
							const index = Object.values(AvailableAlgorithm).findIndex(
								(alg) => alg.name === algorithm.name
							);
							stores[index].setNewGraph(json);
							const graphString = JSON.stringify(json);
							localStorage.setItem("currentGraph", graphString);
							navigate(`/${algorithm.name.toLowerCase()}/graph`);
						})
					}
				/>
			</>
		);
	}

	return (
		<GraphSelectionAlgorithmDialog
			includeNone={false}
			callbackFn={(algorithm) => {
				handleClick(algorithm);
			}}
			cid="upload-graph"
			trigger={
				<>
					<Modal
						id={"invalid-graph-modal"}
						className="w-full max-w-2xl md:max-w-4xl lg:max-w-6xl"
						body={
							<div className="flex">
								<TriangleAlert className="mx-8 text-error" />
								<h1> The graph you uploaded is empty or ill-formed.</h1>
							</div>
						}
					/>
					<GraphSelectionCard>
						<label
							htmlFor="file-input"
							className="flex h-full min-h-[200px] cursor-pointer flex-col items-center justify-center gap-2"
						>
							<Upload className="size-16" />
							<h3 className="text-1xl card-title font-normal">Upload your graph</h3>
						</label>
					</GraphSelectionCard>
					<input
						id="file-input"
						className="hidden"
						accept=".json,application/JSON"
						type="file"
						onChange={(e) =>
							e.target.files !== null &&
							readFile(e.target.files[0], (json: GraphTS<NodeTS, LinkTS>) => {
								if (!checkGraphForValidity(json) || json.nodes.length === 0) {
									toggleModal("invalid-graph-modal");
									e.preventDefault();
									e.stopPropagation();
									return;
								}
								toggleModal("upload-graph");
								setNewGraph(json);
							})
						}
					/>
				</>
			}
		/>
	);
}

export default GraphSelectionUploadCard;
