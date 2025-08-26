import { JSONPath } from 'jsonpath-plus';
import { YbAprHandler } from '../../types';

type EntryExtractor =
    | { readonly type: 'path'; readonly key: string; readonly path: string }
    | { readonly type: 'enumerate'; readonly path: string; readonly entries: (item: any) => [string, number] };

interface AprHttpFetchConfig {
    url: string;
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: string;
    scale?: number;
    average?: boolean;
    extractors: readonly EntryExtractor[];
}

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 20000): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const fetchPromise = fetch(url, {
        ...options,
        signal: controller.signal,
    });

    // Timeout promise - needed to handle bun edge case that doesn't throw when fetch is aborted
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId; // Reference to clear timeout
        controller.signal.addEventListener('abort', () => {
            reject(new Error(`${url} timed out after ${timeoutMs}ms`));
        });
    });

    try {
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);
        throw error.message;
    } finally {
        // Cleanup listener in all cases to prevent potential mem leaks
        controller.signal.removeEventListener('abort', () => {});
    }
};

const extract = (json: any, config: AprHttpFetchConfig) =>
    config.extractors.flatMap((ex) => {
        if (ex.type === 'path') {
            const raw = JSONPath({ path: ex.path, json, wrap: false });
            return [[ex.key, raw]];
        }
        if (ex.type === 'enumerate') {
            const values = JSONPath({ path: ex.path, json, wrap: false });
            return values.map(ex.entries);
        }
        return [];
    });

const transform = (entries: [string, number][], config: AprHttpFetchConfig) =>
    entries.map(([key, value]) => ({ address: key, apr: normalizeValue(value, config) }));

const normalizeValue = (value: any, { average, scale }: AprHttpFetchConfig) => {
    if (value === undefined) {
        throw 'value parsing error';
    }

    if (Array.isArray(value)) {
        if (average) {
            value = value.reduce((a: number, b: number) => Number(a) + Number(b), 0) / value.length;
        } else {
            value = value[0];
        }
    }

    if (scale) value = value / scale;
    return parseFloat(value);
};

export const httpAprHandler: YbAprHandler = async (config: AprHttpFetchConfig) => {
    const res = await fetchWithTimeout(config.url, {
        method: config.method ?? (config.body ? 'POST' : 'GET'),
        headers: config.headers,
        ...(config.body && { body: config.body }),
    });
    const json = await res.json();

    return transform(extract(json, config), config);
};
