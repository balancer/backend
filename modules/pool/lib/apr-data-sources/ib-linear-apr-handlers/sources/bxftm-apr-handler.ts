import * as Sentry from '@sentry/node';
import { AprHandler } from '../ib-linear-apr-handlers';
import { BxFtmAprConfig } from '../../../../../network/apr-config-types';
import { BigNumber, ethers } from 'ethers';
import { getContractAt } from '../../../../../web3/contract';
import FTMStaking from '../../../../../bxftm/abi/FTMStaking.json';
import Vault from '../../../../../bxftm/abi/Vault.json';
import { formatFixed } from '@ethersproject/bignumber';

export class BxFtmAprHandler implements AprHandler {
    tokens: {
        [underlyingAssetName: string]: {
            address: string;
            ftmStakingAddress: string;
        };
    };

    constructor(config: BxFtmAprConfig) {
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
        const bxFtmFee = 0.1;
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
                const ftmStakingContract = getContractAt(tokenDefinition.ftmStakingAddress, FTMStaking.abi);

                const totalFtm = (await ftmStakingContract.totalFTMWorth()) as BigNumber;
                const poolFtm = (await ftmStakingContract.getPoolBalance()) as BigNumber;
                const maturedVaultCount = await ftmStakingContract.getMaturedVaultLength();

                let maturedFtmAmount = BigNumber.from('0');

                for (let i = 0; i < maturedVaultCount; i++) {
                    const vaultAddress = await ftmStakingContract.getMaturedVault(i);
                    const vaultContract = getContractAt(vaultAddress, Vault.abi);
                    const vaultAmount = await vaultContract.currentStakeValue();
                    maturedFtmAmount = maturedFtmAmount.add(vaultAmount);
                }

                const totalFtmNum = parseFloat(formatFixed(totalFtm.toString(), 18));
                const poolFtmNum = parseFloat(formatFixed(poolFtm.toString(), 18));
                const maturedFtmNum = parseFloat(formatFixed(maturedFtmAmount.toString(), 18));
                const stakedFtmNum = totalFtmNum - poolFtmNum - maturedFtmNum;

                const totalMaxLockApr =
                    (stakedFtmNum / totalFtmNum) * (maxLockApr * (1 - validatorFee)) * (1 - bxFtmFee);
                const totalBaseApr = (maturedFtmNum / totalFtmNum) * (baseApr * (1 - validatorFee)) * (1 - bxFtmFee);

                const totalBxFtmApr = totalMaxLockApr + totalBaseApr;

                aprs[tokenDefinition.address] = {
                    apr: totalBxFtmApr,
                    isIbYield: true,
                };
            }
            return aprs;
        } catch (error) {
            console.error('Failed to fetch bxFTM APR:', error);
            Sentry.captureException(`bxFTM IB APR handler failed: ${error}`);
            return {};
        }
    }
}
