import { JSONPath } from 'jsonpath-plus';
import { TokenYieldHandler, TokenYieldHttpFetchConfig } from '../../types';

const fetchWithTimeout = async (
    url: string,
    options: RequestInit = {},
    skipSSL = false,
    timeoutMs: number = 20000,
): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let previous_NODE_TLS_REJECT_UNAUTHORIZED = process.env['NODE_TLS_REJECT_UNAUTHORIZED'];
    if (skipSSL) {
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    }
    const fetchPromise = fetch(url, {
        ...options,
        signal: controller.signal,
    });
    if (skipSSL) {
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = previous_NODE_TLS_REJECT_UNAUTHORIZED;
    }

    // Timeout promise - needed to handle bun edge case that doesn't throw when fetch is aborted
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId; // Reference to clear timeout
        controller.signal.addEventListener('abort', () => {
            reject(new Error(`timed out after ${timeoutMs}ms`));
        });
    });

    try {
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);
        throw `${url} ${error.message}`;
    } finally {
        // Cleanup listener in all cases to prevent potential mem leaks
        controller.signal.removeEventListener('abort', () => {});
    }
};

const extract = (json: any, config: TokenYieldHttpFetchConfig) =>
    config.extractors.flatMap((ex) => {
        if (ex.type === 'path') {
            const raw = JSONPath({ path: ex.path, json, wrap: false });
            return [[ex.token, raw]];
        }
        if (ex.type === 'enumerate') {
            const values = JSONPath({ path: ex.path, json, wrap: false });
            return values.map(ex.entries);
        }
        return [];
    });

const transform = (entries: [string, number][], config: TokenYieldHttpFetchConfig) =>
    entries.map(([key, value]) => ({ address: key, apr: normalizeValue(value, config) }));

const normalizeValue = (value: any, { url, average, scale }: TokenYieldHttpFetchConfig) => {
    if (value === undefined) {
        throw `value parsing error ${url}`;
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

export const httpTokenYieldHandler: TokenYieldHandler = async (config: TokenYieldHttpFetchConfig) => {
    const res = await fetchWithTimeout(
        config.url,
        {
            method: config.method ?? (config.body ? 'POST' : 'GET'),
            headers: config.headers,
            ...(config.body && { body: config.body }),
        },
        config.skipSSL,
    );
    try {
        const json = await res.json();

        return transform(extract(json, config), config);
    } catch (e: any) {
        throw `http-yield-handler ${e.message} ${config.url}`;
    }
};
