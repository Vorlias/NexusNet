import path from "path";
import ts from "typescript";

export interface PackageJson {
	name: string;
	version: string;
	devDependencies: Record<string, string>;
	dependencies: Record<string, string>;
}

export function getPackageJson(packageJsonPath = "."): PackageJson {
	const relPath = path.join(packageJsonPath, "package.json");
	const rawJson = ts.sys.readFile(relPath);
	return rawJson ? JSON.parse(rawJson) : undefined!;
}
