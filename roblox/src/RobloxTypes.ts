import { float32, float64, NCoreNetworkEncoders } from "./Core/Buffers";
import { NexusCoreTypes } from "./Core/CoreTypes";
import { NetworkSerializableType, NetworkType } from "./Core/Types/NetworkTypes";

const Player: NetworkSerializableType<Player, float64> = {
	Name: "Player",
	Message: "Expected a Player",
	NetworkBuffer: NCoreNetworkEncoders.Float64,
	Validate(value): value is Player {
		return typeIs(value, "Instance") && value.IsA("Player");
	},
	Serialize(value) {
		return value.UserId;
	},
	Deserialize(value) {
		const player = game.GetService("Players").GetPlayerByUserId(value);
		assert(player, `Could not find player with userId '${value}'`);
		return player;
	},
};

export const NexusTypes = {
	...NexusCoreTypes,
	Player,
};
