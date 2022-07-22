import { ApolloServerPlugin } from 'apollo-server-plugin-base';

const plugin: ApolloServerPlugin<Express.Context> = {
    async requestDidStart({ request, context }) {
        if (request.operationName) {
            // set the transaction Name if we have named queries
            //@ts-ignore
            context.transaction.setName(request.operationName);
        }
        return {
            async willSendResponse({ context }) {
                // hook for transaction finished
                //@ts-ignore
                context.transaction.finish();
            },
            async executionDidStart() {
                return {
                    willResolveField({ context, info }) {
                        // hook for each new resolver
                        const span = context.transaction.startChild({
                            op: 'resolver',
                            description: `${info.parentType.name}.${info.fieldName}`,
                        });
                        return () => {
                            // this will execute once the resolver is finished
                            span.finish();
                        };
                    },
                };
            },
        };
    },
};

export default plugin;
