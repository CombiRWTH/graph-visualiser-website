import React, { useEffect, useState } from "react";
import Latex from "react-latex-next";
import { PseudocodeDescription, renderPseudocode } from "../../algorithms/pseudocode";
import { IAlgorithmStore } from "../../algorithms/algorithm-interfaces";
import { Controller } from "./Controller";
import { displayVariables } from "../../utils/display-variables";
import { IAlgorithmInformation } from "../../utils/available-algorithms";

interface CodeViewerProps {
	algorithm?: IAlgorithmInformation;
	className?: string;
	lines: PseudocodeDescription;
	selectedLine?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	useAlgorithmStore?: (fn: (state: IAlgorithmStore) => any) => any;
	controller?: boolean;
	classNameController?: string;
	classNameViewVariables?: string;
}

/**
 * Shows a code block and optional highlights one line in the code
 * @param lines a list of strings each containing one line of code
 * @param selectedLine zero-based number which line should be highlighted
 * @param className
 * @param useAlgorithmStore
 * @param controller
 * @returns the react component
 */
export const CodeViewer: React.FC<CodeViewerProps> = ({
	lines,
	selectedLine,
	className,
	algorithm,
	useAlgorithmStore,
	controller = true,
	classNameController = "",
	classNameViewVariables = "",
}: CodeViewerProps) => {
	const getVisState =
		useAlgorithmStore !== null && useAlgorithmStore !== undefined
			? useAlgorithmStore((state: IAlgorithmStore) => state.getVisState)
			: undefined;

	function countAndRemoveLeadingSpaces(input: string): number {
		const leadingSpaces: RegExpMatchArray | null = input.match(/^ */);
		return leadingSpaces != null ? leadingSpaces[0].length : 0;
	}

	const currentLine: React.RefObject<HTMLPreElement> = React.createRef();

	useEffect(() => {
		currentLine.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}, [currentLine]);

	const [viewVariables, setViewVariables] = useState<boolean>(false);

	return (
		<div
			className={`before:content-none! mockup-code flex flex-col pb-0 ${className ?? ""}`}
			style={{ scrollbarWidth: "thin" }}
		>
			<div className={"my-4 grow overflow-y-auto"}>
				{lines.map((line, i) => {
					const blanks: number = countAndRemoveLeadingSpaces(line[0].value);
					return (
						<pre
							className={
								i === selectedLine
									? "mb-1 w-full bg-warning text-warning-content before:!content-none"
									: "mb-1 before:!content-none"
							}
							style={{ scrollSnapAlign: "start" }}
							key={i}
							ref={i === selectedLine ? currentLine : undefined}
						>
							<code className={"whitespace-pre-wrap text-sm before:!content-none sm:text-base"}>
								<div
									className={"grid"}
									style={{ gridTemplateColumns: "3rem auto" }}
								>
									<div className={"w-12 text-right"}>{i + 1}: </div>
									{
										<div style={{ marginLeft: `${blanks * 10}px` }}>
											<Latex>{renderPseudocode(line).substring(blanks)}</Latex>
										</div>
									}
								</div>
							</code>
						</pre>
					);
				})}
			</div>
			<>
				{algorithm !== null && algorithm !== undefined && viewVariables && (
					<div className={"bg-secondary pl-5 text-secondary-content"}>
						<pre>
							<Latex>{displayVariables(algorithm.name, getVisState)}</Latex>
						</pre>
					</div>
				)}
			</>
			<>
				{controller && useAlgorithmStore !== undefined && (
					<Controller
						useAlgorithmStore={useAlgorithmStore}
						currentLine={selectedLine}
						viewVariablesChecked={viewVariables}
						onViewVariablesChange={setViewVariables}
						className={classNameController}
						classNameViewVariables={classNameViewVariables}
					/>
				)}
			</>
		</div>
	);
};
