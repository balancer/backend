import { GraphQLResolveInfo } from 'graphql';

export const logResolver =
    (resolver: any) =>
    async (parent: any, args: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
        console.log(`${new Date().toISOString()},${info.fieldName},${context['ip']}`, JSON.stringify(args));

        // Call the original resolver
        const result = await resolver(parent, args, context, info);

        return result;
    };
