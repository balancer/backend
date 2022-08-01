import * as Sentry from '@sentry/node';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { ApolloError } from 'apollo-server-express';
import { Context } from './gql-context';

export const sentryPlugin: ApolloServerPlugin<Context> = {
    async requestDidStart({ request, context }) {
        let name = request.operationName;
        if (!name) {
            name = request.query
                ?.substring(request.query?.indexOf('{') + 1, request.query?.indexOf('(') || request.query?.length)
                .replace(/\n/g, '')
                .replace(/\s/g, '');
        }

        context.transaction.setName(name || 'gql');
        return {
            async willSendResponse({ context }) {
                context.transaction.finish();
            },
            async didEncounterErrors(ctx) {
                // If we couldn't parse the operation, don't
                // do anything here
                if (!ctx.operation) {
                    return;
                }

                for (const err of ctx.errors) {
                    // Only report internal server errors,
                    // all errors extending ApolloError should be user-facing
                    if (err instanceof ApolloError) {
                        continue;
                    }

                    // Add scoped report details and send to Sentry
                    Sentry.withScope((scope) => {
                        // Annotate whether failing operation was query/mutation/subscription
                        scope.setTag('kind', ctx.operation?.operation);

                        // Log query and variables as extras (make sure to strip out sensitive data!)
                        scope.setContext('query', {
                            query: ctx.request?.query,
                            variables: ctx.request?.variables,
                        });

                        if (err.path) {
                            // We can also add the path as breadcrumb
                            scope.addBreadcrumb({
                                category: 'query-path',
                                message: err.path.join(' > '),
                                level: 'debug',
                            });
                        }

                        const transactionId = ctx.request.http?.headers.get('x-transaction-id');
                        if (transactionId) {
                            scope.setTransactionName(transactionId);
                        } else {
                            scope.setTransactionName(name);
                        }

                        Sentry.captureException(err);
                    });
                }
            },
        };
    },
};
