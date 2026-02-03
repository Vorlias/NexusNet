import { NetworkClientEvent, NetworkPlayer, NetworkServerEvent } from "../Types/Dist";

type Arguments = ReadonlyArray<unknown>;

export type ServerEventInvokeMiddleware<C extends Arguments = Arguments, PC extends Arguments = C> = (
	players: readonly NetworkPlayer[],
	...args: C
) => void | boolean;

export type ServerEventCallbackMiddleware<C extends Arguments = Arguments, PC extends Arguments = C, Ret = void> = (
	fire: (player: NetworkPlayer, ...args: C) => Ret,
	instance: NetworkServerEvent,
) => (sender: NetworkPlayer, ...args: PC) => Ret;

export type ClientEventInvokeMiddleware<C extends Arguments = Arguments, PC extends Arguments = C> = (
	args: C,
) => void | boolean;

export type ClientEventCallbackMiddleware<C extends Arguments = Arguments, PC extends Arguments = C, Ret = void> = (
	fire: (...args: C) => Ret,
	instance: NetworkClientEvent,
) => (...args: PC) => Ret;

export type ServerFunctionCallbackMiddleware<C extends Arguments = Arguments, Ret = unknown> = (
	invoke: (player: NetworkPlayer, ...args: C) => Ret,
) => (sender: NetworkPlayer, ...args: C) => Ret;

export type ClientFunctionInvokeMiddleware<C extends Arguments = Arguments, PC extends Arguments = C> = (
	...args: C
) => void | boolean;
