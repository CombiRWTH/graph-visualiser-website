import { GraphTS } from "../utils/graphs";
import { LinkTS, NodeTS } from "../algorithms/adapter";
import { parse, formatHex } from "culori";

export function saveJSON(name: string, data: GraphTS<NodeTS, LinkTS>): void {
	const element = document.createElement("a");
	const file = new Blob([JSON.stringify(data)], { type: "text/plain" });
	element.href = URL.createObjectURL(file);
	element.download = name;
	element.click();
}

export function readFile(file: File, callback: (json: GraphTS<NodeTS, LinkTS>) => void): void {
	if (file.type !== "application/json") return;

	const reader = new FileReader();
	reader.readAsText(file, "UTF-8");

	reader.onload = (eReader) => callback(JSON.parse(eReader?.target?.result as string));
}

export function saveTex(name: string, data: GraphTS<NodeTS, LinkTS>, algorithmName: string): void {
	const element = document.createElement("a");
	const file = new Blob([graphTolatex(data, algorithmName)], { type: "text/plain" });
	element.href = URL.createObjectURL(file);
	element.download = name;
	element.click();
}

export function graphTolatex(data: GraphTS<NodeTS, LinkTS>, algorithmName: string): string {
	// TikZ doesn't support raw hex colors like #83aeda directly.
	// Instead, we define named colors using the xcolor 'HTML' model,
	// and reference them later in TikZ styles
	// This map ensures each unique hex color is declared only once
	// and provides a shorthand name for use in the LaTeX code.

	const colorMap = new Map<string, string>(); // hex -> name
	let colorIndex = 0;

	function getColorName(hex: string): string {
		if (!colorMap.has(hex)) {
			colorMap.set(hex, `c${colorIndex++}`);
		}
		return colorMap.get(hex)!;
	}

	// Build color definitions
	let colorDefinitions = "";
	for (const node of data.nodes) {
		const fill = oklchToHex(node.style?.keyshape?.fill);
		if (isHexColor(fill)) getColorName(fill!);
	}
	for (const edge of data.edges) {
		const stroke = oklchToHex(edge.style?.keyshape?.stroke);
		if (isHexColor(stroke)) getColorName(stroke!);
	}
	colorMap.forEach((name, hex) => {
		colorDefinitions += `\\definecolor{${name}}{HTML}{${hex.slice(1)}}\n`;
	});

	// Generate document
	let tikzcode = "%Add the following definitions/libraries/packages for nodes, edges and colors to your document \n";
	tikzcode += "\\documentclass{article}\n";
	tikzcode += "\\usepackage[table,xcdraw]{xcolor} % Adds HTML color support\n";
	tikzcode += "\\usepackage{tikz}\n";
	tikzcode += "\\usetikzlibrary{shapes}\n";
	tikzcode += colorDefinitions + "\n";
	tikzcode += "\\tikzset{knoten/.style={shape=circle, fill = white, minimum size = 0.75cm, draw}} \n";
	tikzcode += "\\tikzset{geKante/.style={->}} \n";
	tikzcode += "\\newcommand{\\Knoten}[4]{ \n  \\node[knoten, #4] #1 at #2 {}; \n \\node at #2 {#3}; } \n";
	tikzcode += "\\newcommand{\\KanteGew}[5]{\n  \\draw[#1] #2 -- #3 node[midway, #5] {#4};}\n\n";
	tikzcode += "\\begin{document}\n\n";
	tikzcode += "\\begin{tikzpicture} \n";
	tikzcode += translateTolatex(data, algorithmName, colorMap);
	tikzcode += "\\end{tikzpicture} \n";
	tikzcode += "\\end{document}\n\n";
	return tikzcode;
}

export function translateTolatex(
	data: GraphTS<NodeTS, LinkTS>,
	algorithmName: string,
	colorMap: Map<string, string>
): string {
	let translation = "";

	for (const node of data.nodes) {
		const fill = oklchToHex(node.style?.keyshape?.fill);
		const size = node.style?.keyshape?.size ?? 50;

		// 50 is our default size
		const sizeModifier = size !== 50 ? `, minimum size=${((0.75 * size) / 50).toFixed(2)}cm` : "";

		const color = fill === undefined ? "black" : isHexColor(fill) ? (colorMap.get(fill) ?? "black") : fill;

		const x = Math.round((node.x! / 45) * 100) / 100;
		const y = -Math.round((node.y! / 45) * 100) / 100; // Tikz canvas orientation is the other way around

		translation += `\\Knoten{(${node.id})} {(${x},${y})} {${"$" + (node.name ?? node.id) + "$"}}{draw=${color}${sizeModifier}};\n`;

		if (algorithmName === "Dijkstra") {
			if (node.dist === "∞") {
				translation += `\\draw (${node.id}.north) node[above] {$\\infty$};\n`;
			} else if (node.dist !== null && node.dist !== undefined) {
				translation += `\\draw (${node.id}.north) node[above] {${node.dist}};\n`;
			}
		}
	}

	for (const edge of data.edges) {
		const stroke = oklchToHex(edge.style?.keyshape?.stroke);
		const lineWidth = edge.style?.keyshape?.lineWidth;
		const weightStr = String(edge.weight);

		const color =
			stroke === undefined || stroke === "#2e3440"
				? "black"
				: isHexColor(stroke)
					? (colorMap.get(stroke) ?? "black")
					: stroke;

		const width = typeof lineWidth === "number" ? `, line width=${lineWidth}pt` : "";

		if (edge.isMultiple === true) {
			translation += `\\draw [->] (${edge.source}) edge[draw=${color}${width},bend right=15, sloped, below]node{${weightStr}} (${edge.target});\n`;
		} else if (edge.source === edge.target) {
			translation += `\\draw [->] (${edge.source}) edge[draw=${color}${width}, loop, above]node{${weightStr}} (${edge.target});\n`;
		} else {
			translation += `\\KanteGew{geKante, draw=${color}${width}}{(${edge.source})} {(${edge.target})}{${weightStr}}{sloped, above};\n`;
		}
	}

	return translation;
}

function isHexColor(color: string | undefined): boolean {
	return typeof color === "string" && /^#([0-9a-fA-F]{6})$/.test(color);
}

export function oklchToHex(colorString: string | undefined): string | undefined {
	if (colorString === undefined) {
		return undefined;
	}
	const parsed = parse(colorString);

	if (parsed == null) return colorString; // Not a valid color string
	if (parsed.mode !== "oklch") return colorString; // Not an oklch color

	const hex = formatHex(parsed);
	return hex;
}
