import { float32, float64, NCoreNetworkEncoders, NeverBuffer } from "./Core/Buffers";
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

const Team: NetworkSerializableType<Team, string> = {
	Name: "Team",
	Message: "Expected a team",
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
		Message: "Expected " + instanceType,
		Validate(value): value is Instances[K] {
			return typeIs(value, "Instance") && value.IsA(instanceType);
		},
	} satisfies NetworkType<Instances[K], never>;
};

export const vec2: NetworkType<Vector2> = {
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
	Message: "Expected Vector2",
};

export const vec3: NetworkType<Vector3> = {
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
	Message: "Expected Vector3",
};

export const vec2i16: NetworkType<Vector2int16> = {
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
	Message: "Expected Vector2int16",
};

export const vec3i16: NetworkType<Vector3int16> = {
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
	Message: "Expected Vector3int16",
};

export const color: NetworkType<Color3> = {
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
	Message: "Expected Color3",
};

export const range: NetworkType<NumberRange> = {
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
	Message: "Expected NumberRange",
};

export const numberSeq: NetworkType<NumberSequence> = {
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
	Message: "Expected NumberSequence",
};

export const colorSeq: NetworkType<ColorSequence> = {
	NetworkBuffer: {
		WriteData(data, writer) {
			const keypoints = data.Keypoints;
			writer.WriteInt32(keypoints.size());

			for (const keypoint of keypoints) {
				writer.WriteFloat32(keypoint.Time);
				color.NetworkBuffer.WriteData(keypoint.Value, writer);
			}
		},
		ReadData(reader): ColorSequence {
			const numItems = reader.ReadInt32();
			const keypoints = new Array<ColorSequenceKeypoint>();

			for (let i = 0; i < numItems; i++) {
				const time = reader.ReadFloat32();
				const value = color.NetworkBuffer.ReadData(reader);
				keypoints.push(new ColorSequenceKeypoint(time, value));
			}

			return new ColorSequence(keypoints);
		},
	},
	Validate(value) {
		return typeIs(value, "ColorSequence");
	},
	Name: "ColorSequence",
	Message: "Expected ColorSequence",
};

export const date: NetworkType<DateTime> = {
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
	Message: "Expected DateTime",
};

export const cframe: NetworkType<CFrame> = {
	NetworkBuffer: {
		ReadData(reader) {
			const position = vec3.NetworkBuffer.ReadData(reader);
			const direction = vec3.NetworkBuffer.ReadData(reader);
			const cf = CFrame.lookAt(position, direction);
			return cf;
		},
		WriteData(data, writer) {
			vec3.NetworkBuffer.WriteData(data.Position, writer);
			vec3.NetworkBuffer.WriteData(data.LookVector, writer);
		},
	},
	Validate(value) {
		return typeIs(value, "CFrame");
	},
	Name: "CFrame",
	Message: "Expected CFrame",
};

export const NexusTypes = {
	...NexusCoreTypes,
	Player,
	Team,
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
	Vector3int16: vec2i16,
	Vector3: vec3,
	Vector2int16: vec2i16,
	Vector2: vec2,
	Color3: color,
	NumberRange: range,
	NumberSequence: numberSeq,
	ColorSequence: colorSeq,
	DateTime: date,
	CFrame: cframe,
};
