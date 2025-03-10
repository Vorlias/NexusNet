import { NetworkingFlags, NetworkModelConfiguration } from "./Types/NetworkObjectModel";

export namespace NexusConfiguration {
	interface ConfigFlags {
		readonly UseBufferSerialization: boolean;
		readonly EnforceArgumentCount: boolean;
		readonly Logging: boolean;
		readonly Debugging: boolean;
	}

	export function EncodeConfigFlags(config: ConfigFlags): NetworkingFlags {
		let flags = NetworkingFlags.None;

		if (config.UseBufferSerialization) flags |= NetworkingFlags.UseBufferSerialization;
		if (config.EnforceArgumentCount) flags |= NetworkingFlags.EnforceArgumentCount;
		if (config.Logging) flags |= NetworkingFlags.Logging;
		if (config.Debugging) flags |= NetworkingFlags.Debugging;

		return flags;
	}
}
