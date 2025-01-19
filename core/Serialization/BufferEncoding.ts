import { BufferReader } from "../Buffers/BufferReader";
import { BufferWriter } from "../Buffers/BufferWriter";
import { StaticNetworkType } from "../Types/NetworkTypes";

/**
 * Transforms arguments from the buffer to an array of arguments using the given transformers
 * @param transformers The list of argument transformers (in order)
 * @param buffer The buffer to transform
 * @returns The argument array
 */
export function TransformBufferToArgs(transformers: StaticNetworkType[], buffer: buffer) {
	const args = table.create(transformers.size());
	const reader = new BufferReader(buffer);

	for (let i = 0; i < transformers.size(); i++) {
		const bufferEncoder = transformers[i].NetworkBuffer;
		const result = bufferEncoder.ReadData(reader);
		args[i] = result;
	}

	return args;
}

/**
 * Transforms given arguments to a buffer using the given transformers
 * @param transformers The list of argument transformers (in order)
 * @param args The arugments to transform
 * @returns The argument buffer
 */
export function TransformArgsToBuffer(transformers: StaticNetworkType[], args: unknown[]): buffer {
	const writer = new BufferWriter(64);

	for (let i = 0; i < transformers.size(); i++) {
		const bufferEncoder = transformers[i].NetworkBuffer;
		bufferEncoder.WriteData(args[i], writer);
	}

	return writer.ToBuffer();
}
