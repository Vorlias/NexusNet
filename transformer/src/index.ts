import ts from "typescript";
import { TransformConfiguration } from "./types";
import { getAirship, getRoblox, getTypescriptVersion } from "./utils/typescript-version";
import { assert } from "console";
import { LoggerProvider } from "./class/logProvider";

const DEFAULTS: TransformConfiguration = {
	platform: {
		type: "none",
	},
};

const VERSION = getTypescriptVersion();
const MIN_VERSION_RANGE = new ts.VersionRange("~5.2.2");

export default function transform(program: ts.Program, userConfiguration: TransformConfiguration) {
	userConfiguration = { ...DEFAULTS, ...userConfiguration };
	const logger = new LoggerProvider(true, true);

	if (!VERSION || !MIN_VERSION_RANGE.test(VERSION)) {
		logger.error(
			"Typescript version mismatch, check to see if a new version of the NexusNet transformer is available!",
		);
		return;
	}

	const version = getAirship() ?? getRoblox();
	if (!version) {
		logger.error("Could not find platform for transformer");
		return;
	}

	logger.writeLineIfVerbose("Platform is", version.type, "with version", version.version.toString());

	userConfiguration.platform = version;

	return (context: ts.TransformationContext): ((file: ts.SourceFile) => ts.Node) => {
		return (file: ts.SourceFile) => {
			return file;
		};
	};
}
