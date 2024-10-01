import { VotingGaugesRepository } from '../voting-gauges.repository';
import { prisma } from '../../../prisma/prisma-client';

/*
  The following hardcoded pools are missing in the subgraph but we have their pool data so we just need to provide a match between poolId and veVotingGauge address
  This is needed for any singleRecipientGauge
*/
export const vePools: Record<string, string> = {
    '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014': '0xb78543e00712c3abba10d0852f6e38fde2aaba4d', //veBAL
    '0x9232a548dd9e81bac65500b5e0d918f8ba93675c000200000000000000000423': '0x56124eb16441a1ef12a4ccaeabdd3421281b795a', //veLIT
    '0xd689abc77b82803f22c49de5c8a0049cc74d11fd000200000000000000000524': '0x5b79494824bc256cd663648ee1aad251b32693a9', //veUSH
    '0x39eb558131e5ebeb9f76a6cbf6898f6e6dce5e4e0002000000000000000005c8': '0x8e891a7b048a594592e9f0de70dc223143b4f1e6', //veQi
    '0x57766212638c425e9cb0c6d6e1683dda369c0fff000200000000000000000678': '0x24b7aeeefdb612d43f018cbc9c325680f61ec96d', //veGEM
};

export const veGauges = Object.values(vePools).map((v) => v.toLowerCase());

const isVebalPool = (poolId: string) => poolId === '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014';

export async function getVeVotingGauges() {
    // Make sure that gauge addresses and poolIds are lowercase
    const vePoolsLowerCase: Record<string, string> = {};
    Object.entries(vePools).forEach(([key, value]) => {
        vePoolsLowerCase[key.toLowerCase()] = value.toLowerCase();
    });

    // Get relative weight for each veVotingGauge
    const veService = new VotingGaugesRepository(prisma);
    const veGaugeAddresses = Object.values(vePoolsLowerCase);
    const relativeWeights = await veService.fetchRelativeWeights(veGaugeAddresses);

    let veVotingGauges = [];
    for (const poolId in vePoolsLowerCase) {
        veVotingGauges.push({
            // veBal pool have a max of 10% voting weight (AKA '0.1' relativeWeightCap)
            relativeWeightCap: isVebalPool(poolId) ? '0.1' : null,
            // Actual voting weight needs to be queried from RPC
            relativeWeight: String(relativeWeights[vePoolsLowerCase[poolId]]),
            id: vePoolsLowerCase[poolId],
            status: 'ACTIVE' as const,
            addedTimestamp: null,
            stakingGauge: {
                staking: {
                    poolId,
                    address: vePoolsLowerCase[poolId],
                },
            },
        });
    }

    return veVotingGauges;
}
