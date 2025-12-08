// Get the base-content, success and error colours defined by daisyui css in hsl format
// To read documentation for these daisy-ui colors, make sure to look at the right daisy-ui version
// (currently https://v2.daisyui.com/docs/colors/)

export enum ThemeColor {
	PRIMARY = "p",
	PRIMARY_FOCUS = "pf",
	PRIMARY_CONTENT = "pc",
	SECONDARY = "s",
	SECONDARY_FOCUS = "sf",
	SECONDARY_CONTENT = "sc",
	NEUTRAL = "n",
	NEUTRAL_FOCUS = "nf",
	NEUTRAL_CONTENT = "nc",
	BASE1 = "b1",
	BASE2 = "b2",
	BASE3 = "b3",
	BASE_CONTENT = "bc",
	SUCCESS = "su",
	ERROR = "er",
	ACCENT = "a",
	ACCENT_CONTENT = "ac",
	INFO = "in",
	WARNING = "wa",
}
export function getDaisyuiColor(color: ThemeColor): string {
	const style = getComputedStyle(document.documentElement);
	const cssValue = style.getPropertyValue(`--${color}`);
	return cssValue !== "" ? `oklch(${cssValue})` : "hsl(0, 0%, 50%)";
}
