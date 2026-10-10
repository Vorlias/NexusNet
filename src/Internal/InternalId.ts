import hashstring from "./hash";
const runService = game.GetService("RunService");

const eventCache = new Map<string, number>();
export function GetRbxNetEventId(name: string): number {
	const id = eventCache.get(name);
	if (id !== undefined) {
		return id;
	}

	if (runService.IsStudio()) {
		const hash = hashstring("EV:" + name);
		eventCache.set(name, hash);
		return hash;
	} else {
		const hash = hashstring("EV:" + name + ":" + game.JobId);
		eventCache.set(name, hash);
		return hash;
	}
}

export function GetRbxNetFunctionId(name: string): number {
	const id = eventCache.get(name);
	if (id !== undefined) {
		return id;
	}

	if (runService.IsStudio()) {
		const hash = hashstring("FN:" + name);
		eventCache.set(name, hash);
		return hash;
	} else {
		const hash = hashstring("FN:" + name + ":" + game.JobId);
		eventCache.set(name, hash);
		return hash;
	}
}
