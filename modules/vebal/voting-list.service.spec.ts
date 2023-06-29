import { testPublicClient } from '../network/viem/clients';
import { VotingListService } from './voting-list.service';

it('fetches list of root gauge addresses', async () => {
    const service = new VotingListService(testPublicClient());
    const addresses = await service.getRootGaugeAddresses();
    expect(addresses.length).toBe(327);
}, 10_000);

it('generates root gauge rows given a list of gauge addresses', async () => {
    const service = new VotingListService(testPublicClient());
    const rootGaugeAddresses = [
        '0x79eF6103A513951a3b25743DB509E267685726B7',
        '0xfb0265841C49A6b19D70055E596b212B0dA3f606',
    ];
    const addresses = await service.generateRootGaugeRows(rootGaugeAddresses);
    console.log(addresses);
}, 10_000);
