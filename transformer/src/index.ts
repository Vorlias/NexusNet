import ts from "typescript";
import { TransformConfiguration } from "./types";
import { getAirship, getRoblox, getTypescriptVersion } from "./utils/typescript-version";
import { LoggerProvider } from "./class/logProvider";
import { getPackageJson } from "./utils/packages";
import { assert } from "console";
import { transformFile } from "./transform/transformFile";
import { TransformState } from "./class/TransformState";
import { NexusNetXProvider } from "./class/NexusNetSymbols";
import path from "path";

const DEFAULTS: TransformConfiguration = {
	platform: {
		type: "none",
	},
	verbose: true,
	debug: true,
};

const PACKAGE = getPackageJson();
const VERSION = getTypescriptVersion();

// const MIN_VERSION_RANGE = new ts.VersionRange(PACKAGE.dependencies?.typescript ?? PACKAGE.devDependencies?.typescript);

export default function transform(program: ts.Program, userConfiguration: TransformConfiguration) {
	userConfiguration = { ...DEFAULTS, ...userConfiguration, platform: DEFAULTS.platform };
	const logger = new LoggerProvider(userConfiguration.debug, userConfiguration.verbose);

	// if (!VERSION || !MIN_VERSION_RANGE.test(VERSION)) {
	// 	logger.error(
	// 		"Typescript version mismatch, check to see if a new version of the NexusNet transformer is available!",
	// 	);
	// 	return;
	// }

	const version = getAirship() ?? getRoblox();
	if (!version) {
		logger.error(
			"Could not find platform for transformer - ensure your project has either @easy-games/unity-ts or roblox-ts installed!",
		);
		throw new Error("No platform found");
	}

	logger.writeLineIfVerbose("Platform is " + version.type + " with version " + version.version.toString());

	userConfiguration.platform = version;

	const nexus = new NexusNetXProvider(program.getCompilerOptions(), logger, program, version);
	nexus.registerInterestingFiles();

	return (context: ts.TransformationContext): ((file: ts.SourceFile) => ts.Node) => {
		logger.writeLineIfVerbose("Creating TransformState...");
		const state = new TransformState(program, context, userConfiguration, logger, version, nexus);
		logger.writeLineIfVerbose("TransformState initialized");

		return (file: ts.SourceFile) => {
			const relativePath = path.relative(process.cwd(), file.fileName);
			if (relativePath.startsWith("AirshipPackages" + path.sep)) {
				return file;
			}

			const result = transformFile(state, file);
			return result;
		};
	};
}
