export const vaultExplorerAbi = [
    {
        inputs: [
            { internalType: 'contract IVault', name: 'vault', type: 'address' },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'address', name: 'owner', type: 'address' },
            { internalType: 'address', name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'address', name: 'account', type: 'address' },
        ],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'collectAggregateFees',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'pool', type: 'address' },
            {
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
                    { internalType: 'bytes', name: 'userData', type: 'bytes' },
                ],
                internalType: 'struct IBasePool.PoolSwapParams',
                name: 'swapParams',
                type: 'tuple',
            },
        ],
        name: 'computeDynamicSwapFeePercentage',
        outputs: [
            { internalType: 'bool', name: 'success', type: 'bool' },
            {
                internalType: 'uint256',
                name: 'dynamicSwapFee',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'pool', type: 'address' },
            { internalType: 'contract IERC20', name: 'token', type: 'address' },
        ],
        name: 'getAggregateSwapFeeAmount',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'pool', type: 'address' },
            { internalType: 'contract IERC20', name: 'token', type: 'address' },
        ],
        name: 'getAggregateYieldFeeAmount',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getAuthorizer',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'getBptRate',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'contract IERC20', name: 'token', type: 'address' },
        ],
        name: 'getBufferBalance',
        outputs: [
            { internalType: 'uint256', name: '', type: 'uint256' },
            { internalType: 'uint256', name: '', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'contract IERC20', name: 'token', type: 'address' },
            { internalType: 'address', name: 'user', type: 'address' },
        ],
        name: 'getBufferOwnerShares',
        outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getBufferPeriodDuration',
        outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getBufferPeriodEndTime',
        outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'contract IERC20', name: 'token', type: 'address' },
        ],
        name: 'getBufferTotalShares',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'getCurrentLiveBalances',
        outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'getHooksConfig',
        outputs: [
            {
                components: [
                    {
                        internalType: 'bool',
                        name: 'enableHookAdjustedAmounts',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'shouldCallBeforeInitialize',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'shouldCallAfterInitialize',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'shouldCallComputeDynamicSwapFee',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'shouldCallBeforeSwap',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'shouldCallAfterSwap',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'shouldCallBeforeAddLiquidity',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'shouldCallAfterAddLiquidity',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'shouldCallBeforeRemoveLiquidity',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'shouldCallAfterRemoveLiquidity',
                        type: 'bool',
                    },
                    {
                        internalType: 'address',
                        name: 'hooksContract',
                        type: 'address',
                    },
                ],
                internalType: 'struct HooksConfig',
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getMaximumPoolTokens',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getMinimumPoolTokens',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getNonzeroDeltaCount',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getPauseWindowEndTime',
        outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'getPoolConfig',
        outputs: [
            {
                components: [
                    {
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
                        internalType: 'struct LiquidityManagement',
                        name: 'liquidityManagement',
                        type: 'tuple',
                    },
                    {
                        internalType: 'uint256',
                        name: 'staticSwapFeePercentage',
                        type: 'uint256',
                    },
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
                    {
                        internalType: 'uint24',
                        name: 'tokenDecimalDiffs',
                        type: 'uint24',
                    },
                    {
                        internalType: 'uint32',
                        name: 'pauseWindowEndTime',
                        type: 'uint32',
                    },
                    {
                        internalType: 'bool',
                        name: 'isPoolRegistered',
                        type: 'bool',
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
                ],
                internalType: 'struct PoolConfig',
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'getPoolData',
        outputs: [
            {
                components: [
                    {
                        internalType: 'PoolConfigBits',
                        name: 'poolConfigBits',
                        type: 'bytes32',
                    },
                    {
                        internalType: 'contract IERC20[]',
                        name: 'tokens',
                        type: 'address[]',
                    },
                    {
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
                        internalType: 'struct TokenInfo[]',
                        name: 'tokenInfo',
                        type: 'tuple[]',
                    },
                    {
                        internalType: 'uint256[]',
                        name: 'balancesRaw',
                        type: 'uint256[]',
                    },
                    {
                        internalType: 'uint256[]',
                        name: 'balancesLiveScaled18',
                        type: 'uint256[]',
                    },
                    {
                        internalType: 'uint256[]',
                        name: 'tokenRates',
                        type: 'uint256[]',
                    },
                    {
                        internalType: 'uint256[]',
                        name: 'decimalScalingFactors',
                        type: 'uint256[]',
                    },
                ],
                internalType: 'struct PoolData',
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'getPoolPausedState',
        outputs: [
            { internalType: 'bool', name: '', type: 'bool' },
            { internalType: 'uint32', name: '', type: 'uint32' },
            { internalType: 'uint32', name: '', type: 'uint32' },
            { internalType: 'address', name: '', type: 'address' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'getPoolRoleAccounts',
        outputs: [
            {
                components: [
                    {
                        internalType: 'address',
                        name: 'pauseManager',
                        type: 'address',
                    },
                    {
                        internalType: 'address',
                        name: 'swapFeeManager',
                        type: 'address',
                    },
                    {
                        internalType: 'address',
                        name: 'poolCreator',
                        type: 'address',
                    },
                ],
                internalType: 'struct PoolRoleAccounts',
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'pool', type: 'address' },
            { internalType: 'contract IERC20', name: 'token', type: 'address' },
        ],
        name: 'getPoolTokenCountAndIndexOfToken',
        outputs: [
            { internalType: 'uint256', name: '', type: 'uint256' },
            { internalType: 'uint256', name: '', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'getPoolTokenInfo',
        outputs: [
            {
                internalType: 'contract IERC20[]',
                name: 'tokens',
                type: 'address[]',
            },
            {
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
                internalType: 'struct TokenInfo[]',
                name: 'tokenInfo',
                type: 'tuple[]',
            },
            {
                internalType: 'uint256[]',
                name: 'balancesRaw',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256[]',
                name: 'scalingFactors',
                type: 'uint256[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'getPoolTokenRates',
        outputs: [
            { internalType: 'uint256[]', name: '', type: 'uint256[]' },
            { internalType: 'uint256[]', name: '', type: 'uint256[]' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'getPoolTokens',
        outputs: [
            { internalType: 'contract IERC20[]', name: '', type: 'address[]' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getProtocolFeeController',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'contract IERC20', name: 'token', type: 'address' },
        ],
        name: 'getReservesOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'getStaticSwapFeePercentage',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'contract IERC20', name: 'token', type: 'address' },
        ],
        name: 'getTokenDelta',
        outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getVault',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getVaultAdmin',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getVaultExtension',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getVaultPausedState',
        outputs: [
            { internalType: 'bool', name: '', type: 'bool' },
            { internalType: 'uint32', name: '', type: 'uint32' },
            { internalType: 'uint32', name: '', type: 'uint32' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'isPoolInRecoveryMode',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'isPoolInitialized',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'isPoolPaused',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
        name: 'isPoolRegistered',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'isQueryDisabled',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'isUnlocked',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'isVaultPaused',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
        name: 'totalSupply',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;
