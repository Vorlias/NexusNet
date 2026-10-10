interface ServerCallbackMiddleware<
	TArguments extends readonly unknown[] = unknown[],
	TReturns extends unknown = unknown,
> {
	(fire: (player: Player, ...args: TArguments) => TReturns): (sender: Player, ...args: TArguments) => TReturns;
}

interface ClientCallbackMiddleware<
	TArguments extends readonly unknown[] = unknown[],
	TReturns extends unknown = unknown,
> {
	(fire: (...args: TArguments) => TReturns): (...args: TArguments) => TReturns;
}

export interface ServerEventCallbackMiddleware<TArguments extends readonly unknown[]> extends ServerCallbackMiddleware<
	TArguments,
	void
> {}

export interface ClientEventCallbackMiddleware<TArguments extends readonly unknown[]> extends ClientCallbackMiddleware<
	TArguments,
	void
> {}

export interface ServerFunctionCallbackMiddleware<
	TArguments extends readonly unknown[],
	TReturns extends defined,
> extends ServerCallbackMiddleware<TArguments, TReturns> {}
