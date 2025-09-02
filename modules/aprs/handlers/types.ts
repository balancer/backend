import { YbAprConfig } from '../../yb-tokens';

export interface AprHandlerConfigs {
    ybAprHandler?: YbAprConfig;
    aaveRewardsAprHandler?: boolean;
    maBeetsAprHandler?: MaBeetsAprConfig;
    morphoRewardsAprHandler?: boolean;
}

export interface MaBeetsAprConfig {
    beetsAddress: string;
}
