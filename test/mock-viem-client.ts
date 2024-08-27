type MulticallContract = {
    address: string;
    abi: any;
    functionName: string;
    args?: any[];
};

export class MockViemClient {
    private multicallResults: any[][] = [];
    private readContractResults: Map<string, any> = new Map();
    private multicallIndex: number = 0;

    mockMulticallResult(result: any[]) {
        this.multicallResults.push(result);
    }

    mockReadContractResult(functionName: string, result: any) {
        this.readContractResults.set(functionName, result);
    }

    async multicall({ contracts }: { contracts: MulticallContract[] }) {
        if (this.multicallIndex >= this.multicallResults.length) {
            throw new Error('Not enough mock results provided for multicall');
        }

        const currentResults = this.multicallResults[this.multicallIndex];
        this.multicallIndex++;

        return contracts.map((_, index) => ({
            status: 'success',
            result: currentResults[index],
        }));
    }

    async readContract({ functionName }: { functionName: string }) {
        const result = this.readContractResults.get(functionName);
        if (result === undefined) {
            throw new Error(`No mock result provided for readContract function: ${functionName}`);
        }
        return result;
    }

    // Reset all mocks
    reset() {
        this.multicallResults = [];
        this.readContractResults.clear();
        this.multicallIndex = 0;
    }
}
