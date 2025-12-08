import React from "react";
import "intro.js/introjs.css";
import { Code, Info } from "lucide-react";
import { IAlgorithmStore } from "../algorithms/algorithm-interfaces";
import { Modal, ModalToggle } from "./Modal";
import { CodeViewer } from "./CodeViewer/CodeViewer";
import { useTrainingStagesStore } from "../hooks/TrainingStagesStore";

interface ITrainingFormHeaderProps {
	title: string;
	children?: React.ReactNode;
}
export const TrainingFormHeader: React.FC<ITrainingFormHeaderProps> = ({ title, children }) => {
	return (
		<div className="flex flex-row justify-between gap-4 rounded-t-box bg-base-300 p-2 md:p-4">
			<h1 className="md:text-l text-center text-sm font-bold sm:text-base lg:text-xl xl:text-2xl ">{title}</h1>
			<div className="flex flex-row flex-wrap items-center justify-center gap-4">{children}</div>
		</div>
	);
};

interface ITrainingFormContentProps {
	children?: React.ReactNode;
}
export const TrainingFormContent: React.FC<ITrainingFormContentProps> = ({ children }) => {
	return (
		<div className="flex w-full grow basis-40 overflow-auto py-2">
			<div className="my-auto flex w-full flex-col items-center">{children}</div>
		</div>
	);
};

interface ITrainingFormFooterProps {
	children?: React.ReactNode;
}
export const TrainingFormFooter: React.FC<ITrainingFormFooterProps> = ({ children }) => {
	return (
		<div className="flex flex-row flex-wrap justify-center gap-2 rounded-b-box border-t-2 border-white/10 bg-base-300 p-2">
			{children}
		</div>
	);
};

interface IBasicTrainingFormProps {
	onSubmit: () => void;
	children?: React.ReactNode;
}
export const BasicTrainingForm: React.FC<IBasicTrainingFormProps> = ({ onSubmit, children }) => {
	return (
		<form
			onSubmit={onSubmit}
			className="card flex flex-1 flex-col bg-base-100 shadow-2xl"
		>
			{children}
		</form>
	);
};

interface ITrainingFormProps {
	onSubmit: () => void;
	useAlgorithmStore: (fn: (state: IAlgorithmStore) => Partial<IAlgorithmStore>) => IAlgorithmStore;
	children?: React.ReactNode;
	controls?: React.ReactNode;
	feedback?: React.ReactNode;
}
export const TrainingForm: React.FC<ITrainingFormProps> = ({
	onSubmit,
	useAlgorithmStore,
	children,
	controls,
	feedback,
}) => {
	const { pseudoCode }: IAlgorithmStore = useAlgorithmStore((state) => ({
		...state,
	}));

	const { getCurrentStage } = useTrainingStagesStore();

	return (
		getCurrentStage() !== undefined && (
			<>
				<Modal
					id="hint-modal"
					className="overflow-visible"
					body={
						<div className="full-width">
							<CodeViewer
								className="full-width"
								lines={pseudoCode!}
								controller={false}
							/>
						</div>
					}
				/>

				<Modal
					id="info-modal"
					className="overflow-visible"
					body={
						<>
							<h3 className="text-lg font-bold text-primary">
								<Info />
							</h3>
							<p className="py-4">{getCurrentStage()!.info}</p>
						</>
					}
				/>

				{/* Training form */}
				<BasicTrainingForm onSubmit={onSubmit}>
					{/* Header */}
					<TrainingFormHeader title={getCurrentStage()!.title}>
						{/* Info */}
						{getCurrentStage()!.info !== undefined && (
							<ModalToggle
								id="info-modal"
								className="flex flex-row items-center"
							>
								<div className="cursor-pointer hover:text-primary">
									<Info />
								</div>
							</ModalToggle>
						)}
						{/* Hint */}
						<ModalToggle
							id="hint-modal"
							className="flex flex-row items-center"
						>
							<div className="cursor-pointer hover:text-primary">
								<Code />
							</div>
						</ModalToggle>
					</TrainingFormHeader>
					{/* children should contain TrainingFormContent and TrainingFormFooter */}
					<TrainingFormContent>{children}</TrainingFormContent>
					{feedback}
					{controls !== undefined && <TrainingFormFooter>{controls}</TrainingFormFooter>}
				</BasicTrainingForm>
			</>
		)
	);
};
