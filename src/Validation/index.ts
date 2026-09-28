export namespace TypeChecker {
    export function isString(value: unknown): value is string {
        if (!typeIs(value, "string")) return false;
        const [len] = utf8.len(value);
        return len !== undefined && len !== false;
    }

    export function isInteger(value: unknown): value is number {
        if (!typeIs(value, "number")) return false;
        return value % 1 === 0;
    }
}