import { float64, NetworkEncoding } from "./NetworkEncoding";
import { NetworkType } from "./NetworkType";

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
        }
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
        }
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