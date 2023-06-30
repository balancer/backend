import { Address } from 'viem';
import { createHttpClient } from '../network/viem/clients';
import { VotingListService } from './voting-list.service';

// anvil --fork-url https://eth-mainnet.alchemyapi.io/v2/7gYoDJEw6-QyVP5hd2UfZyelzDIDemGz --port 8555 --fork-block-number=17569375

// In CI we will use http://127.0.0.1:8555 to use the anvil fork;
const httpRpc = process.env.TEST_RPC_URL || 'https://cloudflare-eth.com';
console.log(`🤖 Integration tests using ${httpRpc} as rpc url`);
const testHttpClient = createHttpClient(httpRpc);

it('fetches list of root gauge addresses', async () => {
    const service = new VotingListService(testHttpClient);
    const addresses = await service.getRootGaugeAddresses();
    expect(addresses.length).toBe(327);
}, 10_000);

it('generates root gauge rows given a list of gauge addresses', async () => {
    const service = new VotingListService(testHttpClient);

    const rootGaugeAddresses = [
        '0x79eF6103A513951a3b25743DB509E267685726B7',
        '0xfb0265841C49A6b19D70055E596b212B0dA3f606',
    ] as Address[];
    // Uncomment to test with all the root gauges
    // const rootGaugeAddresses = await service.getRootGaugeAddresses();

    const rows = await service.generateRootGaugeRows(rootGaugeAddresses);

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "gaugeAddress": "0x79eF6103A513951a3b25743DB509E267685726B7",
          "isKilled": false,
          "network": "Ethereum",
          "recipient": undefined,
          "relativeWeight": 71123066693252456,
          "relativeWeightCap": undefined,
        },
        {
          "gaugeAddress": "0xfb0265841C49A6b19D70055E596b212B0dA3f606",
          "isKilled": true,
          "network": "Optimism",
          "recipient": "0x3Ee85Ac7c0E1799af6f4e582dE485FcdFb12855A",
          "relativeWeight": 0,
          "relativeWeightCap": undefined,
        },
      ]
    `);
}, 10_000);
