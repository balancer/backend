import { BalancerSDK } from '@balancer-labs/sdk';
import { env } from '../../../app/env';
import { BALANCER_SDK_CONFIG } from './config';

export const balancerSdk = new BalancerSDK(BALANCER_SDK_CONFIG[env.CHAIN_ID]);
