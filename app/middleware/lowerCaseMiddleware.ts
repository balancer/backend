import { NextFunction, Request, Response, json } from 'express';
import { parse, print, visit } from 'graphql';

const PARAMS_REGEX =
    /id|poolId|poolIdIn|address|addresses|userAddress|tokensIn|tokensNotIn|tokenInIn|tokenOutIn|tokenIn|tokenOut|idIn|idNotIn/i;

// Recursively convert values of poolId, address, id to lowercase
// Used when passing variables to queries
const convertToLowerCase = (obj: Record<string, any>) => {
    for (let key in obj) {
        if (typeof obj[key] === 'string' && PARAMS_REGEX.test(key)) {
            obj[key] = obj[key].toLowerCase();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            convertToLowerCase(obj[key]);
        }
    }
};

const lowerCaseQueryParams = (query: string): string => {
    // Parse the query into an AST
    const ast = parse(query);

    // Visit each node in the AST
    const modifiedAst = visit(ast, {
        ObjectField(node) {
            if (node.value.kind === 'ListValue' && PARAMS_REGEX.test(node.name.value)) {
                const values = node.value.values.map((value) => {
                    if (value.kind === 'StringValue') {
                        return {
                            ...value,
                            value: value.value.toLowerCase(),
                        };
                    }
                    return value;
                });
                return {
                    ...node,
                    value: {
                        ...node.value,
                        values,
                    },
                };
            }
        },
        Argument(node) {
            if (PARAMS_REGEX.test(node.name.value)) {
                if (node.value.kind === 'StringValue') {
                    // Convert the argument value to lowercase
                    const lowercasedValue = node.value.value.toLowerCase();
                    return {
                        ...node,
                        value: {
                            ...node.value,
                            value: lowercasedValue,
                        },
                    };
                }
            }
            return node;
        },
    });

    // Convert the modified AST back to a query string
    return print(modifiedAst);
};

/**
 * Middleware to convert all query parameters to lowercase.
 * This middleware is useful when the database query is implementend with case-sensitive filters.
 * It ensures that the query parameters 'poolId', 'address', and 'id' are converted to lowercase.
 *
 * @param req The request object
 * @param res The response object
 * @param next The next function
 */
export async function lowerCaseMiddleware(req: Request, res: Response, next: NextFunction) {
    json()(req, res, (err) => {
        if (req.method === 'POST' && req.is('application/json') && req.body) {
            const { query, variables } = req.body;

            if (variables) {
                convertToLowerCase(variables);
            }

            if (query) {
                // Replacing the original query with the lowercase one
                req.body.query = lowerCaseQueryParams(query);
            }
        }

        next();
    });
}
