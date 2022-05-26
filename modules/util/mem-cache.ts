import { Cache } from 'memory-cache';

const memCache = new Cache<string, any>();

export function memCacheSetValue<T>(key: string, value: T, timeOutSeconds: number): T {
    return memCache.put(key, value, timeOutSeconds * 1000);
}

export function memCacheGetValue<T>(key: string): T | null {
    return memCache.get(key);
}
