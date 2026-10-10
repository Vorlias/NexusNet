import { NexusEventBuilder } from "../Builders/EventBuilder";
import { ConfigFlags, NetworkingFlags, NOM } from "../NetworkObjectModel";
import { NetworkType } from "../Types/NetworkType";
export { NetworkType } from "../Types/NetworkType";

class ServerCompatContextWrapper<T extends NOM.DeclarationRecord> {
	public constructor(declarations: T) {}

	public Get<K extends keyof NOM.FilterServerDeclarations<T> & string>(remoteId: K): NOM.InferServerRemote<T[K]> {
		throw `TODO`;
	}
}

class ClientCompatContextWrapper<T extends NOM.DeclarationRecord> {
	public constructor(declarations: T) {}

	public Get<K extends keyof NOM.FilterClientDeclarations<T> & string>(remoteId: K): NOM.InferClientRemote<T[K]> {
		throw `TODO`;
	}
}

/**
 * Backwards compat with RbxNet 3.x that includes NexusNet internal changes
 * @version RbxNet-3.0
 */
export namespace Net {
	const LegacyDefaults: NOM.Config = {
		Flags: ConfigFlags.None,
	};

	export namespace Definitions {
		/**
		 * @version RbxNet-3.0
		 */
		export function Create<T extends NOM.DeclarationRecord>(declarations: T) {
			return {
				Server: new ServerCompatContextWrapper(declarations),
				Client: new ClientCompatContextWrapper(declarations),
			};
		}
	}

	export const CreateDefinitions = Definitions.Create;

	/**
	 * @deprecated
	 * @version RbxNet-3.0
	 */
	export function Namespace<T extends NOM.DeclarationRecord>() {
		throw `TODO`;
	}

	/**
	 * @version RbxNet-3.x
	 * @deprecated Insecure type-only event - specify arguments for static typing
	 */
	export function ServerToClientEvent<
		ServerArgs extends ReadonlyArray<unknown>,
	>(): NOM.ServerEventDeclaration<ServerArgs>;
	/**
	 * @version RbxNet-3.x-compat
	 */
	export function ServerToClientEvent<ServerArgs extends ReadonlyArray<unknown>>(
		...types: NetworkType.ToTypeArray<ServerArgs>
	): NOM.ServerEventDeclaration<ServerArgs>;
	export function ServerToClientEvent<ServerArgs extends ReadonlyArray<unknown>>(
		...types: NetworkType.ToTypeArray<ServerArgs>
	): NOM.ServerEventDeclaration<ServerArgs> {
		const builder = new NexusEventBuilder();
		if (types.size() === 0) {
			// likely type only
			const data = builder.OnServer(LegacyDefaults) as Writable<NOM.ServerEventDeclaration<any>>;
			data.Flags |= NetworkingFlags.RbxNet3BackwardsCompat | NetworkingFlags.ArgumentsByValue;
			return data;
		} else {
			builder.arguments = types;
			return builder.OnServer(LegacyDefaults) as NOM.ServerEventDeclaration<any>;
		}
	}

	/**
	 * @version RbxNet-3.0
	 * @deprecated Insecure type-only event - specify arguments for static typing
	 */
	export function ClientToServerEvent<
		const ServerArgs extends ReadonlyArray<unknown>,
	>(): NOM.ClientEventDeclaration<ServerArgs>;
	/**
	 * @version RbxNet-3.0
	 */
	export function ClientToServerEvent<const ServerArgs extends ReadonlyArray<unknown>>(
		...types: NetworkType.ToTypeArray<ServerArgs>
	): NOM.ClientEventDeclaration<ServerArgs>;
	export function ClientToServerEvent<const ServerArgs extends ReadonlyArray<unknown>>(
		...types: NetworkType.ToTypeArray<ServerArgs>
	): NOM.ClientEventDeclaration<ServerArgs> {
		const builder = new NexusEventBuilder();
		const data = builder.OnClient(LegacyDefaults) as Writable<NOM.ClientEventDeclaration<any>>;
		data.Flags |= NetworkingFlags.RbxNet3BackwardsCompat | NetworkingFlags.ArgumentsByValue;
		return data;
	}
}
