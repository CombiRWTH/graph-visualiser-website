const { exec } = require("child_process");
const fs = require("fs");

// ADD FUTURE PACKAGE FOLDER NAMES HERE
const PACKAGE_FOLDERS = [
	"dijkstra",
	"kruskal",
	"prim",
	"christofides",
	"ford_fulkerson",
	"mbf",
	"edmonds_karp",
	"dinic",
];
// IN THE LIST ABOVE

// https://stackoverflow.com/a/41407246
const BLUE_FONT = "\x1b[34m";
const RED_FONT = "\x1b[31m";
const RESET_FONT = "\x1b[0m";

const rustFolder = __dirname;

async function buildPackage(folderName) {
	console.log(`${BLUE_FONT}# Building ${folderName} crate to node package ...${RESET_FONT}`);
	const script = exec(`wasm-pack build ./${folderName} --target web --release --color=always`, { cwd: rustFolder });
	await scriptWrapper(script, folderName);
	fs.unlinkSync(`${rustFolder}/${folderName}/pkg/.gitignore`);
}

async function testPackage(folderName) {
	console.log(`${BLUE_FONT}Testing ${folderName} crates with wasm-pack ...${RESET_FONT}`);
	const script = exec(`wasm-pack test --headless --firefox --release ./${folderName} --color=always`, {
		cwd: rustFolder,
	});
	await scriptWrapper(script, folderName);
}

async function scriptWrapper(script, folderName) {
	return new Promise((resolve) => {
		script.stdout.on("data", function (data) {
			process.stdout.write(data.toString());
		});
		script.stderr.on("data", function (data) {
			process.stdout.write(data.toString());
		});
		script.on("exit", function (code) {
			if (code === 0) {
				console.log(`${BLUE_FONT}# ... ${folderName} finished successful${RESET_FONT}`);
			} else {
				console.log(`${RED_FONT}# ... ${folderName} finished with exit code ${code}${RESET_FONT}`);
			}
			resolve();
		});
	});
}

async function buildPackages() {
	for (const folderName of PACKAGE_FOLDERS) {
		await buildPackage(folderName);
	}
}
async function testPackages() {
	for (const folderName of PACKAGE_FOLDERS) {
		await testPackage(folderName);
	}
}

if (process.argv.length > 2 && process.argv[2] === "--test") {
	testPackages();
} else {
	buildPackages();
}
