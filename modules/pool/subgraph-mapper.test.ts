import { subgraphToPrisma } from './subgraph-mapper';
import { poolFactory, poolTokenFactory } from '../../test/factories';

describe('subgraphToPrisma', () => {
    const weightedPool = poolFactory.build({
        poolType: 'Weighted',
    });

    const stablePool = poolFactory.build({
        poolType: 'ComposableStable',
        amp: '0.1',
    });

    const linearPool = poolFactory.build({
        poolType: 'Linear',
        wrappedIndex: 1,
        upperTarget: '1',
    });

    const elementPool = poolFactory.build({
        poolType: 'Element',
        principalToken: '0x123',
    });

    const gyroPool = poolFactory.build({
        poolType: 'GyroE',
        alpha: '0.5',
        tauAlphaX: '0.5',
    });

    const fxPool = poolFactory.build({
        poolType: 'FX',
        alpha: '0.5',
    });

    it('should return correct object for weighted pool', () => {
        const result = subgraphToPrisma(weightedPool, 'MAINNET', 1, []);
        expect(result.data.type).toBe('WEIGHTED');
    });

    it('should return correct object for stable pool', () => {
        const result = subgraphToPrisma(stablePool, 'MAINNET', 1, []);
        expect(result.data.type).toBe('COMPOSABLE_STABLE');
        expect(result.data.stableDynamicData?.create.amp).toBe(stablePool.amp);
    });

    it('should return correct object for linear pool', () => {
        const result = subgraphToPrisma(linearPool, 'MAINNET', 1, []);
        expect(result.data.type).toBe('LINEAR');
        expect(result.data.linearDynamicData?.create.upperTarget).toBe(linearPool.upperTarget);
        expect(result.data.linearData?.create.wrappedIndex).toBe(linearPool.wrappedIndex);
    });

    it('should return correct object for element pool', () => {
        const result = subgraphToPrisma(elementPool, 'MAINNET', 1, []);
        expect(result.data.type).toBe('ELEMENT');
        expect(result.data.elementData?.create.principalToken).toBe(elementPool.principalToken);
    });

    it('should return correct object for gyro pool', () => {
        const result = subgraphToPrisma(gyroPool, 'MAINNET', 1, []);
        expect(result.data.type).toBe('GYROE');
        expect(result.data.gyroData?.create.alpha).toBe(gyroPool.alpha);
        expect(result.data.gyroData?.create.tauAlphaX).toBe(gyroPool.tauAlphaX);
    });

    it('should return correct object for fx pool', () => {
        const result = subgraphToPrisma(fxPool, 'MAINNET', 1, []);
        expect(result.data.type).toBe('FX');
        expect(result.data.data['alpha']).toBe(gyroPool.alpha);
    });

    describe('nested pools', () => {
        const nestedPools = [linearPool];
        const poolWithNestedPools = poolFactory.build({
            poolType: 'ComposableStable',
            tokens: [
                poolTokenFactory.build({
                    address: linearPool.address,
                }),
                poolTokenFactory.build({}),
            ],
        });

        it('should recognise nested pools', () => {
            const result = subgraphToPrisma(poolWithNestedPools, 'MAINNET', 1, nestedPools);
            expect(result.data.type).toBe('COMPOSABLE_STABLE');
            expect(result.data.tokens.createMany.data[0].nestedPoolId).toBe(linearPool.id);
        });
    });
});
