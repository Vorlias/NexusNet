import { NetworkSerialization } from "../Serialization";
import { NexusNeverEncoder } from "../Types/NetworkEncoding";
import { NetworkType, NetworkTypeFlags } from "../Types/NetworkType";
import { BufferReader } from "./BufferReader";
import { BufferWriter } from "./BufferWriter";
const encodingService = game.GetService("EncodingService");

export function TransformFromBuffer(
	buf: buffer,
	argumentTypes: NetworkType.Unknown[],
	compression: CastsToEnum<Enum.CompressionAlgorithm> | undefined,
): readonly unknown[] {
	if (compression) {
		buf = encodingService.DecompressBuffer(buf, compression);
	}

	const reader = new BufferReader(buf);
	const argList = new Array<unknown>(argumentTypes.size());

	for (let i = 0; i < argumentTypes.size(); i++) {
		const argType = argumentTypes[i];
		if ((argType.Flags & NetworkTypeFlags.NoBufferEncoding) !== 0 || argType.Encoding === NexusNeverEncoder)
			continue;

		argList[i] = NetworkSerialization.Deserialize(argType, argType.Encoding.ReadData(reader));
	}

	return argList;
}

export function TransformToBuffer(
	data: unknown[],
	argumentTypes: NetworkType.Unknown[],
	compression: CastsToEnum<Enum.CompressionAlgorithm> | undefined,
): buffer {
	assert(data.size() === argumentTypes.size());
	const writer = new BufferWriter(4);

	for (let i = 0; i < argumentTypes.size(); i++) {
		const argType = argumentTypes[i];
		if ((argType.Flags & NetworkTypeFlags.NoBufferEncoding) !== 0 || argType.Encoding === NexusNeverEncoder)
			continue;

		argType.Encoding.WriteData(NetworkSerialization.Serialize(argType, data[i]), writer);
	}

	let buf = writer.ToBuffer();
	if (compression) {
		buf = encodingService.CompressBuffer(buf, compression);
	}

	return buf;
}

export function TransformToNetworkArguments(
	args: unknown[],
	types: NetworkType.Unknown[],
	compression: CastsToEnum<Enum.CompressionAlgorithm> | undefined,
): LuaTuple<[buffer, defined[] | undefined]> {
	const buf = TransformToBuffer(args, types, compression);
	const dt = new Array<defined>();

	for (let i = 0; i < types.size(); i++) {
		const a = types[i];
		if ((a.Flags & NetworkTypeFlags.NoBufferEncoding) !== 0 || a.Encoding === NexusNeverEncoder) {
			dt.push(NetworkSerialization.Serialize(a, args[i]) as defined);
		}
	}

	if (dt.size() > 0) {
		return $tuple(buf, dt);
	} else {
		return $tuple(buf, undefined);
	}
}

export function TransformToNetworkReturnBuffer(returnType: NetworkType.Unknown, value: unknown): buffer {
	const buf = TransformToBuffer([value], [returnType], undefined);
	return buf;
}

export function TransformFromNetworkReturnBuffer(returnType: NetworkType.Unknown, buf: buffer): unknown {
	const [value] = TransformFromBuffer(buf, [returnType], undefined);
	return value;
}

export function TransformFromNetworkArguments(
	buf: buffer,
	xData: defined[] | undefined,
	types: NetworkType.Unknown[],
	compression: CastsToEnum<Enum.CompressionAlgorithm> | undefined,
): readonly unknown[] {
	const data = TransformFromBuffer(buf, types, compression) as Writable<unknown[]>;

	if (xData !== undefined) {
		let xDataPtr = 0;
		for (let i = 0; i < types.size(); i++) {
			const a = types[i];
			if ((a.Flags & NetworkTypeFlags.NoBufferEncoding) !== 0 || a.Encoding === NexusNeverEncoder) {
				print("xData", xDataPtr, xData[xDataPtr]);
				data[i] = NetworkSerialization.Deserialize(a, xData[xDataPtr++]) as unknown;
			}
		}
	}

	return data;
}
