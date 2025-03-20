export async function handleSubgraphErrors<T>(operation: () => Promise<T>): Promise<T | []> {
    try {
        return await operation();
    } catch (error: any) {
        if (
            error.message.includes('Too many requests') ||
            error.message.includes('bad indexers') ||
            error.message.includes('Bad Gateway')
        ) {
            return [];
        }
        throw error;
    }
}
