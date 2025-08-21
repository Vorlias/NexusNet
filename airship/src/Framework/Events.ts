import { Player } from "@Easy/Core/Shared/Player/Player";
import { Signal } from "@Easy/Core/Shared/Util/Signal";
import { StaticNetworkType } from "../Core/Types/NetworkTypes";
import { Bin } from "@Easy/Core/Shared/Util/Bin";
import { Game } from "@Easy/Core/Shared/Game";

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
	export const onServerBufferDecodeError = new Signal<
		[player: Player, name: string, networkTypes: StaticNetworkType[], err: unknown]
	>();
	export const onServerDeserializationError = new Signal<
		[player: Player, name: string, networkType: StaticNetworkType, inputArg: unknown]
	>();
	export const onServerArgumentMismatch = new Signal<
		[player: Player, fromBuffer: boolean, name: string, argCount: number, expectedArgCount: number]
	>();
	export const onServerValidationFailure = new Signal<
		[player: Player, fromBuffer: boolean, id: string, networkType: StaticNetworkType, arg: unknown, index: number]
	>();

	function Enable() {
		if (sentinelEnabled) return;
		print("[Nexus] Sentinel is now enabled");
		sentinelEnabled = true;
	}

	export function IsEnabled() {
		return sentinelEnabled;
	}

	export interface NexusValidationError {
		readonly type: "Validation";
		readonly player: Player;
		readonly fromBuffer: boolean;
		readonly id: string;
		readonly argIndex: number;
		readonly value: unknown;
		readonly networkType: StaticNetworkType;
	}

	export interface NexusBufferError {
		readonly type: "BufferDecode";
		readonly networkTypes: StaticNetworkType[];
		readonly error: unknown;
	}

	export type SentinelObserver = (event: NexusValidationError | NexusBufferError) => void;
	export function Observe(observer: SentinelObserver, eventTypes = NexusSentinelEvents.Default): () => void {
		assert(Game.IsServer(), "Sentinel is a server-only Nexus extension");
		Enable(); // enable sentinel

		const checkValidation = (eventTypes & NexusSentinelEvents.Validator) !== 0;
		const checkErrors = (eventTypes & NexusSentinelEvents.BufferErrors) !== 0;

		const bin = new Bin();
		if (checkValidation) {
			bin.Add(
				onServerValidationFailure.Connect((player, fromBuffer, id, networkType, value, argIndex) => {
					let data: NexusValidationError = {
						type: "Validation",
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
					let data: NexusBufferError = {
						type: "BufferDecode",
						networkTypes,
						error: err,
					};

					observer(data);
				}),
			);
		}

		return () => bin.Clean();
	}
}

// This should never be changed.
table.freeze(NexusSentinel);
