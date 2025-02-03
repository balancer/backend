export default [
    {
        type: 'function',
        name: 'DOMAIN_SEPARATOR',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'bytes32',
                internalType: 'bytes32',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'PERMIT_TYPEHASH',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'bytes32',
                internalType: 'bytes32',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'allowance',
        inputs: [
            {
                name: 'owner',
                type: 'address',
                internalType: 'address',
            },
            {
                name: 'spender',
                type: 'address',
                internalType: 'address',
            },
        ],
        outputs: [
            {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'balanceOf',
        inputs: [
            {
                name: 'account',
                type: 'address',
                internalType: 'address',
            },
        ],
        outputs: [
            {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'computeBalance',
        inputs: [
            {
                name: 'balancesLiveScaled18',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
            {
                name: 'tokenInIndex',
                type: 'uint256',
                internalType: 'uint256',
            },
            {
                name: 'invariantRatio',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        outputs: [
            {
                name: 'newBalance',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'computeInvariant',
        inputs: [
            {
                name: 'balancesLiveScaled18',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
            {
                name: 'rounding',
                type: 'uint8',
                internalType: 'enum Rounding',
            },
        ],
        outputs: [
            {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'eip712Domain',
        inputs: [],
        outputs: [
            {
                name: 'fields',
                type: 'bytes1',
                internalType: 'bytes1',
            },
            {
                name: 'name',
                type: 'string',
                internalType: 'string',
            },
            {
                name: 'version',
                type: 'string',
                internalType: 'string',
            },
            {
                name: 'chainId',
                type: 'uint256',
                internalType: 'uint256',
            },
            {
                name: 'verifyingContract',
                type: 'address',
                internalType: 'address',
            },
            {
                name: 'salt',
                type: 'bytes32',
                internalType: 'bytes32',
            },
            {
                name: 'extensions',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getAggregateFeePercentages',
        inputs: [],
        outputs: [
            {
                name: 'aggregateSwapFeePercentage',
                type: 'uint256',
                internalType: 'uint256',
            },
            {
                name: 'aggregateYieldFeePercentage',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getCurrentLiveBalances',
        inputs: [],
        outputs: [
            {
                name: 'balancesLiveScaled18',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getGradualWeightUpdateParams',
        inputs: [],
        outputs: [
            {
                name: 'startTime',
                type: 'uint256',
                internalType: 'uint256',
            },
            {
                name: 'endTime',
                type: 'uint256',
                internalType: 'uint256',
            },
            {
                name: 'startWeights',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
            {
                name: 'endWeights',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getLBPoolDynamicData',
        inputs: [],
        outputs: [
            {
                name: 'data',
                type: 'tuple',
                internalType: 'struct LBPoolDynamicData',
                components: [
                    {
                        name: 'balancesLiveScaled18',
                        type: 'uint256[]',
                        internalType: 'uint256[]',
                    },
                    {
                        name: 'normalizedWeights',
                        type: 'uint256[]',
                        internalType: 'uint256[]',
                    },
                    {
                        name: 'staticSwapFeePercentage',
                        type: 'uint256',
                        internalType: 'uint256',
                    },
                    {
                        name: 'totalSupply',
                        type: 'uint256',
                        internalType: 'uint256',
                    },
                    {
                        name: 'isPoolInitialized',
                        type: 'bool',
                        internalType: 'bool',
                    },
                    {
                        name: 'isPoolPaused',
                        type: 'bool',
                        internalType: 'bool',
                    },
                    {
                        name: 'isPoolInRecoveryMode',
                        type: 'bool',
                        internalType: 'bool',
                    },
                    {
                        name: 'isSwapEnabled',
                        type: 'bool',
                        internalType: 'bool',
                    },
                ],
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getLBPoolImmutableData',
        inputs: [],
        outputs: [
            {
                name: 'data',
                type: 'tuple',
                internalType: 'struct LBPoolImmutableData',
                components: [
                    {
                        name: 'tokens',
                        type: 'address[]',
                        internalType: 'contract IERC20[]',
                    },
                    {
                        name: 'decimalScalingFactors',
                        type: 'uint256[]',
                        internalType: 'uint256[]',
                    },
                    {
                        name: 'startWeights',
                        type: 'uint256[]',
                        internalType: 'uint256[]',
                    },
                    {
                        name: 'endWeights',
                        type: 'uint256[]',
                        internalType: 'uint256[]',
                    },
                    {
                        name: 'startTime',
                        type: 'uint256',
                        internalType: 'uint256',
                    },
                    {
                        name: 'endTime',
                        type: 'uint256',
                        internalType: 'uint256',
                    },
                    {
                        name: 'isProjectTokenSwapInBlocked',
                        type: 'bool',
                        internalType: 'bool',
                    },
                ],
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getNormalizedWeights',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getStaticSwapFeePercentage',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getTokenInfo',
        inputs: [],
        outputs: [
            {
                name: 'tokens',
                type: 'address[]',
                internalType: 'contract IERC20[]',
            },
            {
                name: 'tokenInfo',
                type: 'tuple[]',
                internalType: 'struct TokenInfo[]',
                components: [
                    {
                        name: 'tokenType',
                        type: 'uint8',
                        internalType: 'enum TokenType',
                    },
                    {
                        name: 'rateProvider',
                        type: 'address',
                        internalType: 'contract IRateProvider',
                    },
                    {
                        name: 'paysYieldFees',
                        type: 'bool',
                        internalType: 'bool',
                    },
                ],
            },
            {
                name: 'balancesRaw',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
            {
                name: 'lastBalancesLiveScaled18',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getTokens',
        inputs: [],
        outputs: [
            {
                name: 'tokens',
                type: 'address[]',
                internalType: 'contract IERC20[]',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getTrustedRouter',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'address',
                internalType: 'address',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getVault',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'address',
                internalType: 'contract IVault',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'isProjectTokenSwapInBlocked',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'bool',
                internalType: 'bool',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'isSwapEnabled',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'bool',
                internalType: 'bool',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'name',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'string',
                internalType: 'string',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'nonces',
        inputs: [
            {
                name: 'owner',
                type: 'address',
                internalType: 'address',
            },
        ],
        outputs: [
            {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'onBeforeAddLiquidity',
        inputs: [
            {
                name: 'router',
                type: 'address',
                internalType: 'address',
            },
            {
                name: '',
                type: 'address',
                internalType: 'address',
            },
            {
                name: '',
                type: 'uint8',
                internalType: 'enum AddLiquidityKind',
            },
            {
                name: '',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
            {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
            },
            {
                name: '',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
            {
                name: '',
                type: 'bytes',
                internalType: 'bytes',
            },
        ],
        outputs: [
            {
                name: '',
                type: 'bool',
                internalType: 'bool',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'onBeforeInitialize',
        inputs: [
            {
                name: '',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
            {
                name: '',
                type: 'bytes',
                internalType: 'bytes',
            },
        ],
        outputs: [
            {
                name: '',
                type: 'bool',
                internalType: 'bool',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'onBeforeRemoveLiquidity',
        inputs: [
            {
                name: '',
                type: 'address',
                internalType: 'address',
            },
            {
                name: '',
                type: 'address',
                internalType: 'address',
            },
            {
                name: '',
                type: 'uint8',
                internalType: 'enum RemoveLiquidityKind',
            },
            {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
            },
            {
                name: '',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
            {
                name: '',
                type: 'uint256[]',
                internalType: 'uint256[]',
            },
            {
                name: '',
                type: 'bytes',
                internalType: 'bytes',
            },
        ],
        outputs: [
            {
                name: '',
                type: 'bool',
                internalType: 'bool',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'onComputeDynamicSwapFeePercentage',
        inputs: [
            {
                name: '',
                type: 'tuple',
                internalType: 'struct PoolSwapParams',
                components: [
                    {
                        name: 'kind',
                        type: 'uint8',
                        internalType: 'enum SwapKind',
                    },
                    {
                        name: 'amountGivenScaled18',
                        type: 'uint256',
                        internalType: 'uint256',
                    },
                    {
                        name: 'balancesScaled18',
                        type: 'uint256[]',
                        internalType: 'uint256[]',
                    },
                    {
                        name: 'indexIn',
                        type: 'uint256',
                        internalType: 'uint256',
                    },
                    {
                        name: 'indexOut',
                        type: 'uint256',
                        internalType: 'uint256',
                    },
                    {
                        name: 'router',
                        type: 'address',
                        internalType: 'address',
                    },
                    {
                        name: 'userData',
                        type: 'bytes',
                        internalType: 'bytes',
                    },
                ],
            },
            {
                name: '',
                type: 'address',
                internalType: 'address',
            },
            {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        outputs: [
            {
                name: '',
                type: 'bool',
                internalType: 'bool',
            },
            {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'onRegister',
        inputs: [
            {
                name: '',
                type: 'address',
                internalType: 'address',
            },
            {
                name: 'pool',
                type: 'address',
                internalType: 'address',
            },
            {
                name: 'tokenConfig',
                type: 'tuple[]',
                internalType: 'struct TokenConfig[]',
                components: [
                    {
                        name: 'token',
                        type: 'address',
                        internalType: 'contract IERC20',
                    },
                    {
                        name: 'tokenType',
                        type: 'uint8',
                        internalType: 'enum TokenType',
                    },
                    {
                        name: 'rateProvider',
                        type: 'address',
                        internalType: 'contract IRateProvider',
                    },
                    {
                        name: 'paysYieldFees',
                        type: 'bool',
                        internalType: 'bool',
                    },
                ],
            },
            {
                name: '',
                type: 'tuple',
                internalType: 'struct LiquidityManagement',
                components: [
                    {
                        name: 'disableUnbalancedLiquidity',
                        type: 'bool',
                        internalType: 'bool',
                    },
                    {
                        name: 'enableAddLiquidityCustom',
                        type: 'bool',
                        internalType: 'bool',
                    },
                    {
                        name: 'enableRemoveLiquidityCustom',
                        type: 'bool',
                        internalType: 'bool',
                    },
                    {
                        name: 'enableDonation',
                        type: 'bool',
                        internalType: 'bool',
                    },
                ],
            },
        ],
        outputs: [
            {
                name: '',
                type: 'bool',
                internalType: 'bool',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'onSwap',
        inputs: [
            {
                name: 'request',
                type: 'tuple',
                internalType: 'struct PoolSwapParams',
                components: [
                    {
                        name: 'kind',
                        type: 'uint8',
                        internalType: 'enum SwapKind',
                    },
                    {
                        name: 'amountGivenScaled18',
                        type: 'uint256',
                        internalType: 'uint256',
                    },
                    {
                        name: 'balancesScaled18',
                        type: 'uint256[]',
                        internalType: 'uint256[]',
                    },
                    {
                        name: 'indexIn',
                        type: 'uint256',
                        internalType: 'uint256',
                    },
                    {
                        name: 'indexOut',
                        type: 'uint256',
                        internalType: 'uint256',
                    },
                    {
                        name: 'router',
                        type: 'address',
                        internalType: 'address',
                    },
                    {
                        name: 'userData',
                        type: 'bytes',
                        internalType: 'bytes',
                    },
                ],
            },
        ],
        outputs: [
            {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'owner',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'address',
                internalType: 'address',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'pendingOwner',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'address',
                internalType: 'address',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'supportsInterface',
        inputs: [
            {
                name: 'interfaceId',
                type: 'bytes4',
                internalType: 'bytes4',
            },
        ],
        outputs: [
            {
                name: '',
                type: 'bool',
                internalType: 'bool',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'symbol',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'string',
                internalType: 'string',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'totalSupply',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'version',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'string',
                internalType: 'string',
            },
        ],
        stateMutability: 'view',
    },
] as const;
