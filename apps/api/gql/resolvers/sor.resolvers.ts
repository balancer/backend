import { QuerySorGetSwapPathsArgs, Resolvers } from '../generated-schema';
import { sorService } from '../../../../modules/sor/sor.service';
import { GraphQLResolveInfo, print } from 'graphql';
import { env } from '../../../env';

const TIMEOUT = 10_000;

const handleSorCall = async (args: QuerySorGetSwapPathsArgs, abortController: AbortController) => {
    // Terminate after 10 seconds
    const abortTimeout = setTimeout(() => {
        abortController.abort();
    }, TIMEOUT);

    try {
        const response = await sorService.getSorSwapPaths(args, abortController.signal);
        clearTimeout(abortTimeout);
        return response;
    } catch (error: any) {
        clearTimeout(abortTimeout);
        if (error.name === 'SorAbortError') {
            throw new Error('Request aborted: The operation timed out after 10s.');
        } else {
            throw new Error('Request aborted: The operation was cancelled.');
        }
    }
};

const handleProxyRequest = async (
    args: QuerySorGetSwapPathsArgs,
    info: GraphQLResolveInfo,
    abortController: AbortController,
) => {
    const url = env.SOR_SERVICE_URL;

    // Use graphql-js print() to convert the original operation to a string
    const query = print(info.operation);

    // Create a promise that rejects on timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            abortController.abort();
            reject(new Error('Request aborted: The operation timed out.'));
        }, TIMEOUT);
    });

    // Create the fetch promise
    const fetchPromise = (async () => {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                variables: args,
                operationName: info.operation.name?.value,
            }),
            signal: abortController.signal,
        });

        const responseData = (await response.json()) as any;

        if (responseData.errors) {
            const error = responseData.errors.map((e: any) => e.message).join(';');
            throw new Error(`Request failed: ${error}`);
        }

        // Get the field name from the query (handles aliases)
        const fieldNode = info.fieldNodes[0];
        const responseFieldName = fieldNode.alias?.value || fieldNode.name.value;

        return responseData.data?.[responseFieldName];
    })();

    return Promise.race([fetchPromise, timeoutPromise]);
};

const balancerSdkResolvers: Resolvers = {
    Query: {
        sorGetSwapPaths: async (parent, args, context, info) => {
            // Create AbortSignal from request
            const abortController = new AbortController();
            context.req.on('close', () => {
                abortController.abort();
            });

            if (env.SOR_INSTANCE) {
                return handleSorCall(args, abortController);
            }

            if (env.DEPLOYMENT_ENV === 'canary') {
                return handleProxyRequest(args, info, abortController);
            }

            return handleSorCall(args, abortController);
        },
    },
};

export default balancerSdkResolvers;
