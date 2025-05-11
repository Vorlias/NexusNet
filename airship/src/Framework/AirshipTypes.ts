import { NetworkUtil } from "@Easy/Core/Shared/Util/NetworkUtil";
import { int32, NetworkBuffers, uint32 } from "../Core/Buffers";
import { NexusCoreTypes } from "../Core/CoreTypes";
import { NetworkSerializableType, NetworkSerializer, NetworkType, ClientNullable } from "../Core/Types/NetworkTypes";
import { default as AirshipCharacter } from "@Easy/Core/Shared/Character/Character";
import { Airship } from "@Easy/Core/Shared/Airship";
import { Player as AirshipPlayer } from "@Easy/Core/Shared/Player/Player";
import Inventory from "@Easy/Core/Shared/Inventory/Inventory";
import { Team } from "@Easy/Core/Shared/Team/Team";
import { Game } from "@Easy/Core/Shared/Game";

const NullableIdentity: NetworkSerializableType<NetworkIdentity | undefined, uint32> = {
	Name: "Nullable<NetworkIdentity>",
	BufferEncoder: NetworkBuffers.UInt32,
	Validator: {
		Validate(value): value is NetworkIdentity {
			return typeIs(value, "userdata") && (value as { IsA(name: string): boolean }).IsA("NetworkIdentity");
		},
	},
	Serializer: {
		Serialize(value) {
			return value?.netId ?? 0;
		},
		Deserialize(value) {
			if (value === 0) return undefined;
			const object = NetworkUtil.GetNetworkIdentity(value);
			return object;
		},
	},
};

const ServerIdentity: NetworkSerializableType<NetworkIdentity, uint32> = {
	Name: "NetworkIdentity",
	BufferEncoder: NetworkBuffers.UInt32,
	Validator: {
		Validate(value): value is NetworkIdentity {
			return typeIs(value, "userdata") && (value as { IsA(name: string): boolean }).IsA("NetworkIdentity");
		},
	},
	Serializer: {
		Serialize(value) {
			return value.netId;
		},
		Deserialize(value) {
			if (Game.IsServer()) {
				return NetworkUtil.WaitForNetworkIdentity(value);
			} else {
				const object = NetworkUtil.WaitForNetworkIdentityTimeout(value, 2);
				assert(
					object,
					`NetworkIdentity ${value} could not be found on the client: was it destroyed or disabled?`,
				);
				return object;
			}
		},
	},
};

const Character: NetworkSerializableType<AirshipCharacter, uint32> = {
	Name: "Character",
	BufferEncoder: NetworkBuffers.UInt32,
	Validator: {
		Validate(value): value is AirshipCharacter {
			return typeIs(value, "table") && value instanceof AirshipCharacter;
		},
	},
	Serializer: {
		Serialize(value) {
			return value.id;
		},
		Deserialize(value) {
			const character = Airship.Characters.FindById(value);
			assert(character);
			return character;
		},
	},
};

const Player: NetworkSerializableType<AirshipPlayer, string> = {
	Name: "AirshipPlayer",
	BufferEncoder: NetworkBuffers.String,
	Validator: {
		Validate(value): value is AirshipPlayer {
			return typeIs(value, "table") && value instanceof AirshipPlayer;
		},
	},
	Serializer: {
		Serialize(value) {
			return value.userId;
		},
		Deserialize(value) {
			const player = Airship.Players.WaitForUserId(value);
			assert(player, `Could not find player with userId '${value}'`);
			return player;
		},
	},
};

const AirshipInventory: NetworkSerializableType<Inventory, int32> = {
	Name: "AirshipInventory",
	BufferEncoder: NetworkBuffers.Int32,
	Validator: {
		Validate(value): value is Inventory {
			return typeIs(value, "table") && value instanceof Inventory;
		},
	},
	Serializer: {
		Serialize(value) {
			return value.id;
		},
		Deserialize(value) {
			const player = Airship.Inventory.GetInventory(value);
			assert(player, `Could not find inventory with id '${value}'`);
			return player;
		},
	},
};

const AirshipTeam: NetworkSerializableType<Team, string> = {
	Name: "AirshipTeam",
	BufferEncoder: NetworkBuffers.String,
	Validator: {
		Validate(value): value is Team {
			return typeIs(value, "table") && value instanceof Team;
		},
	},
	Serializer: {
		Serialize(value) {
			return value.id;
		},
		Deserialize(value) {
			const player = Airship.Teams.FindById(value);
			assert(player, `Could not find inventory with id '${value}'`);
			return player;
		},
	},
};

const UnityColor: NetworkType<Color, Color> = {
	Name: "Color",
	BufferEncoder: {
		WriteData(data: Color, writer) {
			writer.WriteFloat32(data.r);
			writer.WriteFloat32(data.g);
			writer.WriteFloat32(data.b);
			writer.WriteFloat32(data.a);
		},
		ReadData(reader): Color {
			const r = reader.ReadFloat32();
			const g = reader.ReadFloat32();
			const b = reader.ReadFloat32();
			const a = reader.ReadFloat32();
			return new Color(r, g, b, a);
		},
	},
	Validator: {
		Validate(value): value is Color {
			return true;
		},
	},
};

const UnityVector4: NetworkType<Vector4, Vector4> = {
	Name: "Vector4",
	BufferEncoder: {
		WriteData(data: Vector4, writer) {
			writer.WriteFloat32(data.x);
			writer.WriteFloat32(data.y);
			writer.WriteFloat32(data.z);
			writer.WriteFloat32(data.w);
		},
		ReadData(reader): Vector4 {
			const x = reader.ReadFloat32();
			const y = reader.ReadFloat32();
			const z = reader.ReadFloat32();
			const w = reader.ReadFloat32();
			return new Vector4(x, y, z, w);
		},
	},
	Validator: {
		Validate(value): value is Vector4 {
			return true;
		},
	},
};

const UnityQuat: NetworkType<Quaternion, Quaternion> = {
	Name: "Quaternion",
	BufferEncoder: {
		WriteData(data: Quaternion, writer) {
			writer.WriteFloat32(data.x);
			writer.WriteFloat32(data.y);
			writer.WriteFloat32(data.z);
			writer.WriteFloat32(data.w);
		},
		ReadData(reader): Quaternion {
			const x = reader.ReadFloat32();
			const y = reader.ReadFloat32();
			const z = reader.ReadFloat32();
			const w = reader.ReadFloat32();
			return new Quaternion(x, y, z, w);
		},
	},
	Validator: {
		Validate(value): value is Quaternion {
			return true;
		},
	},
};

const UnityRay: NetworkType<Ray, Ray> = {
	Name: "Ray",
	BufferEncoder: {
		WriteData(data: Ray, writer) {
			UnityVector3.BufferEncoder.WriteData(data.origin, writer);
			UnityVector3.BufferEncoder.WriteData(data.direction, writer);
		},
		ReadData(reader): Ray {
			const origin = UnityVector3.BufferEncoder.ReadData(reader);
			const direction = UnityVector3.BufferEncoder.ReadData(reader);

			return new Ray(origin, direction);
		},
	},
	Validator: {
		Validate(value): value is Ray {
			return true;
		},
	},
};

const UnityVector3: NetworkType<Vector3, Vector3> = {
	Name: "Vector3",
	BufferEncoder: {
		WriteData(data: Vector3, writer) {
			writer.WriteFloat32(data.x);
			writer.WriteFloat32(data.y);
			writer.WriteFloat32(data.z);
		},
		ReadData(reader): Vector3 {
			const x = reader.ReadFloat32();
			const y = reader.ReadFloat32();
			const z = reader.ReadFloat32();
			return new Vector3(x, y, z);
		},
	},
	Validator: {
		Validate(value): value is Vector3 {
			return true;
		},
	},
};

const UnityVector2: NetworkType<Vector2, Vector2> = {
	Name: "Vector2",
	BufferEncoder: {
		WriteData(data: Vector2, writer) {
			writer.WriteFloat32(data.x);
			writer.WriteFloat32(data.y);
		},
		ReadData(reader): Vector2 {
			const x = reader.ReadFloat32();
			const y = reader.ReadFloat32();
			return new Vector2(x, y);
		},
	},
	Validator: {
		Validate(value): value is Vector2 {
			return true;
		},
	},
};

interface AirshipBuiltInTypes extends NexusCoreTypes {
	/**
	 * A `NetworkIdentity`, representing a networked object in Airship
	 *
	 * This can potentially error if the NetworkIdentity is not found.
	 */
	Identity: typeof ServerIdentity;
	/**
	 * A `NetworkIdentity` that can be undefined if it does not exist.
	 *
	 * It will serialize as `0` if it's undefined, or deserialize as `undefined` if not found on the receiving end.
	 *
	 * Useful for objects that may get destroyed between it being sent and being receieved.
	 */
	NullableIdentity: typeof NullableIdentity;

	/**
	 * A player in Airship
	 */
	Player: typeof Player;
	/**
	 * A character in Airship
	 */
	Character: typeof Character;
	/**
	 * An inventory in Airship
	 */
	Inventory: typeof AirshipInventory;

	/**
	 * A team in Airship
	 */
	Team: typeof AirshipTeam;

	Color: typeof UnityColor;

	Vector2: typeof UnityVector2;
	Vector3: typeof UnityVector3;
	Vector4: typeof UnityVector4;

	Quaternion: typeof UnityQuat;
	// Ray: typeof UnityRay;
}
export const NexusTypes: AirshipBuiltInTypes = {
	...NexusCoreTypes,
	Identity: ServerIdentity,
	NullableIdentity: NullableIdentity,
	Character,
	Player,
	Inventory: AirshipInventory,
	Team: AirshipTeam,

	Color: UnityColor,
	Vector3: UnityVector3,
	Vector2: UnityVector2,
	Vector4: UnityVector4,

	Quaternion: UnityQuat,
	// Ray: UnityRay,
};
