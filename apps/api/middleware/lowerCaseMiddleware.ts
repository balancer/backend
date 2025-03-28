import { NextFunction, Request, Response, json } from 'express';
import { parse, print, visit } from 'graphql';

const LOWER_REGEX =
    /id|poolId|poolIdIn|address|addresses|userAddress|tokensIn|tokensNotIn|tokenInIn|tokenOutIn|tokenIn|tokenOut|idIn|idNotIn/;

const UPPER_REGEX = /categories/;

// Recursively convert values of poolId, address, id to lowercase
// Used when passing variables to queries
const convertLetterCase = (obj: Record<string, any>) => {
    for (let key in obj) {
        if (typeof obj[key] === 'string' && LOWER_REGEX.test(key)) {
            obj[key] = obj[key].toLowerCase();
        } else if (typeof obj[key] === 'string' && UPPER_REGEX.test(key)) {
            obj[key] = obj[key].toUpperCase();
        } else if (Array.isArray(obj[key]) && LOWER_REGEX.test(key)) {
            obj[key] = obj[key].map((item: string) => item.toLowerCase());
        } else if (Array.isArray(obj[key]) && UPPER_REGEX.test(key)) {
            obj[key] = obj[key].map((item: string) => item.toUpperCase());
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            convertLetterCase(obj[key]);
        }
    }
};

const casedQueryParams = (query: string): string => {
    // Parse the query into an AST
    const ast = parse(query);

    // Visit each node in the AST
    const modifiedAst = visit(ast, {
        ObjectField(node) {
            if (node.value.kind === 'ListValue' && LOWER_REGEX.test(node.name.value)) {
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
            } else if (node.value.kind === 'ListValue' && UPPER_REGEX.test(node.name.value)) {
                const values = node.value.values.map((value) => {
                    if (value.kind === 'StringValue') {
                        return {
                            ...value,
                            value: value.value.toUpperCase(),
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
            if (LOWER_REGEX.test(node.name.value)) {
                if (node.value.kind === 'StringValue') {
                    // Convert the argument value to lowercase
                    const value = node.value.value.toLowerCase();
                    return {
                        ...node,
                        value: {
                            ...node.value,
                            value,
                        },
                    };
                } else if (node.value.kind === 'ListValue') {
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
            } else if (UPPER_REGEX.test(node.name.value)) {
                if (node.value.kind === 'StringValue') {
                    // Convert the argument value to lowercase
                    const value = node.value.value.toUpperCase();
                    return {
                        ...node,
                        value: {
                            ...node.value,
                            value,
                        },
                    };
                } else if (node.value.kind === 'ListValue') {
                    const values = node.value.values.map((value) => {
                        if (value.kind === 'StringValue') {
                            return {
                                ...value,
                                value: value.value.toUpperCase(),
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
            try {
                const { query, variables } = req.body;

                if (variables) {
                    convertLetterCase(variables);
                }

                if (query) {
                    // Replacing the original query with the lowercase one
                    req.body.query = casedQueryParams(query);
                }
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
}
