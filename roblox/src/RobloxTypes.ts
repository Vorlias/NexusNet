import { float32, float64, NCoreNetworkEncoders, NeverBuffer } from "./Core/Buffers";
import { NexusCoreTypes } from "./Core/CoreTypes";
import { NetworkSerializableType, NetworkType } from "./Core/Types/NetworkTypes";

export const NexusPlayer: NetworkSerializableType<Player, float64> = {
	Name: "Player",
	ValidateError: "Expected a Player",
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

export const NexusTeam: NetworkSerializableType<Team, string> = {
	Name: "Team",
	ValidateError: "Expected a team",
	NetworkBuffer: NCoreNetworkEncoders.String,
	Validate(value): value is Team {
		return typeIs(value, "Instance") && value.IsA("Team");
	},
	Serialize(value) {
		return value.Name;
	},
	Deserialize(value) {
		const team = game
			.GetService("Teams")
			.GetTeams()
			.find((f) => f.Name === value);
		assert(team, `Could not find team with name '${value}'`);
		return team;
	},
};

const InstanceOf = <K extends keyof Instances>(instanceType: K): NetworkType<Instances[K], never> => {
	return {
		NetworkBuffer: NeverBuffer,
		Name: instanceType,
		ValidateError: "Expected " + instanceType,
		Validate(value): value is Instances[K] {
			return typeIs(value, "Instance") && value.IsA(instanceType);
		},
	} satisfies NetworkType<Instances[K], never>;
};

export const NexusVector2: NetworkType<Vector2> = {
	NetworkBuffer: {
		WriteData(data, writer) {
			writer.WriteFloat32(data.X);
			writer.WriteFloat32(data.Y);
		},
		ReadData(reader): Vector2 {
			const x = reader.ReadFloat32();
			const y = reader.ReadFloat32();
			return new Vector2(x, y);
		},
	},
	Validate(value) {
		return typeIs(value, "Vector2");
	},
	Name: "Vector2",
	ValidateError: "Expected Vector2",
};

export const NexusVector3: NetworkType<Vector3> = {
	NetworkBuffer: {
		WriteData(data, writer) {
			writer.WriteFloat32(data.X);
			writer.WriteFloat32(data.Y);
			writer.WriteFloat32(data.Z);
		},
		ReadData(reader): Vector3 {
			const x = reader.ReadFloat32();
			const y = reader.ReadFloat32();
			const z = reader.ReadFloat32();
			return new Vector3(x, y, z);
		},
	},
	Validate(value) {
		return typeIs(value, "Vector3");
	},
	Name: "Vector3",
	ValidateError: "Expected Vector3",
};

export const NexusVector2Int16: NetworkType<Vector2int16> = {
	NetworkBuffer: {
		WriteData(data, writer) {
			writer.WriteInt16(data.X);
			writer.WriteInt16(data.Y);
		},
		ReadData(reader): Vector2int16 {
			const x = reader.ReadInt16();
			const y = reader.ReadInt16();
			return new Vector2int16(x, y);
		},
	},
	Validate(value) {
		return typeIs(value, "Vector2int16");
	},
	Name: "Vector2int16",
	ValidateError: "Expected Vector2int16",
};

export const NexusVector3Int16: NetworkType<Vector3int16> = {
	NetworkBuffer: {
		WriteData(data, writer) {
			writer.WriteInt16(data.X);
			writer.WriteInt16(data.Y);
			writer.WriteInt16(data.Z);
		},
		ReadData(reader): Vector3int16 {
			const x = reader.ReadInt16();
			const y = reader.ReadInt16();
			const z = reader.ReadInt16();
			return new Vector3int16(x, y, z);
		},
	},
	Validate(value) {
		return typeIs(value, "Vector3int16");
	},
	Name: "Vector3int16",
	ValidateError: "Expected Vector3int16",
};

export const NexusColor3: NetworkType<Color3> = {
	NetworkBuffer: {
		WriteData(data, writer) {
			writer.WriteFloat32(data.R);
			writer.WriteFloat32(data.G);
			writer.WriteFloat32(data.B);
		},
		ReadData(reader): Color3 {
			const r = reader.ReadFloat32();
			const g = reader.ReadFloat32();
			const b = reader.ReadFloat32();
			return new Color3(r, g, b);
		},
	},
	Validate(value) {
		return typeIs(value, "Color3");
	},
	Name: "Color3",
	ValidateError: "Expected Color3",
};

export const NexusNumberRange: NetworkType<NumberRange> = {
	NetworkBuffer: {
		WriteData(data, writer) {
			writer.WriteFloat32(data.Min);
			writer.WriteFloat32(data.Max);
		},
		ReadData(reader): NumberRange {
			const min = reader.ReadFloat32();
			const max = reader.ReadFloat32();
			return new NumberRange(min, max);
		},
	},
	Validate(value) {
		return typeIs(value, "NumberRange");
	},
	Name: "NumberRange",
	ValidateError: "Expected NumberRange",
};

export const NexusNumberSequence: NetworkType<NumberSequence> = {
	NetworkBuffer: {
		WriteData(data, writer) {
			const keypoints = data.Keypoints;
			writer.WriteInt32(keypoints.size());

			for (const keypoint of keypoints) {
				writer.WriteFloat32(keypoint.Time);
				writer.WriteFloat32(keypoint.Value);
				writer.WriteFloat32(keypoint.Envelope);
			}
		},
		ReadData(reader): NumberSequence {
			const numItems = reader.ReadInt32();
			const keypoints = new Array<NumberSequenceKeypoint>();

			for (let i = 0; i < numItems; i++) {
				const time = reader.ReadFloat32();
				const value = reader.ReadFloat32();
				const envelope = reader.ReadFloat32();
				keypoints.push(new NumberSequenceKeypoint(time, value, envelope));
			}

			return new NumberSequence(keypoints);
		},
	},
	Validate(value) {
		return typeIs(value, "NumberSequence");
	},
	Name: "NumberSequence",
	ValidateError: "Expected NumberSequence",
};

export const NexusColorSequence: NetworkType<ColorSequence> = {
	NetworkBuffer: {
		WriteData(data, writer) {
			const keypoints = data.Keypoints;
			writer.WriteInt32(keypoints.size());

			for (const keypoint of keypoints) {
				writer.WriteFloat32(keypoint.Time);
				NexusColor3.NetworkBuffer.WriteData(keypoint.Value, writer);
			}
		},
		ReadData(reader): ColorSequence {
			const numItems = reader.ReadInt32();
			const keypoints = new Array<ColorSequenceKeypoint>();

			for (let i = 0; i < numItems; i++) {
				const time = reader.ReadFloat32();
				const value = NexusColor3.NetworkBuffer.ReadData(reader);
				keypoints.push(new ColorSequenceKeypoint(time, value));
			}

			return new ColorSequence(keypoints);
		},
	},
	Validate(value) {
		return typeIs(value, "ColorSequence");
	},
	Name: "ColorSequence",
	ValidateError: "Expected ColorSequence",
};

export const NexusDateTime: NetworkType<DateTime> = {
	NetworkBuffer: {
		ReadData(reader) {
			const dateTime = reader.ReadFloat64();
			return DateTime.fromUnixTimestamp(dateTime);
		},
		WriteData(data, writer) {
			writer.WriteFloat64(data.UnixTimestamp);
		},
	},
	Validate(value) {
		return typeIs(value, "DateTime");
	},
	Name: "DateTime",
	ValidateError: "Expected DateTime",
};

export const NexusCFrame: NetworkType<CFrame> = {
	NetworkBuffer: {
		ReadData(reader) {
			const position = NexusVector3.NetworkBuffer.ReadData(reader);
			const direction = NexusVector3.NetworkBuffer.ReadData(reader);
			const cf = CFrame.lookAt(position, direction);
			return cf;
		},
		WriteData(data, writer) {
			NexusVector3.NetworkBuffer.WriteData(data.Position, writer);
			NexusVector3.NetworkBuffer.WriteData(data.LookVector, writer);
		},
	},
	Validate(value) {
		return typeIs(value, "CFrame");
	},
	Name: "CFrame",
	ValidateError: "Expected CFrame",
};

export const NexusTypes = {
	...NexusCoreTypes,
	Player: NexusPlayer,
	Team: NexusTeam,
	/**
	 * An instance in Roblox of the given type
	 *
	 * **NOTE**: This will not work with buffers due to no unique ids for Roblox instances! use of this will disable the buffer setting for a remote.
	 */
	InstanceOf: InstanceOf,
	/**
	 * An arbitrary instance in Roblox
	 *
	 * **NOTE**: This will not work with buffers due to no unique ids for Roblox instances! use of this will disable the buffer setting for a remote.
	 */
	Instance: InstanceOf("Instance"),
	Vector3int16: NexusVector2Int16,
	Vector3: NexusVector3,
	Vector2int16: NexusVector2Int16,
	Vector2: NexusVector2,
	Color3: NexusColor3,
	NumberRange: NexusNumberRange,
	NumberSequence: NexusNumberSequence,
	ColorSequence: NexusColorSequence,
	DateTime: NexusDateTime,
	CFrame: NexusCFrame,
};
