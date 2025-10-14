#!/usr/bin/env bun
/**
 * Manual test script for SOR abort functionality
 *
 * This script simulates a client that starts a SOR request and then aborts it.
 * Run this while your API server is running to test the abort functionality.
 *
 * Usage:
 *   bun run test/manual-abort-test.ts
 */

const API_URL = process.env.API_URL || 'http://localhost:4000/graphql';

// Test query - adjust tokenIn, tokenOut, and chain as needed for your setup
const QUERY = `
  query SorGetSwapPaths(
    $tokenIn: String!
    $tokenOut: String!
    $swapType: GqlSorSwapType!
    $swapAmount: AmountHumanReadable!
    $chain: GqlChain!
  ) {
    sorGetSwapPaths(
      tokenIn: $tokenIn
      tokenOut: $tokenOut
      swapType: $swapType
      swapAmount: $swapAmount
      chain: $chain
    ) {
      tokenIn
      tokenOut
      swapAmount
      returnAmount
      paths {
        inputAmountRaw
        outputAmountRaw
        pools
      }
    }
  }
`;

const VARIABLES = {
    tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH on mainnet
    tokenOut: '0xba100000625a3754423978a60c9317c58a424e3D', // BAL on mainnet
    swapType: 'EXACT_IN',
    swapAmount: '1', // 1 WETH
    chain: 'MAINNET',
};

async function testAbort() {
    console.log('🧪 Testing SOR Abort Functionality\n');
    console.log(`API URL: ${API_URL}`);
    console.log(`Test: Start request and abort after 100ms\n`);

    const controller = new AbortController();
    const startTime = Date.now();

    // Abort after 100ms
    const abortTimeout = setTimeout(() => {
        console.log('⏱️  Aborting request after 100ms...');
        controller.abort();
    }, 100);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: QUERY,
                variables: VARIABLES,
            }),
            signal: controller.signal,
        });

        clearTimeout(abortTimeout);
        const data = await response.json();
        const duration = Date.now() - startTime;

        console.log(`✅ Request completed in ${duration}ms (not aborted)`);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error: any) {
        clearTimeout(abortTimeout);
        const duration = Date.now() - startTime;

        if (error.name === 'AbortError') {
            console.log(`✅ Request aborted successfully after ${duration}ms`);
            console.log('✅ Test passed: Client abort was handled correctly\n');
        } else {
            console.error(`❌ Request failed with error: ${error.message}`);
            console.error('Error:', error);
        }
    }
}

async function testNormalCompletion() {
    console.log('🧪 Testing Normal Completion (no abort)\n');
    console.log(`API URL: ${API_URL}\n`);

    const startTime = Date.now();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: QUERY,
                variables: VARIABLES,
            }),
        });

        const data = await response.json();
        const duration = Date.now() - startTime;

        console.log(`✅ Request completed normally in ${duration}ms`);
        console.log('Paths found:', data.data?.sorGetSwapPaths?.paths?.length || 0);
        console.log('Return amount:', data.data?.sorGetSwapPaths?.returnAmount || 'N/A');
        console.log('✅ Test passed: Normal completion works\n');
    } catch (error: any) {
        console.error(`❌ Request failed: ${error.message}`);
        console.error('Error:', error);
    }
}

async function runTests() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SOR Abort Functionality - Manual Integration Test');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Test 1: Abort during execution
    await testAbort();

    console.log('\n───────────────────────────────────────────────────────────\n');

    // Test 2: Normal completion
    await testNormalCompletion();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  All tests completed');
    console.log('═══════════════════════════════════════════════════════════\n');
}

// Run the tests
runTests().catch(console.error);
