import { AprHandler } from '..';
import { SftmxAprConfig } from '../../../../../network/apr-config-types';
import { BigNumber } from 'ethers';
import { getContractAt } from '../../../../../web3/contract';
import { formatFixed } from '@ethersproject/bignumber';
import FTMStaking from '../../../../../sources/contracts/abis/FTMStaking';
import SftmxVault from '../../../../../sources/contracts/abis/SftmxVault';

export class SftmxAprHandler implements AprHandler {
    tokens: {
        [underlyingAssetName: string]: {
            address: string;
            ftmStakingAddress: string;
        };
    };

    constructor(config: SftmxAprConfig) {
        this.tokens = config.tokens;
    }

    async getAprs(): Promise<{
        [tokenAddress: string]: {
            /** Defined as float, eg: 0.01 is 1% */
            apr: number;
            isIbYield: boolean;
            group?: string;
        };
    }> {
        const baseApr = 0.018;
        const maxLockApr = 0.06;
        const validatorFee = 0.15;
        const sftmxFee = 0.1;
        try {
            const aprs: {
                [tokenAddress: string]: {
                    apr: number;
                    isIbYield: boolean;
                    group?: string;
                };
            } = {};

            for (const tokenAddress in this.tokens) {
                const tokenDefinition = this.tokens[tokenAddress];
                const ftmStakingContract = getContractAt(tokenDefinition.ftmStakingAddress, FTMStaking);

                const totalFtm = (await ftmStakingContract.totalFTMWorth()) as BigNumber;
                const poolFtm = (await ftmStakingContract.getPoolBalance()) as BigNumber;
                const maturedVaultCount = await ftmStakingContract.getMaturedVaultLength();

                let maturedFtmAmount = BigNumber.from('0');

                for (let i = 0; i < maturedVaultCount; i++) {
                    const vaultAddress = await ftmStakingContract.getMaturedVault(i);
                    const vaultContract = getContractAt(vaultAddress, SftmxVault);
                    const vaultAmount = await vaultContract.currentStakeValue();
                    maturedFtmAmount = maturedFtmAmount.add(vaultAmount);
                }

                const totalFtmNum = parseFloat(formatFixed(totalFtm.toString(), 18));
                const poolFtmNum = parseFloat(formatFixed(poolFtm.toString(), 18));
                const maturedFtmNum = parseFloat(formatFixed(maturedFtmAmount.toString(), 18));
                const stakedFtmNum = totalFtmNum - poolFtmNum - maturedFtmNum;

                const totalMaxLockApr =
                    (stakedFtmNum / totalFtmNum) * (maxLockApr * (1 - validatorFee)) * (1 - sftmxFee);
                const totalBaseApr = (maturedFtmNum / totalFtmNum) * (baseApr * (1 - validatorFee)) * (1 - sftmxFee);

                const totalSftmxApr = totalMaxLockApr + totalBaseApr;

                aprs[tokenDefinition.address] = {
                    apr: totalSftmxApr,
                    isIbYield: true,
                };
            }
            return aprs;
        } catch (error) {
            console.error('Failed to fetch sftmx APR:', error);
            return {};
        }
    }
}
