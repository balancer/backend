export const abi = [
    {
        inputs: [],
        name: 'currentAPY',
        outputs: [
            { internalType: 'uint256', name: '_apy', type: 'uint256' },
            { internalType: 'uint256', name: '_startTime', type: 'uint256' },
            { internalType: 'uint256', name: '_endTime', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;
