import { Player } from "@Easy/Core/Shared/Player/Player";
import { Signal } from "@Easy/Core/Shared/Util/Signal";
import { StaticNetworkType } from "../Core/Types/NetworkTypes";
import { Bin } from "@Easy/Core/Shared/Util/Bin";
import { Game } from "@Easy/Core/Shared/Game";
import { RateLimitOptions } from "../Core/Middleware/RateLimit";

export const enum NexusSentinelEvents {
	Validator = 1 << 0,
	BufferErrors = 1 << 1,
	Default = Validator | BufferErrors,
}

let sentinelEnabled = false;
/**
 * Namespace for Nexus' Sentinel extension
 *
 * Please use `Nexus.Sentinel` to access this, as this may change.
 */
export namespace NexusSentinel {
	export const enum ErrorType {
		Validation,
		BufferDecode,
	}

	export namespace Events {
		interface ServerError<TType extends ErrorType> {
			readonly type: TType;
			readonly player: Player;
		}

		export interface ValidationError extends ServerError<ErrorType.Validation> {
			readonly fromBuffer: boolean;
			readonly id: string;
			readonly argIndex: number;
			readonly value: unknown;
			readonly networkType: StaticNetworkType;
		}

		export interface BufferDecodeError extends ServerError<ErrorType.BufferDecode> {
			readonly networkTypes: StaticNetworkType[];
			readonly error: unknown;
		}

		export interface ArgumentMismatchError {}
		export interface DeserializationError {}
	}

	export type ObservableEvent = Events.ValidationError | Events.BufferDecodeError;

	type BufferDecodeErrorEvent = [player: Player, name: string, networkTypes: StaticNetworkType[], err: unknown];
	type DeserializationErrorEvent = [player: Player, name: string, networkType: StaticNetworkType, inputArg: unknown];
	type ArgumentMismatchEvent = [
		player: Player,
		fromBuffer: boolean,
		name: string,
		argCount: number,
		expectedArgCount: number,
	];
	type ValidationErrorEvent = [
		player: Player,
		fromBuffer: boolean,
		id: string,
		networkType: StaticNetworkType,
		arg: unknown,
		index: number,
	];

	/**
	 * Called if a network object hits a buffer decoding error
	 */
	export const onServerBufferDecodeError = new Signal<BufferDecodeErrorEvent>();
	/**
	 * If deserialization fails
	 */
	export const onServerDeserializationError = new Signal<DeserializationErrorEvent>();
	/**
	 * If the argument count of an object isn't matching
	 */
	export const onServerArgumentMismatch = new Signal<ArgumentMismatchEvent>();
	/**
	 * If a remote object receives invalid data, this should be _very unlikely_; however if exploiters are trying to abuse systems
	 */
	export const onServerValidationError = new Signal<ValidationErrorEvent>();

	export const onServerPredicateFalse = new Signal<[player: Player]>();

	export const onRateLimitExceeded = new Signal<
		[player: Player, name: string, count: number, requestOptions: RateLimitOptions]
	>();

	export function Enable() {
		if (sentinelEnabled) return;
		print("[Nexus] Sentinel is now enabled");
		sentinelEnabled = true;
	}

	export function IsEnabled() {
		return sentinelEnabled;
	}

	export type SentinelObserver = (event: ObservableEvent) => void;
	export function Observe(observer: SentinelObserver, eventTypes = NexusSentinelEvents.Default): () => void {
		assert(Game.IsServer(), "Sentinel is a server-only Nexus extension");
		Enable(); // enable sentinel

		const checkValidation = (eventTypes & NexusSentinelEvents.Validator) !== 0;
		const checkErrors = (eventTypes & NexusSentinelEvents.BufferErrors) !== 0;

		const bin = new Bin();
		if (checkValidation) {
			bin.Add(
				onServerValidationError.Connect((player, fromBuffer, id, networkType, value, argIndex) => {
					let data: Events.ValidationError = {
						type: ErrorType.Validation,
						id,
						fromBuffer,
						player,
						networkType,
						value,
						argIndex,
					};

					table.freeze(data);
					observer(data);
				}),
			);
		}

		if (checkErrors) {
			bin.Add(
				onServerBufferDecodeError.Connect((player, name, networkTypes, err) => {
					let data: Events.BufferDecodeError = {
						type: ErrorType.BufferDecode,
						player,
						networkTypes,
						error: err,
					};

					table.freeze(data);
					observer(data);
				}),
			);
		}

		return () => bin.Clean();
	}
}

// This should never be changed.
table.freeze(NexusSentinel);
