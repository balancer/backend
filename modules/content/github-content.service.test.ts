import { initRequestScopedContext, setRequestScopedContextValue } from '../../modules/context/request-scoped-context';
import { networkContext } from '../../modules/network/network-context.service';
import { poolService } from '../../modules/pool/pool.service';
import { prisma } from '../../prisma/prisma-client';
import { ZERO_ADDRESS } from '@balancer/sdk';
import { tokenService } from '../token/token.service';
import { PoolsDocument } from '../subgraphs/gauge-subgraph/generated/gauge-subgraph-types';

// jest.mock('axios', () => ({
//     get: jest.fn().mockResolvedValue({
//         data: {
//                 mainnet: {
//                     '0xda3e8cd08753a05ed4103af28c69c47e35d6d8da': {
//                         name: 'mainnet1',
//                         asset: '0x862c57d48becb45583aeba3f489696d22466ca1b',
//                         summary: 'safe',
//                         review: './asd.md',
//                         warnings: [],
//                         upgradeableComponents: [],
//                     },
//                     '0xda3e8cd08753a05ed4103af28c69c47e35d6d8db': {
//                         name: 'mainnet1dup',
//                         asset: '0x862c57d48becb45583aeba3f489696d22466ca1b',
//                         summary: 'safe',
//                         review: './asd.md',
//                         warnings: [],
//                         upgradeableComponents: [],
//                     },
//                     '0x47b584e4c7c4a030060450ec9e51d52d919b1fcb': {
//                         name: 'mainnet2',
//                         asset: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
//                         summary: 'safe',
//                         review: './asd.md',
//                         warnings: [],
//                         upgradeableComponents: [],
//                     },
//                 },
//                 base: {
//                     '0x3786a6caab433f5dfe56503207df31df87c5b5c1': {
//                         name: 'base rateprovider',
//                         asset: '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22',
//                         summary: 'safe',
//                         review: './asd.md',
//                         warnings: [],
//                         upgradeableComponents: [],
//                     },
//                 },
//             },
//         },
//     }),
// }));
