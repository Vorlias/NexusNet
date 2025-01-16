export interface ModuleTypes {}

export type NetworkPlayer = ModuleTypes extends { NetworkPlayer: infer A } ? A : never;
