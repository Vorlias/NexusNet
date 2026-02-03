/**
 * Cross-platform string hash function
 *
 * - in **Airship** this will use {@link string.hash}
 * - in **Roblox** this will use {@link luahashstring} (a slower lua implementation)
 * @param value The string to hash
 */
declare function hashstring(value: string): number;

/**
 * Uses the luau string hashing function (slower than `string.hash` on Airship)
 *
 * This is used by Roblox since roblox has no native string hashing function
 * @param value
 */
declare function luahashstring(value: string): number;
export { hashstring, luahashstring };
