import { formatUnits } from 'viem';

/**
 * Converts wei to float
 *
 * @param value
 * @param decimals
 * @returns
 */
export const fn = (value: string | bigint, decimals: number): number => {
    // Guard against null or undefined
    if (value === null || value === undefined) {
        return 0;
    }

    // Guard agains float values
    if (typeof value === 'string' && value.includes('.')) {
        return parseFloat(value);
    }

    const wei = typeof value === 'string' ? BigInt(value) : value;
    const str = formatUnits(wei, decimals);

    return parseFloat(str);
};
