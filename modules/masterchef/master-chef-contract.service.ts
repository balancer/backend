import { Multicaller } from '../util/multicaller';
import { BigNumber, providers } from 'ethers';
import { env } from '../../app/env';
import { BALANCER_NETWORK_CONFIG } from '../balancer/src/contracts';
import masterChefAbi from './abi/BeethovenxMasterChef.json';
import timeBasedRewarderAbi from './abi/TimeBasedRewarder.json';
import { mapValues } from 'lodash';
import { getAddress } from '@ethersproject/address';
import { parseUnits } from 'ethers/lib/utils';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { GqlBeetsFarm } from '../../schema';

export class MasterChefContractService {
    private readonly multicaller: Multicaller;
    private readonly rewarderMulticaller: Multicaller;

    constructor() {
        const provider = new providers.JsonRpcProvider(env.RPC_URL);
        this.multicaller = new Multicaller(
            BALANCER_NETWORK_CONFIG[`${env.CHAIN_ID}`].multicall,
            provider,
            masterChefAbi,
        );

        this.rewarderMulticaller = new Multicaller(
            BALANCER_NETWORK_CONFIG[`${env.CHAIN_ID}`].multicall,
            provider,
            timeBasedRewarderAbi,
        );
    }

    public async getPendingBeetsForFarms(ids: string[], user: string): Promise<{ [id: string]: BigNumber }> {
        for (const id of ids) {
            this.multicaller.call(`${id}`, env.MASTERCHEF_ADDRESS, 'pendingBeets', [id, getAddress(user)]);
        }

        let result = {} as Record<any, any>;
        result = await this.multicaller.execute(result);

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
        for (const farm of farms) {
            if (farm.rewarder) {
                this.rewarderMulticaller.call(
                    `${farm.id}.${farm.rewarder.rewardToken}`,
                    farm.rewarder.id,
                    'pendingToken',
                    [farm.id, getAddress(userAddress)],
                );
            }
        }

        let result = {} as Record<any, any>;
        result = await this.rewarderMulticaller.execute(result);

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
