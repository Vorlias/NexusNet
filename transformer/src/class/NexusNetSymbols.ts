import ts from "typescript";
import { DistribInfo } from "../utils/typescript-version";
import { isPathDescendantOf } from "../isPathDescendantOf";
import path from "path";
import fs from "fs";
import assert from "assert";
import { NexusNetInterface, NexusNetModuleFile, NexusNetNamespace } from "./ModuleFile";
import { LoggerProvider } from "./logProvider";

const EXCLUDED_NAME_DIR = new Set(["src/", "lib/", "out/"]);
export const moduleResolutionCache = new Map<string, string | false>();
export class NexusNetXProvider {
	public readonly typeChecker: ts.TypeChecker;

	public fileSymbols = new Map<string, NexusNetModuleFile>();

	private moduleDir: string | undefined;

	nexusXModule!: NexusNetModuleFile;
	nexusXNamespace!: NexusNetNamespace;
	nexusXBuilder!: NexusNetInterface;

	public constructor(
		public readonly compilerOptions: ts.CompilerOptions,
		public readonly logger: LoggerProvider,
		public readonly program: ts.Program,
		public readonly distrib: DistribInfo,
	) {
		this.typeChecker = program.getTypeChecker();

		if (distrib.type === "roblox") {
			this.moduleDir = this.resolveModuleDir("@rbxts/nexus-net");
		} else if (distrib.type === "airship") {
			this.moduleDir = this.resolveAirshipFramework();
		}

		if (this.moduleDir) {
			logger.writeLineIfVerbose(`Module located at ${this.moduleDir}`);
		} else {
			logger.warnIfVerbose("Could not find module dir");
		}
	}

	private resolveAirshipFramework() {
		return "AirshipPackages/@Vorlias/NexusNet/Framework";
	}

	private resolveModuleDir(moduleName: string) {
		const modulePath = moduleResolutionCache.get(moduleName);
		if (modulePath !== undefined) return modulePath || undefined;

		const dummyFile = path.join(this.compilerOptions.rootDir!, "dummy.ts");
		const module = ts.resolveModuleName(moduleName, dummyFile, this.compilerOptions, ts.sys);
		const resolvedModule = module.resolvedModule;
		if (resolvedModule) {
			const modulePath = fs.realpathSync(path.join(resolvedModule.resolvedFileName, "../"));
			moduleResolutionCache.set(moduleName, modulePath);
			return modulePath;
		}
		moduleResolutionCache.set(moduleName, false);
	}

	private isFileInteresting(file: ts.SourceFile) {
		if (this.moduleDir && isPathDescendantOf(file.fileName, this.moduleDir)) {
			if (file.fileName.endsWith(".d.ts")) return false;
			return true;
		}

		return false;
	}

	findFile(name: string) {
		return this.fileSymbols.get(name);
	}

	getFile(name: string) {
		const fileSymbol = this.findFile(name);
		assert(fileSymbol, `Could not find fileSymbol for '${name}'`);

		return fileSymbol;
	}

	private getName(directory: string, file: ts.SourceFile) {
		const relativePath = path
			.relative(directory, file.fileName)
			// .replace(/\\/g, "/")
			.replace(/(\.d)?.ts$/, "");

		return `${relativePath}`;
	}

	private registeredFiles = 0;
	private registerFileSymbol(file: ts.SourceFile) {
		const name = this.getName(this.program.getCurrentDirectory(), file);

		if (this.fileSymbols.has(name)) {
			this.logger.warn("duplicate file symbol. name=" + name + ", fileName=" + file.fileName);
			return this.fileSymbols.get(name)!;
		}

		const fileSymbol = new NexusNetModuleFile(this.typeChecker, file, name);
		this.fileSymbols.set(name, fileSymbol);
		this.registeredFiles++;
		return fileSymbol;
	}

	registerInterestingFiles() {
		for (const file of this.program.getSourceFiles()) {
			if (this.isFileInteresting(file)) {
				this.registerFileSymbol(file);
			}
		}

		this.finalize();
	}

	finalize() {
		if (!this.moduleDir) return;

		const file = path.relative(this.program.getCurrentDirectory(), path.join(this.moduleDir!, "NexusX"));
		this.nexusXModule = this.getFile(file);
		this.nexusXNamespace = this.nexusXModule.getNamespace("NexusX");
		console.log(
			"registered NexusX in",
			this.nexusXModule.file.fileName,
			this.typeChecker.symbolToString(this.nexusXNamespace.namespaceSymbol),
		);

		// this.nexusXBuilder = this.nexusXModule.getInterface("XNetworkObjectModelBuilder");
	}
}
