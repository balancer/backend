export default [
    {
        inputs: [
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
        name: '_isLockedUp',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: '_isSlashed',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
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
        name: '_pendingRewards',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: '_slashingRefundRatio',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
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
        name: '_stashedRewardsUntilEpoch',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
        ],
        name: 'claimRewards',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'currentEpoch',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'currentSealedEpoch',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
        ],
        name: 'delegate',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: 'epochAccumulatedRewardPerToken',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'epoch',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'validatorID',
                type: 'uint256',
            },
        ],
        name: 'getEpochAccumulatedRewardPerToken',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: 'getEpochSnapshot',
        outputs: [
            {
                internalType: 'uint256',
                name: 'endTime',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'epochFee',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'totalBaseRewardWeight',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'totalTxRewardWeight',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'baseRewardPerSecond',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'totalStake',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'totalSupply',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'delegator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
        ],
        name: 'getLockedStake',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
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
        name: 'getLockupInfo',
        outputs: [
            {
                internalType: 'uint256',
                name: 'lockedStake',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'fromEpoch',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'endTime',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'duration',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
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
        name: 'getStake',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
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
        name: 'getStashedLockupRewards',
        outputs: [
            {
                internalType: 'uint256',
                name: 'lockupExtraReward',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'lockupBaseReward',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'unlockedReward',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: 'getValidator',
        outputs: [
            {
                internalType: 'uint256',
                name: 'status',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'deactivatedTime',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'deactivatedEpoch',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'receivedStake',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'createdEpoch',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'createdTime',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: 'auth',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
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
            {
                internalType: 'uint256',
                name: 'wrID',
                type: 'uint256',
            },
        ],
        name: 'getWithdrawalRequest',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'delegator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
        ],
        name: 'isLockedUp',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
        ],
        name: 'isSlashed',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'lockStake',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'delegator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
        ],
        name: 'pendingRewards',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'relockStake',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
        ],
        name: 'restakeRewards',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '__currentEpoch',
                type: 'uint256',
            },
        ],
        name: 'setCurrentEpoch',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '__currentSealedEpoch',
                type: 'uint256',
            },
        ],
        name: 'setCurrentSealedEpoch',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'epoch',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'validatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'reward',
                type: 'uint256',
            },
        ],
        name: 'setEpochAccumulatedRewardPerToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'epoch',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'endTime',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'epochFee',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'totalBaseRewardWeight',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'totalTxRewardWeight',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'baseRewardPerSecond',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'totalStake',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'totalSupply',
                type: 'uint256',
            },
        ],
        name: 'setEpochSnapshot',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'delegator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'bool',
                name: '__isLockedUp',
                type: 'bool',
            },
        ],
        name: 'setIsLockedUp',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'bool',
                name: '__isSlashed',
                type: 'bool',
            },
        ],
        name: 'setIsSlashed',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'delegator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'lockedStake',
                type: 'uint256',
            },
        ],
        name: 'setLockedStake',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'delegator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'lockedStake',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'fromEpoch',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'endTime',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'duration',
                type: 'uint256',
            },
        ],
        name: 'setLockupInfo',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'delegator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'rewards',
                type: 'uint256',
            },
        ],
        name: 'setPendingRewards',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'ratio',
                type: 'uint256',
            },
        ],
        name: 'setSlashingRefundRatio',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'delegator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'stake',
                type: 'uint256',
            },
        ],
        name: 'setStake',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'delegator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'lockupExtraReward',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'lockupBaseReward',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'unlockedReward',
                type: 'uint256',
            },
        ],
        name: 'setStashedLockupRewards',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'delegator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'stashedRewards',
                type: 'uint256',
            },
        ],
        name: 'setStashedRewardsUntilEpoch',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'status',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'deactivatedTime',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'deactivatedEpoch',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'receivedStake',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'createdEpoch',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'createdTime',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: 'auth',
                type: 'address',
            },
        ],
        name: 'setValidator',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
        ],
        name: 'slashingRefundRatio',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'delegator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
        ],
        name: 'stashedRewardsUntilEpoch',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'wrID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'undelegate',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'unlockStake',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'toValidatorID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'wrID',
                type: 'uint256',
            },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;
