import moment from 'moment-timezone';
import { graphql } from 'msw';
import {
    UserBalanceSnapshotsQuery,
    UserBalanceSnapshotsQueryVariables,
} from '../../subgraphs/user-snapshot-subgraph/generated/user-snapshot-subgraph-types';

let createSnapshots: () => UserBalanceSnapshotsQuery;

export const configuredSubgraphHandlers = [
    graphql.query('UserBalanceSnapshots', async (req, res, ctx) => {
        const requestJson = await req.json();
        // adjust for refetching
        if (requestJson.variables.where.timestamp_gte > moment().subtract(1, 'hours').unix()) {
            return res(
                ctx.data({
                    snapshots: [],
                }),
            );
        }
        return res(ctx.data(createSnapshots()));
    }),
];

export const subgraphHandlers = [
    graphql.query('UserBalanceSnapshots', async (req, res, ctx) => {
        const requestJson = await req.json();
        if (requestJson.variables.where.timestamp_gte > 1650153600) {
            return res(
                ctx.data({
                    snapshots: [],
                }),
            );
        }
        return res(
            ctx.data({
                snapshots: [
                    {
                        user: {
                            id: '0x0000000000000000000000000000000000000001',
                        },
                        timestamp: 1643414400,
                        walletTokens: ['0x2d94326a26a9c32db698dd5888b2645cc006b6d1'],
                        walletBalances: ['0.000000078722312938'],
                        gauges: [],
                        gaugeBalances: [],
                        farms: [],
                        farmBalances: [],
                    },
                    {
                        user: {
                            id: '0x0000000000000000000000000000000000000001',
                        },
                        timestamp: 1650153600,
                        walletTokens: [
                            '0x2d94326a26a9c32db698dd5888b2645cc006b6d1',
                            '0xeadcfa1f34308b144e96fcd7a07145e027a8467d',
                        ],
                        walletBalances: ['0.000000078722312938', '0.0000000000000009'],
                        gauges: [],
                        gaugeBalances: [],
                        farms: [],
                        farmBalances: [],
                    },
                ],
            }),
        );
    }),
];

function setCreateFunction(createFunction: () => UserBalanceSnapshotsQuery) {
    createSnapshots = createFunction;
}

// function createSnapshots(): UserBalanceSnapshotsQuery {
//     return {
//         snapshots: [
//             {
//                 id: 'snapshot id',
//                 user: {
//                     id: '0x0000000000000000000000000000000000000001',
//                 },
//                 timestamp: 1643414400,
//                 walletTokens: ['0x2d94326a26a9c32db698dd5888b2645cc006b6d1'],
//                 walletBalances: ['0.000000078722312938'],
//                 gauges: [],
//                 gaugeBalances: [],
//                 farms: [],
//                 farmBalances: [],
//             },
//             {
//                 id: 'snapshot id2',
//                 user: {
//                     id: '0x0000000000000000000000000000000000000001',
//                 },
//                 timestamp: 1650153600,
//                 walletTokens: [
//                     '0x2d94326a26a9c32db698dd5888b2645cc006b6d1',
//                     '0xeadcfa1f34308b144e96fcd7a07145e027a8467d',
//                 ],
//                 walletBalances: ['0.000000078722312938', '0.0000000000000009'],
//                 gauges: [],
//                 gaugeBalances: [],
//                 farms: [],
//                 farmBalances: [],
//             },
//         ],
//     };

//     throw new Error('Function not implemented.');
// }
