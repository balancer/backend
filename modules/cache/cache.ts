import { redis } from './redis';

export const cache = {
    async putObjectValue<T extends Object>(key: string, object: T, timeoutInMinutes?: number): Promise<void> {
        //console.log('putObjectValue ' + key);
        if (timeoutInMinutes) {
            await redis.setEx(key, timeoutInMinutes * 60, JSON.stringify(object));
        } else {
            await redis.set(key, JSON.stringify(object));
        }
    },

    async getObjectValue<T extends Object>(key: string): Promise<T | null> {
        const response = await redis.get(key);

        return response ? JSON.parse(response) : null;
    },

    async putValueKeyedOnObject<T extends Object>(
        keyPrefix: string,
        object: T,
        value: string,
        timeoutInMinutes: number,
    ): Promise<void> {
        //console.log('putValueKeyedOnObject', `${keyPrefix}${JSON.stringify(object)}`);
        await redis.setEx(`${keyPrefix}${JSON.stringify(object)}`, Math.round(timeoutInMinutes * 60), value);
    },

    async getValueKeyedOnObject<T extends Object>(keyPrefix: string, object: T) {
        return redis.get(`${keyPrefix}${JSON.stringify(object)}`);
    },

    async deleteKey(key: string): Promise<number> {
        return redis.del(key);
    },

    async putValue(key: string, value: string, timeoutInMinutes?: number): Promise<void> {
        //console.log('putValue', key);
        if (timeoutInMinutes) {
            await redis.setEx(key, Math.round(timeoutInMinutes * 60), value);
        } else {
            await redis.set(key, value);
        }
    },

    async getValue(key: string) {
        return redis.get(key);
    },

    async deleteAllMatchingPattern(pattern: string) {
        const keys = await redis.keys(pattern);

        console.log('keys', keys);

        for (const key of keys) {
            await redis.del(key);
        }
    },
};
