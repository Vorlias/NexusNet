import { NetworkUtil } from "@Easy/Core/Shared/Util/NetworkUtil";
import { float32, NCoreNetworkEncoders, uint32 } from "../Core/Buffers";
import { NexusCoreTypes } from "../Core/CoreTypes";
import { NetworkSerializableType, NetworkType } from "../Core/Types/NetworkTypes";
import { default as AirshipCharacter } from "@Easy/Core/Shared/Character/Character";
import { Airship } from "@Easy/Core/Shared/Airship";
import { Player as AirshipPlayer } from "@Easy/Core/Shared/Player/Player";

const Identity: NetworkSerializableType<NetworkIdentity, uint32> = {
	Name: "NetworkIdentity",
	Message: "Expected a NetworkIdentity",
	NetworkBuffer: NCoreNetworkEncoders.UInt32,
	Validate(value): value is NetworkIdentity {
		return typeIs(value, "userdata") && (value as { IsA(name: string): boolean }).IsA("NetworkIdentity");
	},
	Serialize(value) {
		return value.netId;
	},
	Deserialize(value) {
		const object = NetworkUtil.GetNetworkIdentity(value);
		assert(object);
		return object;
	},
};

const Character: NetworkSerializableType<AirshipCharacter, uint32> = {
	Name: "Character",
	Message: "Expected a Character",
	NetworkBuffer: NCoreNetworkEncoders.UInt32,
	Validate(value): value is AirshipCharacter {
		return typeIs(value, "table") && value instanceof AirshipCharacter;
	},
	Serialize(value) {
		return value.id;
	},
	Deserialize(value) {
		const character = Airship.Characters.FindById(value);
		assert(character);
		return character;
	},
};

const Player: NetworkSerializableType<AirshipPlayer, string> = {
	Name: "AirshipPlayer",
	Message: "Expected an AirshipPlayer",
	NetworkBuffer: NCoreNetworkEncoders.String,
	Validate(value): value is AirshipPlayer {
		return typeIs(value, "table") && value instanceof AirshipPlayer;
	},
	Serialize(value) {
		return value.userId;
	},
	Deserialize(value) {
		const player = Airship.Players.WaitForUserId(value);
		assert(player, `Could not find player with userId '${value}'`);
		return player;
	},
};

export const NexusTypes = {
	...NexusCoreTypes,
	Identity,
	Character,
	Player,
};
