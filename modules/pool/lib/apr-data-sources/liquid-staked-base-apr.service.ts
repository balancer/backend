import axios from 'axios';

export class LiquidStakedBaseAprService {
    public async getXBooBaseApr(): Promise<number> {
        const { data } = await axios.get<string>('https://api.spooky.fi/api/xboo', {});
        return parseFloat(data) / 100;
    }
}

export const liquidStakedBaseAprService = new LiquidStakedBaseAprService();
