import { hashstring } from "../../Core/Utils/hash";

const eventCache = new Map<string, number>();
export function GetRbxNetEventId(name: string): number {
	const id = eventCache.get(name);
	if (id !== undefined) {
		return id;
	}

	const hash = hashstring("EV:" + name + ":" + game.JobId);
	eventCache.set(name, hash);
	return hash;
}

export function GetRbxNetFunctionId(name: string): number {
	const id = eventCache.get(name);
	if (id !== undefined) {
		return id;
	}

	const hash = hashstring("FN:" + name + ":" + game.JobId);
	eventCache.set(name, hash);
	return hash;
}
