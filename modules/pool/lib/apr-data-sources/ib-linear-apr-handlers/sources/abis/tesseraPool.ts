export const abi = [
  {
    inputs: [],
    name: 'getPoolsUI',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'poolId', type: 'uint256' },
          { internalType: 'uint256', name: 'stakedAmount', type: 'uint256' },
          {
            components: [
              {
                internalType: 'uint48',
                name: 'startTimestampHour',
                type: 'uint48',
              },
              {
                internalType: 'uint48',
                name: 'endTimestampHour',
                type: 'uint48',
              },
              {
                internalType: 'uint96',
                name: 'rewardsPerHour',
                type: 'uint96',
              },
              {
                internalType: 'uint96',
                name: 'capPerPosition',
                type: 'uint96',
              },
            ],
            internalType: 'struct ApeCoinStaking.TimeRange',
            name: 'currentTimeRange',
            type: 'tuple',
          },
        ],
        internalType: 'struct ApeCoinStaking.PoolUI',
        name: '',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'uint256', name: 'poolId', type: 'uint256' },
          { internalType: 'uint256', name: 'stakedAmount', type: 'uint256' },
          {
            components: [
              {
                internalType: 'uint48',
                name: 'startTimestampHour',
                type: 'uint48',
              },
              {
                internalType: 'uint48',
                name: 'endTimestampHour',
                type: 'uint48',
              },
              {
                internalType: 'uint96',
                name: 'rewardsPerHour',
                type: 'uint96',
              },
              {
                internalType: 'uint96',
                name: 'capPerPosition',
                type: 'uint96',
              },
            ],
            internalType: 'struct ApeCoinStaking.TimeRange',
            name: 'currentTimeRange',
            type: 'tuple',
          },
        ],
        internalType: 'struct ApeCoinStaking.PoolUI',
        name: '',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'uint256', name: 'poolId', type: 'uint256' },
          { internalType: 'uint256', name: 'stakedAmount', type: 'uint256' },
          {
            components: [
              {
                internalType: 'uint48',
                name: 'startTimestampHour',
                type: 'uint48',
              },
              {
                internalType: 'uint48',
                name: 'endTimestampHour',
                type: 'uint48',
              },
              {
                internalType: 'uint96',
                name: 'rewardsPerHour',
                type: 'uint96',
              },
              {
                internalType: 'uint96',
                name: 'capPerPosition',
                type: 'uint96',
              },
            ],
            internalType: 'struct ApeCoinStaking.TimeRange',
            name: 'currentTimeRange',
            type: 'tuple',
          },
        ],
        internalType: 'struct ApeCoinStaking.PoolUI',
        name: '',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'uint256', name: 'poolId', type: 'uint256' },
          { internalType: 'uint256', name: 'stakedAmount', type: 'uint256' },
          {
            components: [
              {
                internalType: 'uint48',
                name: 'startTimestampHour',
                type: 'uint48',
              },
              {
                internalType: 'uint48',
                name: 'endTimestampHour',
                type: 'uint48',
              },
              {
                internalType: 'uint96',
                name: 'rewardsPerHour',
                type: 'uint96',
              },
              {
                internalType: 'uint96',
                name: 'capPerPosition',
                type: 'uint96',
              },
            ],
            internalType: 'struct ApeCoinStaking.TimeRange',
            name: 'currentTimeRange',
            type: 'tuple',
          },
        ],
        internalType: 'struct ApeCoinStaking.PoolUI',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
