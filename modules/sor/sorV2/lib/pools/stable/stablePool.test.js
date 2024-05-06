"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prismaToken_factory_1 = require("../../../../../../test/factories/prismaToken.factory");
var prismaPool_factory_1 = require("../../../../../../test/factories/prismaPool.factory");
var sdk_1 = require("@balancer/sdk");
var viem_1 = require("viem");
var stablePool_1 = require("./stablePool");
describe('SOR V3 Stable Pool Tests', function () {
    var token1Balance = '100';
    var token1 = prismaToken_factory_1.prismaPoolTokenFactory.build({
        index: 0,
        dynamicData: prismaToken_factory_1.prismaPoolTokenDynamicDataFactory.build({ balance: token1Balance, priceRate: '2' }),
    });
    var token2Balance = '100';
    var token2 = prismaToken_factory_1.prismaPoolTokenFactory.build({
        index: 1,
        dynamicData: prismaToken_factory_1.prismaPoolTokenDynamicDataFactory.build({ balance: token2Balance, priceRate: '4' }),
    });
    var prismaStablePool = prismaPool_factory_1.prismaPoolFactory.build({
        type: 'STABLE',
        vaultVersion: 3,
        tokens: [token1, token2],
        typeData: { amp: '1' },
        dynamicData: prismaPool_factory_1.prismaPoolDynamicDataFactory.build({ totalShares: '100' }),
    });
    var stablePool = stablePool_1.StablePool.fromPrismaPool(prismaStablePool);
    var bpt = new sdk_1.Token(11155111, stablePool.address, 18);
    test('Swap Limits with Given In', function () {
        var limitAmountIn = stablePool.getLimitAmountSwap(stablePool.tokens[0].token, stablePool.tokens[1].token, sdk_1.SwapKind.GivenIn);
        expect(limitAmountIn).toBe((0, viem_1.parseEther)('200'));
    });
    test('Swap Limits with Given Out', function () {
        var limitAmountIn = stablePool.getLimitAmountSwap(stablePool.tokens[0].token, stablePool.tokens[1].token, sdk_1.SwapKind.GivenOut);
        expect(limitAmountIn).toBe((0, viem_1.parseEther)('400'));
    });
    test('Remove Liquidity Limits with Exact In', function () {
        //TODO
    });
    test('Remove Liquidity Limits with Exact Out', function () {
        var limitAmountIn = stablePool.getLimitAmountRemoveLiquidity(bpt, stablePool.tokens[1].token, sdk_1.RemoveLiquidityKind.SingleTokenExactOut);
        expect(limitAmountIn).toBe((0, viem_1.parseEther)('400'));
    });
});
