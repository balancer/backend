import { FbeetsService } from './lib/fbeets.service';

export class BeetsService {
    constructor(private readonly fBeetsService: FbeetsService) {}

    public async getFbeetsRatio(): Promise<string> {
        return this.fBeetsService.getRatio();
    }
}

export const beetsService = new BeetsService(new FbeetsService());
