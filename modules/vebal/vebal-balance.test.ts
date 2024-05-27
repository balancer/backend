import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { veBalService } from './vebal.service';

it('get vebal user balance', async () => {
    initRequestScopedContext();
    setRequestScopedContextValue('chainId', '1');
    await veBalService.syncVeBalBalances();
    const holder = await veBalService.getVeBalUserData('0x4ec8459bb6bab83d8987373f6ae47b9a60bd5a6a');
    expect(holder.balance).not.toBe('0.0');
    expect(holder.locked).not.toBe('0.0');
    expect(holder.lockedUsd).not.toBe('0.00');
    expect(holder.rank).toBeDefined();
}, 500000);
