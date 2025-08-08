// RemoteKeyHasher.GetRemoteHash(RemoteKeyHasher.GetCallerContext(), "test");

import { RemoteKeyHasher } from "@Easy/Core/Shared/Network/RemoteKeyHasher";

const eventCache = new Map<string, number>();

export function GetAsNetEventId(name: string) {
	let id = eventCache.get(name);
	if (id) {
		return id;
	}

	const callerContext = RemoteKeyHasher.GetCallerContext();
	if (!callerContext) throw `Invalid context`;

	id = RemoteKeyHasher.GetRemoteHash(callerContext, `NOM_EV_${name.upper()}`);
	eventCache.set(name, id);
	return id;
}

export function GetAsNetFunctionId(id: string) {
	const callerContext = RemoteKeyHasher.GetCallerContext();
	if (!callerContext) throw `Invalid context`;

	return RemoteKeyHasher.GetRemoteHash(callerContext, `NOM_FN_${id.upper()}`);
}
