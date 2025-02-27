import { formatUnits } from 'viem';

/**
 * Converts wei to float
 *
 * @param value
 * @param decimals
 * @returns
 */
export const weiToFloat = (value: string | bigint, decimals: number): number => {
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

/**
 * Formats float as a strings without scientific notation
 *
 * @param value
 * @param decimals
 * @returns
 */
export const floatToExactString = (num: number | string) => {
    if (typeof num === 'string') {
        num = Number(num);
    }
    if (isNaN(num)) {
        return '0';
    }
    const str = num.toString();
    if (str.includes('e')) {
        const [base, exponent] = str.split('e');
        if (Number(exponent) < 0) {
            // For negative exponent, we need to add leading zeros after decimal point
            const absExp = Math.abs(parseInt(exponent, 10));
            const [intPart, decimalPart] = base.split('.');
            const actualInt = intPart === '0' ? '' : intPart;
            const actualDecimal = decimalPart || '';

            return `0.${'0'.repeat(absExp - 1)}${actualInt}${actualDecimal}`;
        } else {
            // Add zeros to the number
            return base + '0'.repeat(parseInt(exponent, 10));
        }
    }
    return str;
};
