import ts from "typescript";
import { getPackageJson } from "./packages";
import path from "path";
import { cwd } from "process";

export function getTypescriptVersion() {
	const pkg = getPackageJson("node_modules/typescript");
	if (!pkg) return undefined;
	return new ts.Version(pkg.version);
}

interface RobloxDistribInfo {
	readonly type: "roblox";
	readonly versionRange: ts.VersionRange;
	readonly version: ts.Version;
}
const PINNED_ROBLOX_VERSION = new ts.VersionRange("=3.0");
export function getRoblox(): RobloxDistribInfo | undefined {
	const pkg = getPackageJson(path.join(process.cwd(), "node_modules/roblox-ts"));
	if (!pkg) {
		return undefined;
	}

	return {
		type: "roblox",
		versionRange: PINNED_ROBLOX_VERSION,
		version: new ts.Version(pkg.version),
	};
}

interface AirshipDistribInfo {
	readonly type: "airship";
	readonly versionRange: ts.VersionRange;
	readonly version: ts.Version;
}
const PINNED_AIRSHIP_VERISON = new ts.VersionRange("~3.5");
export function getAirship(): AirshipDistribInfo | undefined {
	const pkg = getPackageJson(path.join(process.cwd(), "TypeScript~"));
	if (!pkg) {
		return undefined;
	}

	return {
		type: "airship",
		versionRange: PINNED_AIRSHIP_VERISON,
		version: new ts.Version("3.5"),
	};
}

export type DistribInfo = AirshipDistribInfo | RobloxDistribInfo | { type: "none" };

