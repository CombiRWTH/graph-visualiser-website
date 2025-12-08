export function getSmallestUniqueId(ids: number[]): number {
	const idSet = new Set(ids); // Convert to a Set for quick lookups
	let smallestMissing = 0;
	while (idSet.has(smallestMissing)) {
		smallestMissing++;
	}
	return smallestMissing;
}
