const DECIMAL_DIFF_BITS = 5;

export const decodeDecimalDiffs = (diff: bigint, numTokens: number): number[] => {
    const result: number[] = [];
    const mask = (1n << BigInt(DECIMAL_DIFF_BITS)) - 1n;

    for (let i = 0; i < numTokens; i++) {
        const shift = BigInt(i * DECIMAL_DIFF_BITS);
        result[i] = Number((diff >> shift) & mask);
    }

    return result.map((d) => 18 - d);
};
