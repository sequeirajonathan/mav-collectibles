/**
 * Converts BigInt values to strings in JSON objects.
 * This is necessary because BigInt values cannot be serialized
 * by default in JSON, and they will cause errors when
 * deserialized in JavaScript.
 */
export function serializeBigIntValues(_key: string, value: unknown) {
    return typeof value === 'bigint'
        ? value.toString()
        : value;
} 