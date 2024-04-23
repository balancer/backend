import { tokenService } from './token.service';

describe('Token service', () => {
    test('same token address for in two chains', async () => {
        const address = '0x1509706a6c66ca549ff0cb464de88231ddbe213b';
        const prices = await tokenService.getWhiteListedTokenPrices(['GNOSIS', 'ARBITRUM']);
        const filtered = prices.filter((token) => token.tokenAddress === address);
        expect(filtered.length).toBe(2);
    });
});
