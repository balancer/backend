import { AddressZero } from '@ethersproject/constants';
import { networkContext } from '../network/network-context.service';

export function addressesMatch(address1: string, address2: string) {
    return address1.toLowerCase() === address2.toLowerCase();
}

export function replaceEthWithZeroAddress(address: string) {
    if (address.toLowerCase() === networkContext.data.eth.address) {
        return AddressZero;
    }

    return address;
}

export function replaceZeroAddressWithEth(address: string) {
    if (address.toLowerCase() === AddressZero) {
        return networkContext.data.eth.address;
    }

    return address;
}

export function replaceEthWithWeth(address: string) {
    if (address.toLowerCase() === networkContext.data.eth.address) {
        return networkContext.data.weth.address;
    }

    return address;
}

export function replaceWethWithEth(address: string) {
    if (address.toLowerCase() === networkContext.data.weth.address) {
        return networkContext.data.eth.address;
    }

    return address;
}

export function isEth(address: string) {
    return address.toLowerCase() === networkContext.data.eth.address;
}
