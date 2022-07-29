import { Cache } from 'memory-cache';

const memCache = new Cache<string, any>();

export function memCacheSetValue<T>(key: string, value: T, timeOutSeconds: number): T {
    return memCache.put(key, value, timeOutSeconds * 1000);
}

export function memCacheGetValue<T>(key: string): T | null {
    return memCache.get(key);
}

export async function memCacheGetValueAndCacheIfNeeded<T>(
    key: string,
    func: () => Promise<T>,
    timeOutSeconds: number,
): Promise<T> {
    const cached = memCacheGetValue<T>(key);

    if (cached) {
        return cached;
    }

    const value = await func();

    memCacheSetValue(key, value, timeOutSeconds);

    return value;
}
