import graphqlFields from 'graphql-fields';
import { GraphQLResolveInfo } from 'graphql';

type PrismaSelect = Record<string, true | PrismaQuery>;
type PrismaInclude = Record<string, PrismaQuery>;

export interface PrismaQuery {
    select?: PrismaSelect;
    include?: PrismaInclude;
}

type FieldMapping = {
    [graphQLField: string]:
        | string // flat field mapping
        | FieldMapping; // nested
};

type IncludeMapping = {
    _relationName?: string; // Special property to indicate a different relation name
    [graphQLField: string]: string | IncludeMapping | undefined; // recursive structure for includes
};

/**
 * Converts GraphQL query info into a Prisma `select` and `include` object,
 * with support for:
 * - JSON fields (include if any subfield is queried)
 * - Field renames
 * - Includes via a nested include mapping
 * - Include relation name remapping (e.g., "poolTokens" -> "tokens")
 */
export function graphqlToPrismaQuery(
    info: GraphQLResolveInfo,
    fieldMap: FieldMapping = {},
    jsonFields: string[] = [],
    includeMap: IncludeMapping = {},
): PrismaQuery {
    const rawFields = graphqlFields(info);
    return processFields(rawFields, fieldMap, jsonFields, includeMap);
}

function processFields(
    fields: any,
    mapping: FieldMapping,
    jsonFields: string[],
    includeMap: IncludeMapping,
): PrismaQuery {
    const select: PrismaSelect = {};
    const include: PrismaInclude = {};

    for (const key in fields) {
        const subFields = fields[key] || {};
        const isLeaf = Object.keys(subFields).length === 0;

        const mapped = mapping?.[key];
        const jsonMatch = jsonFields.includes(key);
        const includeMatch = includeMap?.[key];

        if (jsonMatch) {
            select[key] = true;
        } else if (typeof mapped === 'string') {
            select[mapped] = true;
        } else if (typeof mapped === 'object') {
            const nested = processFields(subFields, mapped, jsonFields, (includeMatch as IncludeMapping) || {});
            select[key] = { select: nested.select };
            if (nested.include) {
                select[key]['include'] = nested.include;
            }
        } else if (includeMatch) {
            // Extract _relationName if present from the includeMatch, not the top level includeMap
            const relationName =
                typeof includeMatch === 'object' && '_relationName' in includeMatch ? includeMatch._relationName : key;

            // Create a cleaned mapping without the _relationName property
            const cleanedIncludeMatch = typeof includeMatch === 'object' ? { ...includeMatch } : {};
            if (typeof cleanedIncludeMatch === 'object' && '_relationName' in cleanedIncludeMatch) {
                delete cleanedIncludeMatch._relationName;
            }

            const nested = processFields(subFields, {}, jsonFields, cleanedIncludeMatch as IncludeMapping);
            include[relationName as string] = nested;
        } else if (isLeaf) {
            select[key] = true;
        } else {
            const nested = processFields(subFields, {}, jsonFields, {});
            select[key] = { select: nested.select };
            if (nested.include) {
                select[key]['include'] = nested.include;
            }
        }
    }

    const result: PrismaQuery = { select };
    if (Object.keys(include).length > 0) {
        result.include = include;
    }

    return result;
}
