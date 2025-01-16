import {
	ClientBuilder,
	ClientEventDeclaration,
	ClientFunctionDeclaration,
	ContextNetworkModel,
	NetworkModelConfiguration,
	NetworkObjectModelBuilder,
	RemoteDeclarations,
	ServerBuilder,
	ServerEventDeclaration,
	ServerFunctionDeclaration,
} from "../Core/Types/NetworkObjectModel";
import { Identity, Named } from "../Core/Types/Utility";

export class RobloxNetworkObjectModelBuilder<TDeclarations extends RemoteDeclarations = defined>
	implements NetworkObjectModelBuilder<TDeclarations>
{
	private declarations = {} as TDeclarations;
	private configuration: Writable<NetworkModelConfiguration> = {
		Debugging: false,
		Logging: game.GetService("RunService").IsStudio(),
		UseBuffers: false,
	};

	AddServer<
		TName extends string,
		TNomRemote extends
			| ServerEventDeclaration<never>
			| ClientEventDeclaration<never>
			| ClientFunctionDeclaration<never, never>
			| ServerFunctionDeclaration<never, never>,
	>(
		id: TName,
		declaration: ServerBuilder<TNomRemote>,
	): NetworkObjectModelBuilder<Identity<Named<TName, TNomRemote>>> {
		const definition = declaration.OnServer(this.configuration);
		this.declarations = {
			...this.declarations,
			[id]: definition,
		};

		return this as never;
	}

	AddClient<
		TName extends string,
		TNomRemote extends
			| ServerEventDeclaration<never>
			| ClientEventDeclaration<never>
			| ClientFunctionDeclaration<never, never>
			| ServerFunctionDeclaration<never, never>,
	>(
		id: TName,
		declaration: ClientBuilder<TNomRemote>,
	): NetworkObjectModelBuilder<Identity<Named<TName, TNomRemote>>> {
		const definition = declaration.OnClient(this.configuration);
		this.declarations = {
			...this.declarations,
			[id]: definition,
		};

		return this as never;
	}

	Build(): ContextNetworkModel<TDeclarations> {
		throw `TODO`;
	}
}
