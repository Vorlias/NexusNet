import { hashstring } from "../../Core/Utils/hash";

const eventCache = new Map<string, number>();
export function GetRbxNetEventId(name: string): number {
	const id = eventCache.get(name);
	if (id !== undefined) {
		return id;
	}

	const hash = hashstring("NOM_EV_" + name);
	eventCache.set(name, hash);
	return hash;
}

export function GetRbxNetFunctionId(name: string): number {
	const hash = 0; // hashstring("NOM_FN_" + name + game.JobId);
	return hash;
}
