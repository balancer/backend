import { graphqlToPrismaQuery } from './gql-to-prisma';
import { GraphQLResolveInfo, parse, Kind, FragmentDefinitionNode } from 'graphql';

/**
 * Creates a minimal GraphQLResolveInfo object from a GraphQL query string
 * that's sufficient for graphqlFields to extract the selection set
 */
function createResolveInfoFromQuery(queryString: string): GraphQLResolveInfo {
    const parsedQuery = parse(queryString);
    const operationDefinition = parsedQuery.definitions.find((def) => def.kind === Kind.OPERATION_DEFINITION);

    if (!operationDefinition || operationDefinition.kind !== Kind.OPERATION_DEFINITION) {
        throw new Error('Expected an operation definition');
    }

    // For a query like `query { poolGetPool(id: "0x123") { id name } }`,
    // we want to get the selection set for poolGetPool
    const selections = operationDefinition.selectionSet.selections;
    const queryField = selections.find((s) => s.kind === Kind.FIELD && s.selectionSet);

    if (!queryField || queryField.kind !== Kind.FIELD || !queryField.selectionSet) {
        throw new Error('Expected a query field with selections');
    }

    // Extract all fragment definitions and create a map of name -> definition
    const fragmentDefinitions = parsedQuery.definitions.filter(
        (def) => def.kind === Kind.FRAGMENT_DEFINITION,
    ) as FragmentDefinitionNode[];

    const fragments: Record<string, FragmentDefinitionNode> = {};
    fragmentDefinitions.forEach((fragmentDef) => {
        fragments[fragmentDef.name.value] = fragmentDef;
    });

    // Create the minimal structure needed for graphqlFields
    const info = {
        fieldNodes: [
            {
                kind: Kind.FIELD,
                name: {
                    kind: Kind.NAME,
                    value: queryField.name.value,
                },
                selectionSet: queryField.selectionSet,
            },
        ],
        fragments: fragments,
        schema: {} as any,
        fieldName: queryField.name.value,
        returnType: {} as any,
        parentType: {} as any,
        path: {} as any,
        rootValue: {} as any,
        operation: operationDefinition,
        variableValues: {},
    } as GraphQLResolveInfo;

    return info;
}

describe('graphqlToPrismaQuery', () => {
    it('should handle basic field selection', () => {
        const query = `
      query {
        poolGetPool(id: "0x123") {
          id
          name
          symbol
        }
      }
    `;

        const info = createResolveInfoFromQuery(query);
        const result = graphqlToPrismaQuery(info);

        expect(result).toEqual({
            select: {
                id: true,
                name: true,
                symbol: true,
            },
        });
    });

    it('should handle nested field selection', () => {
        const query = `
      query {
        poolGetPool(id: "0x123") {
          id
          dynamicData {
            totalLiquidity
            swapFee
          }
        }
      }
    `;

        const info = createResolveInfoFromQuery(query);
        const result = graphqlToPrismaQuery(info);

        expect(result).toEqual({
            select: {
                id: true,
                dynamicData: {
                    select: {
                        totalLiquidity: true,
                        swapFee: true,
                    },
                },
            },
        });
    });

    it('should handle field mapping', () => {
        const query = `
      query {
        poolGetPool(id: "0x123") {
          id
          name
          graphqlField
        }
      }
    `;

        const info = createResolveInfoFromQuery(query);
        const fieldMapping = {
            graphqlField: 'dbField',
        };

        const result = graphqlToPrismaQuery(info, fieldMapping);

        expect(result).toEqual({
            select: {
                id: true,
                name: true,
                dbField: true,
            },
        });
    });

    it('should handle nested field mapping', () => {
        const query = `
      query {
        poolGetPool(id: "0x123") {
          id
          userData {
            balance
            staked
          }
        }
      }
    `;

        const info = createResolveInfoFromQuery(query);
        const fieldMapping = {
            userData: {
                balance: 'userBalance',
                staked: 'userStaked',
            },
        };

        const result = graphqlToPrismaQuery(info, fieldMapping);

        expect(result).toEqual({
            select: {
                id: true,
                userData: {
                    select: {
                        userBalance: true,
                        userStaked: true,
                    },
                },
            },
        });
    });

    it('should handle JSON fields', () => {
        const query = `
      query {
        poolGetPool(id: "0x123") {
          id
          jsonData {
            nestedField1
            nestedField2
          }
        }
      }
    `;

        const info = createResolveInfoFromQuery(query);
        const jsonFields = ['jsonData'];

        const result = graphqlToPrismaQuery(info, {}, jsonFields);

        expect(result).toEqual({
            select: {
                id: true,
                jsonData: true,
            },
        });
    });

    it('should handle include relationships', () => {
        const query = `
      query {
        poolGetPool(id: "0x123") {
          id
          tokens {
            id
            address
          }
        }
      }
    `;

        const info = createResolveInfoFromQuery(query);
        const includeMap = {
            tokens: {},
        };

        const result = graphqlToPrismaQuery(info, {}, [], includeMap);

        expect(result).toEqual({
            select: {
                id: true,
            },
            include: {
                tokens: {
                    select: {
                        id: true,
                        address: true,
                    },
                },
            },
        });
    });

    it('should handle complex nested structure with includes', () => {
        const query = `
      query {
        poolGetPool(id: "0x123") {
          id
          name
          poolTokens {
            address
            balance
            nestedPool {
              id
              tokens {
                id
                symbol
              }
            }
          }
        }
      }
    `;

        const info = createResolveInfoFromQuery(query);
        const includeMap = {
            poolTokens: {
                nestedPool: {
                    tokens: {},
                },
            },
        };

        const result = graphqlToPrismaQuery(info, {}, [], includeMap);

        expect(result).toEqual({
            select: {
                id: true,
                name: true,
            },
            include: {
                poolTokens: {
                    select: {
                        address: true,
                        balance: true,
                    },
                    include: {
                        nestedPool: {
                            select: {
                                id: true,
                            },
                            include: {
                                tokens: {
                                    select: {
                                        id: true,
                                        symbol: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    });

    it('should handle a schema-based complex pool query', () => {
        // Query using actual schema types
        const query = `
      query {
        poolGetPool(id: "0x123", chain: ETHEREUM) {
          id
          chain
          name
          address
          poolTokens {
            id
            address
            balance
            weight
            nestedPool {
              id
              tokens {
                address
                symbol
              }
            }
          }
          dynamicData {
            swapFee
            totalLiquidity
            totalShares
            aprItems {
              id
              title
              apr
            }
          }
        }
      }
    `;

        const info = createResolveInfoFromQuery(query);
        const result = graphqlToPrismaQuery(info);

        expect(result).toEqual({
            select: {
                id: true,
                chain: true,
                name: true,
                address: true,
                poolTokens: {
                    select: {
                        id: true,
                        address: true,
                        balance: true,
                        weight: true,
                        nestedPool: {
                            select: {
                                id: true,
                                tokens: {
                                    select: {
                                        address: true,
                                        symbol: true,
                                    },
                                },
                            },
                        },
                    },
                },
                dynamicData: {
                    select: {
                        swapFee: true,
                        totalLiquidity: true,
                        totalShares: true,
                        aprItems: {
                            select: {
                                id: true,
                                title: true,
                                apr: true,
                            },
                        },
                    },
                },
            },
        });
    });

    it('should handle poolEvents query with filtering based on schema', () => {
        const query = `
      query {
        poolEvents(
          first: 10, 
          skip: 0, 
          where: { 
            chainIn: [ETHEREUM], 
            typeIn: [SWAP] 
          }
        ) {
          id
          chain
          type
          tx
          valueUSD
          timestamp
          ... on GqlPoolSwapEventV3 {
            tokenIn {
              address
              amount
              valueUSD
            }
            tokenOut {
              address
              amount
              valueUSD
            }
          }
        }
      }
    `;

        const info = createResolveInfoFromQuery(query);
        const result = graphqlToPrismaQuery(info);

        expect(result).toEqual({
            select: {
                id: true,
                chain: true,
                type: true,
                tx: true,
                valueUSD: true,
                timestamp: true,
                tokenIn: {
                    select: {
                        address: true,
                        amount: true,
                        valueUSD: true,
                    },
                },
                tokenOut: {
                    select: {
                        address: true,
                        amount: true,
                        valueUSD: true,
                    },
                },
            },
        });
    });

    it('should handle query with fragments', () => {
        const query = `
      query {
        poolGetPool(id: "0x123") {
          id
          name
          ...PoolDetails
          poolTokens {
            id
            address
            ...TokenDetails
          }
        }
      }
      
      fragment PoolDetails on GqlPoolWeighted {
        type
        chain
        swapFeeManager
      }
      
      fragment TokenDetails on GqlPoolTokenDetail {
        balance
        weight
        decimals
      }
    `;

        // We need to manually handle fragments since our utility doesn't
        // But for this test we know what fields are included
        const info = createResolveInfoFromQuery(query);

        const includes = {
            poolTokens: {},
        };

        // Since our utility doesn't process fragments, we'll simulate the expected result
        // In a real implementation, GraphQL would handle fragment spreading
        const result = graphqlToPrismaQuery(info, {}, [], includes);

        // This is what we'd expect after fragments are processed
        expect(result).toEqual({
            select: {
                id: true,
                name: true,
                // From PoolDetails fragment (would normally be processed by GraphQL)
                type: true,
                chain: true,
                swapFeeManager: true,
            },
            include: {
                poolTokens: {
                    select: {
                        id: true,
                        address: true,
                        // From TokenDetails fragment (would normally be processed by GraphQL)
                        balance: true,
                        weight: true,
                        decimals: true,
                    },
                },
            },
        });
    });

    it('should handle query with variables', () => {
        const query = `
      query GetPool($poolId: String!, $chain: GqlChain) {
        poolGetPool(id: $poolId, chain: $chain) {
          id
          name
          symbol
          type
          poolTokens {
            id
            address
            balance
          }
        }
      }
    `;

        // Variables don't affect the selection set, so our mocked info works fine
        const info = createResolveInfoFromQuery(query);
        const result = graphqlToPrismaQuery(info);

        expect(result).toEqual({
            select: {
                id: true,
                name: true,
                symbol: true,
                type: true,
                poolTokens: {
                    select: {
                        id: true,
                        address: true,
                        balance: true,
                    },
                },
            },
        });
    });

    it('should handle a query with union types based on schema', () => {
        const query = `
      query {
        poolGetPool(id: "0x123") {
          id
          name
          ... on GqlPoolWeighted {
            tokens {
              address
              weight
            }
          }
          ... on GqlPoolStable {
            tokens {
              address
              balance
            }
            amp
          }
        }
      }
    `;

        const info = createResolveInfoFromQuery(query);
        const result = graphqlToPrismaQuery(info);

        // For union types, all requested fields across types would be included
        expect(result).toEqual({
            select: {
                id: true,
                name: true,
                tokens: {
                    select: {
                        address: true,
                        weight: true,
                        balance: true,
                    },
                },
                amp: true,
            },
        });
    });

    it('should handle relation name remapping with _relationName', () => {
        const query = `
      query {
        poolGetPool(id: "0x123") {
          id
          name
          poolTokens {
            id
            address
            weight
          }
        }
      }
    `;

        const info = createResolveInfoFromQuery(query);
        const includeMap = {
            poolTokens: {
                _relationName: 'tokens', // Map the GraphQL field 'poolTokens' to Prisma relation 'tokens'
            },
        };

        const result = graphqlToPrismaQuery(info, {}, [], includeMap);

        expect(result).toEqual({
            select: {
                id: true,
                name: true,
            },
            include: {
                tokens: {
                    // Should use 'tokens' instead of 'poolTokens'
                    select: {
                        id: true,
                        address: true,
                        weight: true,
                    },
                },
            },
        });
    });

    it('should handle nested relation name remapping', () => {
        const query = `
      query {
        poolGetPool(id: "0x123") {
          id
          name
          poolTokens {
            id
            address
            nestedTokenInfo {
              decimals
              symbol
            }
          }
        }
      }
    `;

        const info = createResolveInfoFromQuery(query);
        const includeMap = {
            poolTokens: {
                _relationName: 'tokens',
                nestedTokenInfo: {
                    _relationName: 'tokenData',
                },
            },
        };

        const result = graphqlToPrismaQuery(info, {}, [], includeMap);

        expect(result).toEqual({
            select: {
                id: true,
                name: true,
            },
            include: {
                tokens: {
                    select: {
                        id: true,
                        address: true,
                    },
                    include: {
                        tokenData: {
                            select: {
                                decimals: true,
                                symbol: true,
                            },
                        },
                    },
                },
            },
        });
    });
});
