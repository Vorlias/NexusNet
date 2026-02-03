import { NeverBuffer } from "../Buffers";
import { BufferReader } from "../Buffers/BufferReader";
import { BufferWriter } from "../Buffers/BufferWriter";
import { NetworkType } from "../Types/NetworkTypes";

/**
 * Transforms arguments from the buffer to an array of arguments using the given transformers
 * @param transformers The list of argument transformers (in order)
 * @param buffer The buffer to transform
 * @returns The argument array
 */
export function TransformBufferToArgs(name: string, transformers: NetworkType.Any[], buffer: buffer) {
	const encoders = NetworkType.TypesToBuffers(...transformers);

	const args = table.create(transformers.size());
	const reader = new BufferReader(buffer);

	for (let i = 0; i < transformers.size(); i++) {
		const bufferEncoder = encoders[i];
		if (bufferEncoder === undefined || bufferEncoder === NeverBuffer) {
			throw `Cannot encode value to buffer at index ${i} for ${name}`;
		}

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
export function TransformArgsToBuffer(name: string, transformers: NetworkType.Any[], args: unknown[]): buffer {
	const encoders = NetworkType.TypesToBuffers(...transformers);

	const writer = new BufferWriter(64);

	for (let i = 0; i < transformers.size(); i++) {
		const bufferEncoder = encoders[i];
		if (bufferEncoder === undefined || bufferEncoder === NeverBuffer) {
			throw `Cannot encode value to buffer at index ${i} for ${name}`;
		}

		bufferEncoder.WriteData(args[i], writer);
	}

	return writer.ToBuffer();
}
