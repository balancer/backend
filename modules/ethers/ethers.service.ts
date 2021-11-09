import { Contract, ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

const jsonRpcProvider = new ethers.providers.JsonRpcProvider('https://graph-node.beets-ftm-node.com/rpc');

export class EthersService {
    getContractAt(address: string, name: string): Contract {
        const abi = JSON.parse(fs.readFileSync(path.join(__dirname, 'abi', `${name}.json`), 'utf8'));
        return new Contract(address, abi, jsonRpcProvider);
    }
}

export const ethersService = new EthersService();
