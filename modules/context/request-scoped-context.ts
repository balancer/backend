import { AsyncLocalStorage } from 'async_hooks';

const requestScopedContext: AsyncLocalStorage<Map<string, any>> = new AsyncLocalStorage();

export function initRequestScopedContext() {
    requestScopedContext.enterWith(new Map());
}

export function setRequestScopedContextValue(key: string, value: any) {
    requestScopedContext.getStore()?.set(key, value);
}

export function getRequestScopeContextValue<T>(key: string): T | null {
    return requestScopedContext.getStore()?.get(key) ?? null;
}
