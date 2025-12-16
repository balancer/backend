import { SftmxController } from './sftmx-controller';

describe('SFTMX syncing service', () => {
    test('sync withdrawal data', async () => {
        await SftmxController().syncSftmxWithdrawalrequests('250');
    }, 50000);

    test('sync staking data via job', async () => {
        await SftmxController().syncSftmxStakingData('250');
    }, 50000000);

    test('sync staking snapshot data via job', async () => {
        await SftmxController().syncSftmxStakingSnapshots('250');
    }, 50000);
});
