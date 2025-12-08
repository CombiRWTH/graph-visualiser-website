interface PseudocodeText {
	ty: "Text" | "Variable";
	value: string;
}

export type PseudocodeDescription = PseudocodeText[][];

export function renderPseudocode(line: PseudocodeText[]): string {
	let text = "";
	for (const item of line) {
		text += item.value;
	}
	return text;
}
