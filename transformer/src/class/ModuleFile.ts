import assert from "assert";
import ts from "typescript";

export class NexusNetNamespace {
	public namespaceSymbol: ts.Symbol;

	public constructor(
		private readonly fileSymbol: NexusNetModuleFile,
		private readonly node: ts.NamespaceDeclaration,
	) {
		const namespaceSymbol = fileSymbol.typeChecker.getSymbolAtLocation(node.name);
		assert(namespaceSymbol);
		this.namespaceSymbol = namespaceSymbol;
	}

	get(name: string) {
		const exportSymbol = this.namespaceSymbol.exports?.get(name as ts.__String);
		assert(exportSymbol, `Name ${name} not found in ${this.namespaceSymbol.name}`);

		return exportSymbol;
	}
}

export class NexusNetInterface {
	public interfaceSymbol: ts.Symbol;

	public constructor(
		private readonly fileSymbol: NexusNetModuleFile,
		private readonly node: ts.InterfaceDeclaration,
	) {
		const interfaceSymbol = fileSymbol.typeChecker.getSymbolAtLocation(node.name);
		assert(interfaceSymbol);
		this.interfaceSymbol = interfaceSymbol;
	}

	get(name: string) {

		
		for (const member of this.node.members) {
			if (ts.isMethodSignature(member)) {
				return this.fileSymbol.typeChecker.getSymbolAtLocation(member);
			}
		}

		const exportSymbol = this.interfaceSymbol.members?.get(name as ts.__String);
		assert(exportSymbol);

		console.log('get symbol', exportSymbol.id, exportSymbol.getName())
		return exportSymbol;
	}
}

function isNamespaceDeclaration(node?: ts.Node): node is ts.NamespaceDeclaration {
	return (
		(node !== undefined &&
			ts.isModuleDeclaration(node) &&
			ts.isIdentifier(node.name) &&
			node.body &&
			ts.isNamespaceBody(node.body)) ||
		false
	);
}

export class NexusNetModuleFile {
	public fileSymbol: ts.Symbol;

	namespaces = new Map<string, NexusNetNamespace>();
	interfaces = new Map<string, NexusNetInterface>();

	public constructor(
		public readonly typeChecker: ts.TypeChecker,
		public readonly file: ts.SourceFile,
		private name: string,
	) {
		const fileSymbol = typeChecker.getSymbolAtLocation(file);
		assert(fileSymbol);
		this.fileSymbol = fileSymbol;
		this.register();
	}

	private register() {
		for (const statement of this.file.statements) {
			if (isNamespaceDeclaration(statement)) {
				this.registerNamespace(statement);
			} else if (ts.isInterfaceDeclaration(statement)) {
				this.registerInterface(statement);
			}
		}
	}

	private registerNamespace(node: ts.NamespaceDeclaration) {
		assert(ts.isModuleBlock(node.body));

		const namespaceSymbol = new NexusNetNamespace(this, node);
		this.namespaces.set(node.name.text, namespaceSymbol);
	}

	private registerInterface(node: ts.InterfaceDeclaration) {
		const namespaceSymbol = new NexusNetInterface(this, node);
		this.interfaces.set(node.name.text, namespaceSymbol);
	}

	get(name: string) {
		const exportSymbol = this.fileSymbol.exports?.get(name as ts.__String);
		assert(exportSymbol);

		return exportSymbol;
	}

	getNamespace(name: string) {
		const ns = this.namespaces.get(name);
		assert(ns);
		return ns;
	}

	getInterface(name: string) {
		const ns = this.interfaces.get(name);
		assert(ns);
		return ns;
	}
}