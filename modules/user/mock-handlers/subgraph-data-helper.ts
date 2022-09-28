import { GraphQLRequest } from "apollo-server-core";
import { graphql, GraphQLHandler, GraphQLVariables } from "msw";
import { UserBalanceSnapshotsQuery } from "../../subgraphs/user-snapshot-subgraph/generated/user-snapshot-subgraph-types";
import { DeepPartial } from "../../tests-helper/jest-test-helpers";


export function createUserBalanceSnapshotsHandler(snapshots: DeepPartial<UserBalanceSnapshotsQuery): GraphQLHandler<GraphQLRequest<GraphQLVariables>>[]{
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
}