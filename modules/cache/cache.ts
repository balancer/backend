import { redisRead, redisWrite } from './redis';
import { v4 as uuidv4 } from 'uuid';

export const cache = {
    async putObjectValue<T extends Object>(key: string, object: T, timeoutInMinutes?: number): Promise<void> {
        console.log('putObjectValue ' + key);
        if (timeoutInMinutes) {
            await redisWrite.setEx(key, timeoutInMinutes * 60, JSON.stringify(object));
        } else {
            await redisWrite.set(key, JSON.stringify(object));
        }
    },

    async getObjectValue<T extends Object>(key: string): Promise<T | null> {
        const id = uuidv4();
        console.time('cache getObjectValue ' + key + ' ' + id);
        const response = await redisRead.get(key);
        console.timeEnd('cache getObjectValue ' + key + ' ' + id);

        const parsed = response ? JSON.parse(response) : null;

        return parsed;
    },

    async putValueKeyedOnObject<T extends Object>(
        keyPrefix: string,
        object: T,
        value: string,
        timeoutInMinutes: number,
    ): Promise<void> {
        console.log('putValueKeyedOnObject', `${keyPrefix}${JSON.stringify(object)}`);
        await redisWrite.setEx(`${keyPrefix}${JSON.stringify(object)}`, timeoutInMinutes * 60, value);
    },

    async getValueKeyedOnObject<T extends Object>(keyPrefix: string, object: T) {
        return redisRead.get(`${keyPrefix}${JSON.stringify(object)}`);
    },

    async deleteKey(key: string): Promise<number> {
        return redisRead.del(key);
    },

    async putValue(key: string, value: string, timeoutInMinutes?: number): Promise<void> {
        console.log('putValue', key);
        if (timeoutInMinutes) {
            await redisWrite.setEx(key, timeoutInMinutes * 60, value);
        } else {
            await redisWrite.set(key, value);
        }
    },

    async getValue(key: string) {
        return redisRead.get(key);
    },
};
