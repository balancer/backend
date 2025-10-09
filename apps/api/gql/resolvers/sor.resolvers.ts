import { Resolvers } from '../generated-schema';
import { sorService } from '../../../../modules/sor/sor.service';
import { SelectionNode } from 'graphql';
import { env } from '../../../env';

const balancerSdkResolvers: Resolvers = {
    Query: {
        sorGetSwapPaths: async (parent, args, context, info) => {
            if (env.SOR_INSTANCE) {
                return sorService.getSorSwapPaths(args);
            }

            if (env.DEPLOYMENT_ENV === 'canary') {
                const url = `http://sor-internal-75e33c0e4ea5363e.elb.eu-central-1.amazonaws.com/graphql`;

                // Extract the query structure from the GraphQL info object
                const query = info.fieldNodes[0];
                const selections = query.selectionSet?.selections;

                // Build the GraphQL query dynamically based on the requested fields
                const buildQuery = (selections: readonly SelectionNode[]): string => {
                    return selections
                        .map((selection: SelectionNode) => {
                            if (selection.kind === 'Field') {
                                const fieldName = selection.name.value;
                                if (selection.selectionSet) {
                                    const subFields = buildQuery(selection.selectionSet.selections);
                                    return `${fieldName} { ${subFields} }`;
                                }
                                return fieldName;
                            }
                            return '';
                        })
                        .join(' ');
                };

                const requestedFields = selections ? buildQuery(selections) : '';

                // Build arguments string
                const argsString = Object.entries(args)
                    .map(([key, value]) => {
                        if (value === null || value === undefined) return null;

                        // Handle enums (chain, swapType) - these should not be quoted
                        if (key === 'chain' || key === 'swapType') {
                            return `${key}: ${value}`;
                        } else if (typeof value === 'string') {
                            return `${key}: "${value}"`;
                        } else if (Array.isArray(value)) {
                            return `${key}: ${JSON.stringify(value)}`;
                        } else {
                            return `${key}: ${value}`;
                        }
                    })
                    .filter(Boolean)
                    .join(', ');

                const graphqlQuery = `
                    sorGetSwapPaths(${argsString}) {
                        ${requestedFields}
                    }`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: graphqlQuery }),
                });

                const result = (await response.json()) as { data?: { sorGetSwapPathsInternal: any } };
                return result.data?.sorGetSwapPathsInternal;
            } else {
                return sorService.getSorSwapPaths(args);
            }
        },
    },
};

export default balancerSdkResolvers;
