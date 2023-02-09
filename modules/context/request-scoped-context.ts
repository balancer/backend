import { AsyncLocalStorage } from 'async_hooks';

const requestScopedContext: AsyncLocalStorage<Map<string, any>> = new AsyncLocalStorage();

export function createRequestScopedContext(callback: () => void) {
    requestScopedContext.run(new Map(), callback);
}

export function setRequestScopedContextValue(key: string, value: any) {
    requestScopedContext.getStore()?.set(key, value);
}

export function getRequestScopeContextValue<T>(key: string): T | null {
    return requestScopedContext.getStore()?.get(key) ?? null;
}
