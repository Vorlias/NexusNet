export interface NexusTimeSpan {
	readonly $timespan: true;
	readonly seconds: number;
}
export namespace NexusTimeSpan {
	export function seconds(seconds: number): NexusTimeSpan {
		return { $timespan: true, seconds };
	}

	export function minutes(minutes: number): NexusTimeSpan {
		return { $timespan: true, seconds: minutes * 60 };
	}

	export function hours(hours: number): NexusTimeSpan {
		return { $timespan: true, seconds: hours * 3600 };
	}

	export function is(value: unknown): value is NexusTimeSpan {
		return typeIs(value, "table") && "$timespan" in value;
	}
}
