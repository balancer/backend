export default [
    {
        inputs: [],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'previousAdmin',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'newAdmin',
                type: 'address',
            },
        ],
        name: 'AdminChanged',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'beacon',
                type: 'address',
            },
        ],
        name: 'BeaconUpgraded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint8',
                name: 'version',
                type: 'uint8',
            },
        ],
        name: 'Initialized',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'low',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'high',
                type: 'uint256',
            },
        ],
        name: 'LogDepositLimitUpdated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'user',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'ftmxAmount',
                type: 'uint256',
            },
        ],
        name: 'LogDeposited',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'duration',
                type: 'uint256',
            },
        ],
        name: 'LogEpochDurationSet',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'vault',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'lockupDuration',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'LogLocked',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'bool',
                name: 'newValue',
                type: 'bool',
            },
        ],
        name: 'LogMaintenancePausedUpdated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'bool',
                name: 'newValue',
                type: 'bool',
            },
        ],
        name: 'LogUndelegatePausedUpdated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'user',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'wrID',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'amountFTMx',
                type: 'uint256',
            },
        ],
        name: 'LogUndelegated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'validatorPicker',
                type: 'address',
            },
        ],
        name: 'LogValidatorPickerSet',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'vault',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'maturedIndex',
                type: 'uint256',
            },
        ],
        name: 'LogVaultHarvested',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'vault',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'LogVaultOwnerUpdated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'vault',
                type: 'address',
            },
        ],
        name: 'LogVaultWithdrawn',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'bool',
                name: 'newValue',
                type: 'bool',
            },
        ],
        name: 'LogWithdrawPausedUpdated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'delay',
                type: 'uint256',
            },
        ],
        name: 'LogWithdrawalDelaySet',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'user',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'wrID',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'totalAmount',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'bitmaskToSkip',
                type: 'uint256',
            },
        ],
        name: 'LogWithdrawn',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'previousOwner',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'implementation',
                type: 'address',
            },
        ],
        name: 'Upgraded',
        type: 'event',
    },
    {
        inputs: [],
        name: 'DECIMAL_UNIT',
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
        name: 'FTMX',
        outputs: [
            {
                internalType: 'contract IERC20Burnable',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MAX_LOCKUP_DURATION',
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
        name: 'SFC',
        outputs: [
            {
                internalType: 'contract ISFC',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'UNLOCKED_REWARD_RATIO',
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
        name: 'allWithdrawalRequests',
        outputs: [
            {
                internalType: 'uint256',
                name: 'requestTime',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'poolAmount',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'undelegateAmount',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'penalty',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: 'user',
                type: 'address',
            },
            {
                internalType: 'bool',
                name: 'isWithdrawn',
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
                name: 'amountFTMx',
                type: 'uint256',
            },
        ],
        name: 'calculatePenalty',
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
        inputs: [],
        name: 'claimRewardsAll',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'currentVaultCount',
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
        name: 'currentVaultPtr',
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
        name: 'deposit',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'epochDuration',
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
        name: 'ftmPendingWithdrawal',
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
        name: 'getExchangeRate',
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
                name: 'ftmAmount',
                type: 'uint256',
            },
            {
                internalType: 'bool',
                name: 'toIgnore',
                type: 'bool',
            },
        ],
        name: 'getFTMxAmountForFTM',
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
                name: 'vaultIndex',
                type: 'uint256',
            },
        ],
        name: 'getMaturedVault',
        outputs: [
            {
                internalType: 'address payable',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getMaturedVaultLength',
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
        name: 'getPoolBalance',
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
                name: 'vaultIndex',
                type: 'uint256',
            },
        ],
        name: 'getVault',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'wrID',
                type: 'uint256',
            },
        ],
        name: 'getWithdrawalInfo',
        outputs: [
            {
                components: [
                    {
                        internalType: 'address payable',
                        name: 'vault',
                        type: 'address',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amountToUnlock',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amountToUndelegate',
                        type: 'uint256',
                    },
                ],
                internalType: 'struct FTMStaking.UndelegateInfo[]',
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'vaultIndex',
                type: 'uint256',
            },
        ],
        name: 'harvestVault',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract IERC20Burnable',
                name: '_ftmx_',
                type: 'address',
            },
            {
                internalType: 'contract ISFC',
                name: '_sfc_',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'maxVaultCount_',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'epochDuration_',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'withdrawalDelay_',
                type: 'uint256',
            },
        ],
        name: 'initialize',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'lastKnownEpoch',
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
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'lock',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'maintenancePaused',
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
        inputs: [],
        name: 'maxDeposit',
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
        name: 'maxVaultCount',
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
        name: 'minDeposit',
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
        name: 'nextEligibleTimestamp',
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
        name: 'owner',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'pickVaultsToUndelegate',
        outputs: [
            {
                components: [
                    {
                        internalType: 'address payable',
                        name: 'vault',
                        type: 'address',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amountToUnlock',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amountToUndelegate',
                        type: 'uint256',
                    },
                ],
                internalType: 'struct FTMStaking.UndelegateInfo[]',
                name: '',
                type: 'tuple[]',
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
        inputs: [],
        name: 'protocolFeeBIPS',
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
        name: 'proxiableUUID',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'renounceOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'low',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'high',
                type: 'uint256',
            },
        ],
        name: 'setDepositLimits',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'duration',
                type: 'uint256',
            },
        ],
        name: 'setEpochDuration',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bool',
                name: 'desiredValue',
                type: 'bool',
            },
        ],
        name: 'setMaintenancePaused',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'newFeeBIPS',
                type: 'uint256',
            },
        ],
        name: 'setProtocolFeeBIPS',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'newTreasury',
                type: 'address',
            },
        ],
        name: 'setTreasury',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bool',
                name: 'desiredValue',
                type: 'bool',
            },
        ],
        name: 'setUndelegatePaused',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract IValidatorPicker',
                name: 'picker',
                type: 'address',
            },
        ],
        name: 'setValidatorPicker',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bool',
                name: 'desiredValue',
                type: 'bool',
            },
        ],
        name: 'setWithdrawPaused',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'delay',
                type: 'uint256',
            },
        ],
        name: 'setWithdrawalDelay',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalFTMWorth',
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
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'treasury',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'wrID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'amountFTMx',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'minAmountFTM',
                type: 'uint256',
            },
        ],
        name: 'undelegate',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'undelegatePaused',
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
                internalType: 'address payable',
                name: 'vault',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'updateVaultOwner',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'newImplementation',
                type: 'address',
            },
        ],
        name: 'upgradeTo',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'newImplementation',
                type: 'address',
            },
            {
                internalType: 'bytes',
                name: 'data',
                type: 'bytes',
            },
        ],
        name: 'upgradeToAndCall',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'validatorPicker',
        outputs: [
            {
                internalType: 'contract IValidatorPicker',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'wrID',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'bitmaskToSkip',
                type: 'uint256',
            },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'maturedIndex',
                type: 'uint256',
            },
        ],
        name: 'withdrawMatured',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'withdrawPaused',
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
        inputs: [],
        name: 'withdrawalDelay',
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
        stateMutability: 'payable',
        type: 'receive',
    },
] as const;
