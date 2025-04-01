import { float32, float64, NCoreNetworkEncoders, NeverBuffer } from "./Core/Buffers";
import { NexusCoreTypes } from "./Core/CoreTypes";
import { NetworkSerializableType, NetworkType } from "./Core/Types/NetworkTypes";

export const NexusPlayer: NetworkSerializableType<Player, float64> = {
	Name: "Player",
	Validator: {
		ValidateError: "Expected a Player",
		Validate(value): value is Player {
			return typeIs(value, "Instance") && value.IsA("Player");
		},
	},
	BufferEncoder: NCoreNetworkEncoders.Float64,
	Serializer: {
		Serialize(value) {
			return value.UserId;
		},
		Deserialize(value) {
			const player = game.GetService("Players").GetPlayerByUserId(value);
			assert(player, `Could not find player with userId '${value}'`);
			return player;
		},
	},
};

export const NexusTeam: NetworkSerializableType<Team, string> = {
	Name: "Team",
	Validator: {
		ValidateError: "Expected a team",
		Validate(value): value is Team {
			return typeIs(value, "Instance") && value.IsA("Team");
		},
	},
	BufferEncoder: NCoreNetworkEncoders.String,
	Serializer: {
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
	},
};

const InstanceOf = <K extends keyof Instances>(instanceType: K): NetworkType<Instances[K], never> => {
	return {
		BufferEncoder: NeverBuffer,
		Name: instanceType,
		Validator: {
			ValidateError: "Expected " + instanceType,
			Validate(value): value is Instances[K] {
				return typeIs(value, "Instance") && value.IsA(instanceType);
			},
		},
	} satisfies NetworkType<Instances[K], never>;
};

export const NexusVector2: NetworkType<Vector2> = {
	BufferEncoder: {
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
	Validator: {
		Validate(value) {
			return typeIs(value, "Vector2");
		},
		ValidateError: "Expected Vector2",
	},
	Name: "Vector2",
};

export const NexusVector3: NetworkType<Vector3> = {
	BufferEncoder: {
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

	Name: "Vector3",
	Validator: {
		Validate(value) {
			return typeIs(value, "Vector3");
		},
		ValidateError: "Expected Vector3",
	},
};

export const NexusVector2Int16: NetworkType<Vector2int16> = {
	BufferEncoder: {
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
	Validator: {
		Validate(value) {
			return typeIs(value, "Vector2int16");
		},
		ValidateError: "Expected Vector2int16",
	},
	Name: "Vector2int16",
};

export const NexusVector3Int16: NetworkType<Vector3int16> = {
	BufferEncoder: {
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
	Validator: {
		Validate(value) {
			return typeIs(value, "Vector3int16");
		},
		ValidateError: "Expected Vector3int16",
	},
	Name: "Vector3int16",
};

export const NexusColor3: NetworkType<Color3> = {
	BufferEncoder: {
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
	Validator: {
		Validate(value) {
			return typeIs(value, "Color3");
		},
		ValidateError: "Expected Color3",
	},
	Name: "Color3",
};

export const NexusNumberRange: NetworkType<NumberRange> = {
	BufferEncoder: {
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
	Validator: {
		Validate(value) {
			return typeIs(value, "NumberRange");
		},
		ValidateError: "Expected NumberRange",
	},
	Name: "NumberRange",
};

export const NexusNumberSequence: NetworkType<NumberSequence> = {
	BufferEncoder: {
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
	Validator: {
		Validate(value) {
			return typeIs(value, "NumberSequence");
		},
		ValidateError: "Expected NumberSequence",
	},
	Name: "NumberSequence",
};

export const NexusColorSequence: NetworkType<ColorSequence> = {
	BufferEncoder: {
		WriteData(data, writer) {
			const keypoints = data.Keypoints;
			writer.WriteInt32(keypoints.size());

			for (const keypoint of keypoints) {
				writer.WriteFloat32(keypoint.Time);
				NexusColor3.BufferEncoder.WriteData(keypoint.Value, writer);
			}
		},
		ReadData(reader): ColorSequence {
			const numItems = reader.ReadInt32();
			const keypoints = new Array<ColorSequenceKeypoint>();

			for (let i = 0; i < numItems; i++) {
				const time = reader.ReadFloat32();
				const value = NexusColor3.BufferEncoder.ReadData(reader);
				keypoints.push(new ColorSequenceKeypoint(time, value));
			}

			return new ColorSequence(keypoints);
		},
	},
	Validator: {
		Validate(value) {
			return typeIs(value, "ColorSequence");
		},
		ValidateError: "Expected ColorSequence",
	},
	Name: "ColorSequence",
};

export const NexusDateTime: NetworkType<DateTime> = {
	BufferEncoder: {
		ReadData(reader) {
			const dateTime = reader.ReadFloat64();
			return DateTime.fromUnixTimestamp(dateTime);
		},
		WriteData(data, writer) {
			writer.WriteFloat64(data.UnixTimestamp);
		},
	},
	Validator: {
		Validate(value) {
			return typeIs(value, "DateTime");
		},
		ValidateError: "Expected DateTime",
	},
	Name: "DateTime",
};

export const NexusCFrame: NetworkType<CFrame> = {
	BufferEncoder: {
		ReadData(reader) {
			const position = NexusVector3.BufferEncoder.ReadData(reader);
			const direction = NexusVector3.BufferEncoder.ReadData(reader);
			const cf = CFrame.lookAt(position, direction);
			return cf;
		},
		WriteData(data, writer) {
			NexusVector3.BufferEncoder.WriteData(data.Position, writer);
			NexusVector3.BufferEncoder.WriteData(data.LookVector, writer);
		},
	},
	Validator: {
		Validate(value) {
			return typeIs(value, "CFrame");
		},
		ValidateError: "Expected CFrame",
	},
	Name: "CFrame",
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
