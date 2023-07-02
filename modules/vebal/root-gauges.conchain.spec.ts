import { Address } from 'viem';
import { createHttpClient } from '../network/viem/clients';
import { OnChainRootGauges } from './root-gauges.onchain';

// anvil --fork-url https://eth-mainnet.alchemyapi.io/v2/7gYoDJEw6-QyVP5hd2UfZyelzDIDemGz --port 8555 --fork-block-number=17569375

// In CI we will use http://127.0.0.1:8555 to use the anvil fork;
const httpRpc = process.env.TEST_RPC_URL || 'https://cloudflare-eth.com';
console.log(`🤖 Integration tests using ${httpRpc} as rpc url`);
const testHttpClient = createHttpClient(httpRpc);

it('fetches list of root gauge addresses', async () => {
    const service = new OnChainRootGauges(testHttpClient);
    const addresses = await service.getRootGaugeAddresses();
    expect(addresses.length).toBe(327);
}, 10_000);

it('generates root gauge rows given a list of gauge addresses', async () => {
    const service = new OnChainRootGauges(testHttpClient);

    const rootGaugeAddresses = [
        '0x79eF6103A513951a3b25743DB509E267685726B7',
        '0xfb0265841C49A6b19D70055E596b212B0dA3f606',
        '0x8F7a0F9cf545DB78BF5120D3DBea7DE9c6220c10',
        // '0x78a54C8F4eAba82e45cBC20B9454a83CB296e09E',
        // '0xecF0a26a290cbf3DDBAB7eC5Fb44Ef5A294cAc18',
        // '0x21cf9324D5B1AC739B7E6922B69500F1eEDB52e0',
        // '0x5b79494824Bc256cD663648Ee1Aad251B32693A9',
        // '0xa8D974288Fe44ACC329D7d7a179707D27Ec4dd1c',
        // '0x69F1077AeCE23D5b0344330B5eB13f05d5e410a1',
        // '0xc43bF12A008d3Cc48AF7da1e8e87622A78dc64da',
        // '0xc4b6cc9A444337b1Cb8cBbDD9de4d983f609C391',
        // '0xFa58735ceEAa83a7c9c13CA771F12378D40D7b05',
        // '0x8F7a0F9cf545DB78BF5120D3DBea7DE9c6220c10',
        // '0x6E7B9A1746a7eD4b23edFf0975B726E5aA673E21',
        // '0x6F3b31296FD2457eba6Dca3BED65ec79e06c1295',
        // '0xb78543e00712C3ABBA10D0852f6E38FDE2AaBA4d',
        // '0xf8C85bd74FeE26831336B51A90587145391a27Ba',
        // '0x7F75ecd3cFd8cE8bf45f9639A226121ca8bBe4ff',
        // '0xc61e7E858b5a60122607f5C7DF223a53b01a1389',
        // '0xbf65b3fA6c208762eD74e82d4AEfCDDfd0323648',
        // '0xD449Efa0A587f2cb6BE3AE577Bc167a774525810',
        // '0xd758454BDF4Df7Ad85f7538DC9742648EF8e6d0A',
        // '0xd8191A3496a1520c2B5C81D04B26F8556Fc62d7b',
    ] as Address[];
    // Uncomment to test with all the root gauges
    // const rootGaugeAddresses = await service.getRootGaugeAddresses();

    const rows = await service.fetchOnchainRootGauges(rootGaugeAddresses);

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "gaugeAddress": "0x79ef6103a513951a3b25743db509e267685726b7",
          "isKilled": false,
          "network": "MAINNET",
          "recipient": undefined,
          "relativeWeight": 71123066693252456,
          "relativeWeightCap": undefined,
        },
        {
          "gaugeAddress": "0xfb0265841c49a6b19d70055e596b212b0da3f606",
          "isKilled": true,
          "network": "OPTIMISM",
          "recipient": "0x3ee85ac7c0e1799af6f4e582de485fcdfb12855a",
          "relativeWeight": 0,
          "relativeWeightCap": undefined,
        },
        {
          "gaugeAddress": "0x8f7a0f9cf545db78bf5120d3dbea7de9c6220c10",
          "isKilled": false,
          "network": "ARBITRUM",
          "recipient": "0x04fc019017ed3f921d5ec11fff84b870744ba0d1",
          "relativeWeight": 0,
          "relativeWeightCap": "0.02",
        },
      ]
    `);
}, 10_000);
