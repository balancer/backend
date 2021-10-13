import { Context } from '../../app/Context';

export function getRequiredAccountAddress(context: Context) {
    if (context.accountAddress === null) {
        throw new Error('Account address is required');
    }

    return context.accountAddress;
}
