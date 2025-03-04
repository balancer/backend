export default [
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'DOMAIN_SEPARATOR',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'PERMIT_TYPEHASH',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'spender',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'allowance',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'balanceOf',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
    },
    {
        inputs: [
            {
                internalType: 'uint256[]',
                name: 'balancesLiveScaled18',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256',
                name: 'tokenInIndex',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'invariantRatio',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'computeBalance',
        outputs: [
            {
                internalType: 'uint256',
                name: 'newBalance',
                type: 'uint256',
            },
        ],
    },
    {
        inputs: [
            {
                internalType: 'uint256[]',
                name: 'balancesLiveScaled18',
                type: 'uint256[]',
            },
            {
                internalType: 'enum Rounding',
                name: 'rounding',
                type: 'uint8',
            },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'computeInvariant',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'eip712Domain',
        outputs: [
            {
                internalType: 'bytes1',
                name: 'fields',
                type: 'bytes1',
            },
            {
                internalType: 'string',
                name: 'name',
                type: 'string',
            },
            {
                internalType: 'string',
                name: 'version',
                type: 'string',
            },
            {
                internalType: 'uint256',
                name: 'chainId',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: 'verifyingContract',
                type: 'address',
            },
            {
                internalType: 'bytes32',
                name: 'salt',
                type: 'bytes32',
            },
            {
                internalType: 'uint256[]',
                name: 'extensions',
                type: 'uint256[]',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getAggregateFeePercentages',
        outputs: [
            {
                internalType: 'uint256',
                name: 'aggregateSwapFeePercentage',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'aggregateYieldFeePercentage',
                type: 'uint256',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getCurrentLiveBalances',
        outputs: [
            {
                internalType: 'uint256[]',
                name: 'balancesLiveScaled18',
                type: 'uint256[]',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getGradualWeightUpdateParams',
        outputs: [
            {
                internalType: 'uint256',
                name: 'startTime',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'endTime',
                type: 'uint256',
            },
            {
                internalType: 'uint256[]',
                name: 'startWeights',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256[]',
                name: 'endWeights',
                type: 'uint256[]',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getLBPoolDynamicData',
        outputs: [
            {
                internalType: 'struct LBPoolDynamicData',
                name: 'data',
                type: 'tuple',
                components: [
                    {
                        internalType: 'uint256[]',
                        name: 'balancesLiveScaled18',
                        type: 'uint256[]',
                    },
                    {
                        internalType: 'uint256[]',
                        name: 'normalizedWeights',
                        type: 'uint256[]',
                    },
                    {
                        internalType: 'uint256',
                        name: 'staticSwapFeePercentage',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'totalSupply',
                        type: 'uint256',
                    },
                    {
                        internalType: 'bool',
                        name: 'isPoolInitialized',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'isPoolPaused',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'isPoolInRecoveryMode',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'isSwapEnabled',
                        type: 'bool',
                    },
                ],
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getLBPoolImmutableData',
        outputs: [
            {
                internalType: 'struct LBPoolImmutableData',
                name: 'data',
                type: 'tuple',
                components: [
                    {
                        internalType: 'contract IERC20[]',
                        name: 'tokens',
                        type: 'address[]',
                    },
                    {
                        internalType: 'uint256[]',
                        name: 'decimalScalingFactors',
                        type: 'uint256[]',
                    },
                    {
                        internalType: 'uint256[]',
                        name: 'startWeights',
                        type: 'uint256[]',
                    },
                    {
                        internalType: 'uint256[]',
                        name: 'endWeights',
                        type: 'uint256[]',
                    },
                    {
                        internalType: 'uint256',
                        name: 'startTime',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'endTime',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'projectTokenIndex',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'reserveTokenIndex',
                        type: 'uint256',
                    },
                    {
                        internalType: 'bool',
                        name: 'isProjectTokenSwapInBlocked',
                        type: 'bool',
                    },
                ],
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getNormalizedWeights',
        outputs: [
            {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getProjectToken',
        outputs: [
            {
                internalType: 'contract IERC20',
                name: '',
                type: 'address',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getReserveToken',
        outputs: [
            {
                internalType: 'contract IERC20',
                name: '',
                type: 'address',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getStaticSwapFeePercentage',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getTokenInfo',
        outputs: [
            {
                internalType: 'contract IERC20[]',
                name: 'tokens',
                type: 'address[]',
            },
            {
                internalType: 'struct TokenInfo[]',
                name: 'tokenInfo',
                type: 'tuple[]',
                components: [
                    {
                        internalType: 'enum TokenType',
                        name: 'tokenType',
                        type: 'uint8',
                    },
                    {
                        internalType: 'contract IRateProvider',
                        name: 'rateProvider',
                        type: 'address',
                    },
                    {
                        internalType: 'bool',
                        name: 'paysYieldFees',
                        type: 'bool',
                    },
                ],
            },
            {
                internalType: 'uint256[]',
                name: 'balancesRaw',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256[]',
                name: 'lastBalancesLiveScaled18',
                type: 'uint256[]',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getTokens',
        outputs: [
            {
                internalType: 'contract IERC20[]',
                name: 'tokens',
                type: 'address[]',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getTrustedRouter',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'getVault',
        outputs: [
            {
                internalType: 'contract IVault',
                name: '',
                type: 'address',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'isProjectTokenSwapInBlocked',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'isSwapEnabled',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'name',
        outputs: [
            {
                internalType: 'string',
                name: '',
                type: 'string',
            },
        ],
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'nonces',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'router',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'enum AddLiquidityKind',
                name: '',
                type: 'uint8',
            },
            {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'onBeforeAddLiquidity',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
    },
    {
        inputs: [
            {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'onBeforeInitialize',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'enum RemoveLiquidityKind',
                name: '',
                type: 'uint8',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'onBeforeRemoveLiquidity',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
    },
    {
        inputs: [
            {
                internalType: 'struct PoolSwapParams',
                name: '',
                type: 'tuple',
                components: [
                    {
                        internalType: 'enum SwapKind',
                        name: 'kind',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amountGivenScaled18',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256[]',
                        name: 'balancesScaled18',
                        type: 'uint256[]',
                    },
                    {
                        internalType: 'uint256',
                        name: 'indexIn',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'indexOut',
                        type: 'uint256',
                    },
                    {
                        internalType: 'address',
                        name: 'router',
                        type: 'address',
                    },
                    {
                        internalType: 'bytes',
                        name: 'userData',
                        type: 'bytes',
                    },
                ],
            },
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'onComputeDynamicSwapFeePercentage',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'pool',
                type: 'address',
            },
            {
                internalType: 'struct TokenConfig[]',
                name: 'tokenConfig',
                type: 'tuple[]',
                components: [
                    {
                        internalType: 'contract IERC20',
                        name: 'token',
                        type: 'address',
                    },
                    {
                        internalType: 'enum TokenType',
                        name: 'tokenType',
                        type: 'uint8',
                    },
                    {
                        internalType: 'contract IRateProvider',
                        name: 'rateProvider',
                        type: 'address',
                    },
                    {
                        internalType: 'bool',
                        name: 'paysYieldFees',
                        type: 'bool',
                    },
                ],
            },
            {
                internalType: 'struct LiquidityManagement',
                name: '',
                type: 'tuple',
                components: [
                    {
                        internalType: 'bool',
                        name: 'disableUnbalancedLiquidity',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'enableAddLiquidityCustom',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'enableRemoveLiquidityCustom',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'enableDonation',
                        type: 'bool',
                    },
                ],
            },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'onRegister',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
    },
    {
        inputs: [
            {
                internalType: 'struct PoolSwapParams',
                name: 'request',
                type: 'tuple',
                components: [
                    {
                        internalType: 'enum SwapKind',
                        name: 'kind',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amountGivenScaled18',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256[]',
                        name: 'balancesScaled18',
                        type: 'uint256[]',
                    },
                    {
                        internalType: 'uint256',
                        name: 'indexIn',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'indexOut',
                        type: 'uint256',
                    },
                    {
                        internalType: 'address',
                        name: 'router',
                        type: 'address',
                    },
                    {
                        internalType: 'bytes',
                        name: 'userData',
                        type: 'bytes',
                    },
                ],
            },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'onSwap',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'owner',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'pendingOwner',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
    },
    {
        inputs: [
            {
                internalType: 'bytes4',
                name: 'interfaceId',
                type: 'bytes4',
            },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'supportsInterface',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'symbol',
        outputs: [
            {
                internalType: 'string',
                name: '',
                type: 'string',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'totalSupply',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
    },
    {
        inputs: [],
        stateMutability: 'view',
        type: 'function',
        name: 'version',
        outputs: [
            {
                internalType: 'string',
                name: '',
                type: 'string',
            },
        ],
    },
] as const;
