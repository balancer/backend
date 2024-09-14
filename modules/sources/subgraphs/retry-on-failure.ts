export async function retryOnFailureWithRotation<T>(
    sdkClients: any[],
    fn: (sdk: any) => Promise<T>,
    retries: number = 3,
): Promise<T> {
    let attempts = 0;
    let currentSdkIndex = 0;

    while (attempts < retries) {
        try {
            const sdk = sdkClients[currentSdkIndex]; // Get the current SDK client
            return await fn(sdk); // Try the operation using the current SDK
        } catch (error: any) {
            attempts += 1;
            console.log(`Subgraph URL from index ${currentSdkIndex} on ${attempts} attempt failed:`, error.message);

            if (attempts < retries) {
                // Rotate to the next SDK client
                currentSdkIndex = (currentSdkIndex + 1) % sdkClients.length;
                console.log(`Retrying with URL from index ${currentSdkIndex}...`);
            } else {
                throw new Error('All SDK clients failed after retries.');
            }
        }
    }

    throw new Error('Unexpected failure, retries exhausted.');
}

export function wrapSdkWithRetryAndRotation<T extends object>(sdkClients: T[], retries: number = 3): T {
    const wrappedSdk: Partial<T> = {};

    // Use one SDK as a template for wrapping all functions
    const sdk = sdkClients[0];

    for (const key of Object.keys(sdk)) {
        const value = (sdk as any)[key];

        if (typeof value === 'function') {
            // Wrap each SDK method to use retry with rotation
            wrappedSdk[key as keyof T] = ((...args: any[]) =>
                retryOnFailureWithRotation(sdkClients, (sdk) => value.apply(sdk, args), retries)) as T[keyof T];
        } else {
            wrappedSdk[key as keyof T] = value;
        }
    }

    return wrappedSdk as T;
}
