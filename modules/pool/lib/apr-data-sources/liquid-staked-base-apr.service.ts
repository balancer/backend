import axios from 'axios';

export class LiquidStakedBaseAprService {
    public async getWstEthBaseApr(): Promise<number> {
        const { data } = await axios.get<{
            data: { aprs: [{ timeUnix: number; apr: number }]; smaApr: number };
        }>('https://eth-api.lido.fi/v1/protocol/steth/apr/sma');
        return data.data.smaApr / 100;
    }

    public getSftmxBaseApr(): number {
        return 0.046;
    }

    public async getAnkrFtmBaseApr(): Promise<number> {
        const { data } = await axios.get<{ services: { serviceName: string; apy: string }[] }>(
            'https://api.staking.ankr.com/v1alpha/metrics',
            {},
        );

        const ankrFtmApy = data.services.find((service) => service.serviceName === 'ftm');
        return parseFloat(ankrFtmApy?.apy || '0') / 100;
    }

    public async getAnkrEthBaseApr(): Promise<number> {
        const { data } = await axios.get<{ services: { serviceName: string; apy: string }[] }>(
            'https://api.staking.ankr.com/v1alpha/metrics',
            {},
        );

        const ankrEthApy = data.services.find((service) => service.serviceName === 'eth');
        return parseFloat(ankrEthApy?.apy || '0') / 100;
    }

    public async getXBooBaseApr(): Promise<number> {
        const { data } = await axios.get<string>('https://api.spooky.fi/api/xboo', {});
        return parseFloat(data) / 100;
    }

    public getREthBaseApr(): number {
        return 0.0425;
    }
}

export const liquidStakedBaseAprService = new LiquidStakedBaseAprService();
