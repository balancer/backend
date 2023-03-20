import { prisma } from '../prisma/prisma-client';
import { google } from 'googleapis';
import moment from 'moment-timezone';

import { datastudioService } from '../modules/datastudio/datastudio.service';
import { GoogleJwtClient, googleJwtClient } from '../modules/datastudio/google-jwt-client';
import { SecretsManager } from '../modules/datastudio/secrets-manager';
import { poolService } from '../modules/pool/pool.service';
import { getContractAt } from '../modules/web3/contract';
import VaultAbi from '../modules/pool/abi/Vault.json';
import ReliquaryAbi from '../modules/web3/abi/Reliquary.json';
import ERC20Abi from '../modules/web3/abi/ERC20.json';
import MasterchefAbi from '../modules/web3/abi/MasterChef.json';

import aTokenRateProvider from '../modules/pool/abi/StaticATokenRateProvider.json';
import WeightedPoolAbi from '../modules/pool/abi/WeightedPool.json';
import StablePoolAbi from '../modules/pool/abi/StablePool.json';
import MetaStablePool from '../modules/pool/abi/MetaStablePool.json';
import ElementPoolAbi from '../modules/pool/abi/ConvergentCurvePool.json';
import LinearPoolAbi from '../modules/pool/abi/LinearPool.json';
import StablePhantomPoolAbi from '../modules/pool/abi/StablePhantomPool.json';
import ComposableStablePoolAbi from '../modules/pool/abi/ComposableStablePool.json';
import { Multicaller } from '../modules/web3/multicaller';

import { BigNumber, ethers } from 'ethers';
import { Reliquary } from '../modules/web3/types/Reliquary';
import { parseUnits } from 'ethers/lib/utils';
import { formatFixed } from '@ethersproject/bignumber';
import { gnosisSafeService } from '../modules/gnosis/gnosis-safe.service';
import { userService } from '../modules/user/user.service';
import { tokenService } from '../modules/token/token.service';
import axios from 'axios';
import { reliquarySubgraphService } from '../modules/subgraphs/reliquary-subgraph/reliquary.service';
import { initRequestScopedContext, setRequestScopedContextValue } from '../modules/context/request-scoped-context';
import { networkContext } from '../modules/network/network-context.service';
import { AllNetworkConfigs } from '../modules/network/network-config';
// import { tokenPriceService } from '../legacy/token-price/token-price.service';

async function debug() {
    // const today = moment().startOf('day');
    // console.log(`${today.format('DD MMM')}`);
    // console.log(moment.tz('GMT').endOf('day').unix());
    // const graphUrl = 'https://api.thegraph.com/subgraphs/name/beethovenxfi/user-bpt-balances-optimism';
    // const query = `
    // {
    //     userBalanceSnapshots(
    //       where: {user_contains_nocase: "0x607d2381aFecbD80c4AD5CCE8059205C2a297966",
    //       gauges_contains: ["0x38f79beffc211c6c439b0a3d10a0a673ee63afb4"],
    //       timestamp_gte: 1664582400,
    //       timestamp_lt: 1667260800}
    //     ) {
    //       gauges
    //       gaugeBalances
    //     }
    //   }
    //   `;
    // const response = await axios.post(graphUrl, {
    //     query: query,
    // });
    // console.log(response.data);
    // const resp = response.data.data;
    // if (resp && resp.userBalanceSnapshots) {
    //     for (const snapshot of resp.userBalanceSnapshots) {
    //         const gaugeIndex = snapshot.gauges.indexOf('0x38f79beffc211c6c439b0a3d10a0a673ee63afb4');
    //         const gaugeBalance = snapshot.gaugeBalances[gaugeIndex];
    //         if (gaugeBalance >= 0.04) {
    //             console.log(`yes`);
    //             return 1;
    //         }
    //     }
    //     console.log(`no`);
    //     return 0;
    // }
    // parseFloat(2);
    // await datastudioService.feedPoolData();
    // const secretsManager = new SecretsManager();
    // const jwtClientHelper = new GoogleJwtClient();
    // const privateKey = await secretsManager.getSecret('backend-v2-datafeed-privatekey');
    // const jwtClient = await jwtClientHelper.getAuthorizedSheetsClient(privateKey);
    // const sheets = google.sheets({ version: 'v4' });
    // const range = `${networkConfig.datastudio['main'].databaseTabName}!A2:W`;
    // let currentSheetValues;
    // currentSheetValues = await sheets.spreadsheets.values.get({
    //     auth: jwtClient,
    //     spreadsheetId: networkConfig.datastudio['main'].sheetId,
    //     range: range,
    //     valueRenderOption: 'UNFORMATTED_VALUE',
    // });
    // if (currentSheetValues.data.values) {
    //     for (const todayRow of currentSheetValues.data.values) {
    //         if (
    //             [
    //                 'Test Boosted Tricrypto',
    //                 'Galactic Dragon',
    //                 'Yellow submarine, our yield machine',
    //                 'Happy Road reloaded',
    //                 'Wonderwall',
    //                 'Enter the Stargate',
    //                 "Lido's Swan Song",
    //                 'Just BEET it',
    //             ].includes(todayRow[4])
    //         ) {
    //             todayRow[5] = 'WEIGHTED_V2';
    //         }
    //     }
    //     await sheets.spreadsheets.values.update({
    //         auth: jwtClient,
    //         spreadsheetId: networkConfig.datastudio['main'].sheetId,
    //         range: range,
    //         valueInputOption: 'USER_ENTERED',
    //         requestBody: {
    //             majorDimension: 'ROWS',
    //             range: range,
    //             values: currentSheetValues.data.values,
    //         },
    //     });
    // }
    // await poolService.updatePoolAprs();
    /*
    Impact of a new deposit on the maturity:
    - Maturity is defined as `now - entryTimestamp` (number of seconds)
    
    For any new deposit, a certain amount of time is added to the entryTimestamp, making the relic less mature.
    The amount of seconds that is added to the entryTimestamp depends on the ratio of depositAmount : balance.

    weight = depositAmount / (depositAmount + balance)
    entryTimestampAfterDeposit = oldEntryTimestamp + (maturity * weight)
    */
    // const depositAmount = parseUnits('20', 18);
    // const relicId = 1;
    // const reliquary = getContractAt(networkConfig.reliquary!.address, ReliquaryAbi) as Reliquary;
    // const position = await reliquary.getPositionForId(relicId);
    // const balance = position.amount;
    // const entryTimestamp = position.entry.toNumber();
    // const level = position.level.toNumber();
    // const levelOnUpdate = await reliquary.levelOnUpdate(relicId);
    // const poolId = position.poolId;
    // const poolLevelInfo = await reliquary.getLevelInfo(poolId);
    // const maturityLevels = poolLevelInfo.requiredMaturity;
    // const weight =
    //     parseFloat(formatFixed(depositAmount, 18)) /
    //     (parseFloat(formatFixed(depositAmount, 18)) + parseFloat(formatFixed(balance, 18)));
    // const maturity = moment().unix() - entryTimestamp;
    // const entryTimestampAfterDeposit = Math.round(entryTimestamp + maturity * weight);
    // const newMaturity = moment().unix() - entryTimestampAfterDeposit;
    // let newLevel = 0;
    // maturityLevels.forEach((level, i) => {
    //     if (newMaturity >= level.toNumber()) {
    //         newLevel = i;
    //     }
    // });
    // console.log(`Old maturity: ${maturity}`);
    // console.log(`New maturity: ${newMaturity}`);
    // console.log(`Maturity lost: ${maturity - newMaturity}`);
    // console.log(`Old level: ${levelOnUpdate}`);
    // console.log(`New level: ${newLevel}`);
    // console.log(`Levels lost: ${levelOnUpdate.toNumber() - newLevel}`);
    // const oldLevelProgress =
    //     levelOnUpdate.toNumber() >= maturityLevels.length - 1
    //         ? 'max level reached'
    //         : `${maturity}/${maturityLevels[levelOnUpdate.toNumber() + 1]}`;
    // const newLevelProgress =
    //     newLevel > maturityLevels.length ? 'max level reached' : `${newMaturity}/${maturityLevels[newLevel + 1]}`;
    // console.log(`Progress to next level before: ${oldLevelProgress}`);
    // console.log(`Progress to next level now: ${newLevelProgress}`);
    // console.log(await sanityClient.fetch(`*[_type == "lbp" && chainId == "250"]`));
    // console.log(await userService.getUserHarvestTax('0xb5AE3c648709913Ef9739e9F6eDB5a821c6Ab160', 2022));
    // const contract = getContractAt(networkConfig.balancer.vault, VaultAbi);
    // const events = await contract.queryFilter({ address: networkConfig.balancer.vault }, 49895328, 49895330);
    // const filteredEvents = events.filter((event) =>
    //     ['PoolBalanceChanged', 'PoolBalanceManaged', 'Swap'].includes(event.event!),
    // );
    // await poolService.syncChangedPools();
    // await tokenService.syncAllHistoricalPrices();

    initRequestScopedContext();
    setRequestScopedContextValue('chainId', '250');
    await userService.syncChangedStakedBalances();
    // const jobs = AllNetworkConfigs['1'].workerJobs;

    // for (const job of jobs) {
    //     console.log(`Calling job ${job.name}`);
    //     const response = await axios.post('http://localhost:4000/', {
    //         name: `${job.name}`,
    //         chainId: '1',
    //     });
    //     console.log(response.data);
    //     break;
    // }

    // await userService.syncChangedStakedBalances();
    // await poolService.syncStakingForPools();
    // await poolService.updatePoolAprs();
    // const deleted = await tokenService.purgeOldTokenPrices();
    // console.time('24hprices');
    // await tokenService.getTokenPriceFrom24hAgo();
    // console.timeEnd('24hprices');
    // await tokenPriceService.cacheTokenPrices();
    // await poolService.loadReliquarySnapshotsForAllFarms();
    // await poolService.syncLatestReliquarySnapshotsForAllFarms();
    // const relics = await reliquarySubgraphService.getAllRelicsWithPaging({});
    // for (const relic of relics) {
    //     console.log(relic.relicId);
    // }
    // await poolService.loadSnapshotsForPools([
    //     '0x62ec8b26c08ffe504f22390a65e6e3c1e45e987700000000000000000000007e',
    //     '0xb96c5bada4bf6a70e71795a3197ba94751dae2db00000000000000000000007d',
    //     '0xedcfaf390906a8f91fb35b7bac23f3111dbaee1c00000000000000000000007c',
    // ]);
    // await poolService.createPoolSnapshotsForPoolsMissingSubgraphData(
    //     '0x428e1cc3099cf461b87d124957a0d48273f334b100000000000000000000007f',
    // );
    // const backend = 'https://backend-v2.beets-ftm-node.com/graphql';
    // const users = await prisma.prismaUser.findMany({});
    // let i = 0;
    // for (const user of users) {
    //     const userBalances = await axios.post(
    //         backend,
    //         {
    //             query: `query{
    //             userGetPoolBalances{
    //               poolId
    //               walletBalance
    //               stakedBalance
    //             }
    //           }`,
    //         },
    //         {
    //             headers: {
    //                 accountAddress: `${user.address}`,
    //             },
    //         },
    //     );
    //     for (const userBalance of userBalances.data.data.userGetPoolBalances) {
    //         const pool = await prisma.prismaPool.findUniqueOrThrow({
    //             where: { id: userBalance.poolId },
    //             include: { staking: true },
    //         });
    //         const walletBalance = parseUnits(userBalance.walletBalance, 18);
    //         const poolContract = getContractAt(pool.address, ERC20Abi);
    //         const contractBalance = await poolContract.balanceOf(user.address);
    //         if (!walletBalance.eq(contractBalance)) {
    //             console.log(
    //                 `Wallet balance do not match: ${walletBalance} vs ${contractBalance} in wallet ${user.address} for pool ${userBalance.poolId}`,
    //             );
    //             await axios.post(
    //                 backend,
    //                 {
    //                     query: `mutation{
    //                     userSyncBalance(poolId: "${userBalance.poolId}")
    //                     }`,
    //                 },
    //                 {
    //                     headers: {
    //                         accountAddress: `${user.address}`,
    //                     },
    //                 },
    //             );
    //         }
    //         const stakedBalance = parseUnits(userBalance.stakedBalance, 18);
    //         const farmId = pool.staking?.id;
    //         if (pool.staking?.type !== 'MASTER_CHEF' && pool.staking?.type !== 'FRESH_BEETS') {
    //             continue;
    //         }
    //         if (farmId) {
    //             const masterchefContract = getContractAt(networkConfig.masterchef!.address, MasterchefAbi);
    //             const userMasterchefBalance = await masterchefContract.userInfo(farmId, user.address);
    //             if (!stakedBalance.eq(userMasterchefBalance.amount)) {
    //                 console.log(
    //                     `Staked balance do not match: ${stakedBalance} vs ${userMasterchefBalance.amount} in wallet ${user.address} for pool ${userBalance.poolId} and farm ${farmId}`,
    //                 );
    //                 await axios.post(
    //                     backend,
    //                     {
    //                         query: `mutation{
    //                         userSyncBalance(poolId: "${userBalance.poolId}")
    //                         }`,
    //                     },
    //                     {
    //                         headers: {
    //                             accountAddress: `${user.address}`,
    //                         },
    //                     },
    //                 );
    //             }
    //         }
    //     }
    //     i++;
    //     if (i % 100 === 0) {
    //         console.log(i);
    //     }
    // }

    const record: Record<string, string> = { eth: '1' };
    if (record['eth'] !== null) {
        console.log(`yay`);
    }
    if (record['nay'] === null) {
        console.log(`nay`);
    }
}

function getNumber(): number | undefined {
    return undefined;
}

debug();
