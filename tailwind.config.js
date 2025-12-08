/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"node_modules/daisyui/dist/**/*.js",
		"node_modules/react-daisyui/dist/**/*.js",
		"./src/**/*.{js,jsx,ts,tsx,html}",
	],
	plugins: [require("daisyui")],
	daisyui: {
		themes: ["autumn"],
	},
};
