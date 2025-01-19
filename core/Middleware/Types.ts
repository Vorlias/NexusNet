import { NetworkClientEvent, NetworkPlayer, NetworkServerEvent } from "../Types/Dist";

type Arguments = ReadonlyArray<unknown>;

export type ServerInvokeMiddleware<C extends Arguments = Arguments, PC extends Arguments = C> = (
	player: NetworkPlayer,
	args: C,
) => (player: NetworkPlayer, ...args: PC) => void;

export type ServerCallbackMiddleware<C extends Arguments = Arguments, PC extends Arguments = C, Ret = void> = (
	fire: (player: NetworkPlayer, ...args: C) => Ret,
	instance: NetworkServerEvent,
) => (sender: NetworkPlayer, ...args: PC) => Ret;

export type ClientInvokeMiddleware<C extends Arguments = Arguments, PC extends Arguments = C> = (
	args: C,
	// callback: (...args: C) => void,
) => (...args: PC) => void;

export type ClientCallbackMiddleware<C extends Arguments = Arguments, PC extends Arguments = C, Ret = void> = (
	fire: (...args: C) => Ret,
	instance: NetworkClientEvent,
) => (...args: PC) => Ret;
