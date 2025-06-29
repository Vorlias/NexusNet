import { DistribInfo } from "./utils/typescript-version";

export interface TransformConfiguration {
    platform: DistribInfo;
    debug: boolean;
    verbose: boolean;
}