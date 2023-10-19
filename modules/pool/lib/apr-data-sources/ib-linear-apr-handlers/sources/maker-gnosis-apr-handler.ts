import { AprHandler } from '../ib-linear-apr-handlers';
import { getContractAt } from '../../../../../web3/contract';
import { Chain } from '@prisma/client';

const helperAbi = ['function vaultAPY() view returns (uint256)'];

/** Sets the config data used internally */
const config = {
  "GNOSIS": {
    sdaiAddress: '0xaf204776c7245bf4147c2612bf6e5972ee483701',
    helperAddress: '0xd499b51fcfc66bd31248ef4b28d656d67e591a94',
  }
}

/** Makes handler callable by chain */
export const chains = Object.keys(config) as Chain[];

export class Handler implements AprHandler {
  async getAprs(chain: Chain) {
    if (chain !== 'GNOSIS') {
      throw `Handler supports GNOSIS only, but called for ${chain}`
    }

    const helper = getContractAt(config[chain].helperAddress, helperAbi);
    const vaultAPY = await helper.vaultAPY();
    const apr = Number(vaultAPY) * (10 ** -18);

    return {
      [config[chain].sdaiAddress]: {
        apr,
        isIbYield: true,
        group: 'MAKER'
      }
    }
  }
}
