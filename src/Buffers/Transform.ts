import { NetworkType } from "../Types/NetworkType";
import { BufferReader } from "./BufferReader";
import { BufferWriter } from "./BufferWriter";

export function TransformFromBuffer(buf: buffer, argumentTypes: NetworkType.Unknown[]): readonly unknown[] {
    const reader = new BufferReader(buf);
    const argList = new Array<unknown>(argumentTypes.size());

    for (let i = 0; i < argumentTypes.size(); i++) {
        argList[i] = argumentTypes[i].Encoding.ReadData(reader);
    }

    return argList;
}

export function TransformToBuffer(data: unknown[], argumentTypes: NetworkType.Unknown[]): buffer {
    assert(data.size() === argumentTypes.size());
    const writer = new BufferWriter(32);

    for (let i = 0; i < argumentTypes.size(); i++) {
        argumentTypes[i].Encoding.WriteData(data[i], writer);
    }

    return writer.ToBuffer();
}