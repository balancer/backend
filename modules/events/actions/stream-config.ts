import { toEventHash, parseAbiItem } from 'viem';
// import { vaultV2Abi, vaultV3Abi } from '@config/abis';
import vaultV2Abi from '../../sources/contracts/abis/VaultV2';
import vaultV3Abi from '../../sources/contracts/abis/VaultV3';
import cfg from '../../../config';
import { Chain } from '@prisma/client';

// Extract all relevant event signatures from ABIs
const v2SwapAbiItem = vaultV2Abi.find((item) => item.type === 'event' && item.name === 'Swap')!;
const v2FeeAbiItem = parseAbiItem('event SwapFeePercentageChanged(uint256 swapFeePercentage)');
const v2LiquidityAbiItem = vaultV2Abi.find((item) => item.type === 'event' && item.name === 'PoolBalanceChanged')!;
const v3SwapAbiItem = vaultV3Abi.find((item) => item.type === 'event' && item.name === 'Swap')!;
const v3AddLiquidityAbiItem = vaultV3Abi.find((item) => item.type === 'event' && item.name === 'LiquidityAdded')!;
const v3RemoveLiquidityAbiItem = vaultV3Abi.find((item) => item.type === 'event' && item.name === 'LiquidityRemoved')!;

// Vault event topics
export const V2_SWAP_TOPIC = toEventHash(v2SwapAbiItem);
export const V2_SWAP_FEE_PERCENTAGE_CHANGED_TOPIC = toEventHash(v2FeeAbiItem);
export const V2_LIQUIDITY_TOPIC = toEventHash(v2LiquidityAbiItem);
export const V3_SWAP_TOPIC = toEventHash(v3SwapAbiItem);
export const V3_ADD_LIQUIDITY_TOPIC = toEventHash(v3AddLiquidityAbiItem);
export const V3_REMOVE_LIQUIDITY_TOPIC = toEventHash(v3RemoveLiquidityAbiItem);

// Export ABIs for parsing
export const abiMap = {
    [V2_SWAP_TOPIC]: v2SwapAbiItem,
    [V2_SWAP_FEE_PERCENTAGE_CHANGED_TOPIC]: v2FeeAbiItem,
    [V2_LIQUIDITY_TOPIC]: v2LiquidityAbiItem,
    [V3_SWAP_TOPIC]: v3SwapAbiItem,
    [V3_ADD_LIQUIDITY_TOPIC]: v3AddLiquidityAbiItem,
    [V3_REMOVE_LIQUIDITY_TOPIC]: v3RemoveLiquidityAbiItem,
} as const;

// Default Balancer stream configuration
export const eventStreamConfig = (chain: Chain) => [
    // Domain: Vault events (swaps, liquidity changes)
    {
        address: [cfg[chain].balancer.v2.vaultAddress, cfg[chain].balancer.v3.vaultAddress],
        topics: [[V2_SWAP_TOPIC, V3_SWAP_TOPIC, V2_LIQUIDITY_TOPIC, V3_ADD_LIQUIDITY_TOPIC, V3_REMOVE_LIQUIDITY_TOPIC]],
    },
    // Domain: Pool-emitted swap fee changes (v2 pools emit these directly)
    {
        topics: [[V2_SWAP_FEE_PERCENTAGE_CHANGED_TOPIC]],
    },
];

// Infer stream configuration type from implementation
export type StreamConfig = ReturnType<typeof eventStreamConfig>;
