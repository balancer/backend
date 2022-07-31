import { networkConfig } from '../config/network-config';
import { AddressZero } from '@ethersproject/constants';

export function addressesMatch(address1: string, address2: string) {
    return address1.toLowerCase() === address2.toLowerCase();
}

export function replaceEthWithZeroAddress(address: string) {
    if (address.toLowerCase() === networkConfig.eth.address) {
        return AddressZero;
    }

    return address;
}

export function replaceZeroAddressWithEth(address: string) {
    if (address.toLowerCase() === AddressZero) {
        return networkConfig.eth.address;
    }

    return address;
}

export function replaceEthWithWeth(address: string) {
    if (address.toLowerCase() === networkConfig.eth.address) {
        return networkConfig.weth.address;
    }

    return address;
}

export function replaceWethWithEth(address: string) {
    if (address.toLowerCase() === networkConfig.weth.address) {
        return networkConfig.eth.address;
    }

    return address;
}

export function isEth(address: string) {
    return address.toLowerCase() === networkConfig.eth.address;
}
