export function capitalizeFirstLetters(str: string): string {
	if (str.length === 0) return str;
	// capitalize first letter and anything following a hyphen
	return str.replace(/(^|-)(\w)/g, (_, sep: string, char: string) => sep + char.toUpperCase());
}

export function infinityToUnicode(inf: number): "\u221E" | "-\u221E" {
	if (inf === Infinity) {
		return "\u221E";
	} else {
		return "-\u221E";
	}
}
