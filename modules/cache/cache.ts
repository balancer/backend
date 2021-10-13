import { redis } from './redis';

export const cache = {
    async putObjectValue<T extends Object>(key: string, object: T, timeoutInMinutes?: number): Promise<void> {
        if (timeoutInMinutes) {
            await redis.setex(key, timeoutInMinutes * 60, JSON.stringify(object));
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
        await redis.setex(`${keyPrefix}${JSON.stringify(object)}`, timeoutInMinutes * 60, value);
    },

    async getValueKeyedOnObject<T extends Object>(keyPrefix: string, object: T) {
        return redis.get(`${keyPrefix}${JSON.stringify(object)}`);
    },
};
