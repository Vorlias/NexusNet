import { float64, int32, NetworkEncoding, NexusNeverEncoder } from "./NetworkEncoding";
import { NetworkType, NetworkTypeFlags } from "./NetworkType";

const players = game.GetService("Players");
export const NexusPlayer: NetworkType.Serializable<Player, float64> = {
	Encoding: NetworkEncoding.Double,
	Serializer: {
		Serialize(value) {
			return value.UserId;
		},
		Deserialize(value) {
			const plr = game.GetService("Players").GetPlayerByUserId(value)!;
			assert(plr);
			return plr;
		},
		ValidateDeserialize(value) {
			return players.GetPlayerByUserId(value) !== undefined;
		},
	},
	Flags: 0,
};

export const NexusUserType: NetworkType.Serializable<User, float64> = {
	Encoding: NetworkEncoding.Double,
	Serializer: {
		Serialize(value) {
			return value.Id;
		},
		Deserialize(value) {
			return User.fromId(value);
		},
	},
	Flags: 0,
};

export const NexusColor3: NetworkType<Color3> = {
	Encoding: NetworkEncoding.Color3,
	Flags: 0,
};

export const NexusVector: NetworkType<Vector3> = {
	Encoding: NetworkEncoding.Vector3,
	Flags: 0,
};

export const NexusInstanceHandleOf = <T extends keyof Instances>(
	className: T,
): NetworkType.Serializable<Instances[T], InstanceHandle, void> => {
	return {
		Encoding: NexusNeverEncoder,
		Serializer: {
			Serialize(value) {
				return new InstanceHandle(value);
			},
			ValidateSerialize(value) {
				return value.IsA(className);
			},
			Deserialize(value) {
				return value.Wait() as Instances[T];
			},
		},
		Flags: NetworkTypeFlags.NoBufferEncoding,
	};
};
