import { Multicaller } from '../util/multicaller';
import { BigNumber, providers } from 'ethers';
import { env } from '../../app/env';
import { BALANCER_NETWORK_CONFIG } from '../balancer/src/contracts';
import masterChefAbi from './abi/BeethovenxMasterChef.json';
import timeBasedRewarderAbi from './abi/TimeBasedRewarder.json';
import { getAddress } from '@ethersproject/address';
import { GqlBeetsFarm } from '../../schema';

export class MasterChefContractService {
    private readonly provider = new providers.JsonRpcProvider(env.RPC_URL);

    constructor() {}

    public async getPendingBeetsForFarms(ids: string[], user: string): Promise<{ [id: string]: BigNumber }> {
        const multicaller = new Multicaller(
            BALANCER_NETWORK_CONFIG[`${env.CHAIN_ID}`].multicall,
            this.provider,
            masterChefAbi,
        );

        for (const id of ids) {
            multicaller.call(`${id}`, env.MASTERCHEF_ADDRESS, 'pendingBeets', [id, getAddress(user)]);
        }

        let result = {} as Record<any, any>;
        result = await multicaller.execute(result);

        return result;
    }

    public async getSummedPendingBeetsForFarms(ids: string[], user: string): Promise<BigNumber> {
        const pending = await this.getPendingBeetsForFarms(ids, user);
        let pendingAmount = BigNumber.from(0);

        for (const key of Object.keys(pending)) {
            pendingAmount = pendingAmount.add(pending[key]);
        }

        return pendingAmount;
    }

    public async getPendingBeetsForFarm(id: string, user: string): Promise<number> {
        /*let result = {} as Record<any, any>;

        if (!isAddress(user)) {
            return 0;
        }

        const masterChefMultiCaller = new Multicaller(
            this.configService.network.key,
            this.service.provider,
            MasterChefAbi,
        );

        masterChefMultiCaller.call('pendingBeets', this.address, 'pendingBeets', [id, getAddress(user)]);
        result = await masterChefMultiCaller.execute(result);

        const pendingBeets = result.pendingBeets?.toString();

        return pendingBeets ? scale(new BigNumber(pendingBeets), -18).toNumber() : 0;*/

        return 0;
    }

    public async getPendingRewards(
        farms: GqlBeetsFarm[],
        userAddress: string,
    ): Promise<{ [farmId: string]: { [token: string]: BigNumber } }> {
        const rewarderMulticaller = new Multicaller(
            BALANCER_NETWORK_CONFIG[`${env.CHAIN_ID}`].multicall,
            this.provider,
            timeBasedRewarderAbi,
        );

        for (const farm of farms) {
            if (farm.rewarder) {
                rewarderMulticaller.call(`${farm.id}.${farm.rewarder.rewardToken}`, farm.rewarder.id, 'pendingToken', [
                    farm.id,
                    getAddress(userAddress),
                ]);
            }
        }

        let result = {} as Record<any, any>;
        result = await rewarderMulticaller.execute(result);

        return result;
    }

    public async getSummedPendingRewards(
        farms: GqlBeetsFarm[],
        userAddress: string,
    ): Promise<{ [token: string]: BigNumber }> {
        const result = await this.getPendingRewards(farms, userAddress);
        const summed: { [token: string]: BigNumber } = {};

        for (const farmId in result) {
            for (const token in result[farmId]) {
                if (!summed[token]) {
                    summed[token] = BigNumber.from(0);
                }

                summed[token] = summed[token].add(result[farmId][token]);
            }
        }

        return summed;
    }
}

export const masterChefContractService = new MasterChefContractService();
