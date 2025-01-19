import { ClientEventLike } from "./Client/NetworkObjects";
import { ServerEventLike } from "./Server/NetworkObjects";

export interface ModuleTypes {}

export type NetworkPlayer = ModuleTypes extends { NetworkPlayer: infer A } ? A : never;
export type Connection = ModuleTypes extends { Connection: infer C } ? C : () => void;

export type NetworkServerEvent = ModuleTypes extends { NetworkServerEvent: infer C } ? C : ServerEventLike;
export type NetworkClientEvent = ModuleTypes extends { NetworkClientEvent: infer C } ? C : ClientEventLike;
