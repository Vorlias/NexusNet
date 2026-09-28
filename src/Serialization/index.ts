import { NetworkType } from "../Types/NetworkType";

export interface NetworkTypeSerialization<TIn, TOut> {
    /**
     * Serialize the input value to the output value
     */
    Serialize(this: void, value: TIn): TOut;
    /**
     * Deserialize the output value to the input value
     */
    Deserialize(this: void, value: TOut): TIn;

    ValidateDeserialize?(this: void, value: TOut): boolean;
    ValidateSerialize?(this: void, value: TIn): boolean;

    BeforeSerialize?(this: void, value: TIn): void;
    AfterSerialize?(this: void, value: TOut): void;

    BeforeDeserialize?(this: void, value: TOut): void;
    AfterDeserialize?(this: void, value: TIn): void;
}

export namespace NetworkSerialization {
    export function HasSerializer<T extends NetworkType<any, any>>(value: T): value is T & { Serializer: NetworkTypeSerialization<NetworkType.In<T>, NetworkType.Out<T>> } {
        return "Serializer" in value;
    }

    export function Serialize<T extends NetworkType.Any>(value: T, input: NetworkType.In<T>): NetworkType.Out<T> {
        if (HasSerializer(value)) {
            return value.Serializer.Serialize(input);
        } else {
            return input as NetworkType.Out<T>;
        }
    }

    export function Deserialize<T extends NetworkType.Any>(value: T, output: NetworkType.Out<T>): NetworkType.In<T> {
        if (HasSerializer(value)) {
            return value.Serializer.Deserialize(output);
        } else {
            return output as NetworkType.In<T>;
        }
    }
}