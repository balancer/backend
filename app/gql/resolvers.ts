import { loadFilesSync } from '@graphql-tools/load-files';
import path from 'path';
import { mergeResolvers } from '@graphql-tools/merge';

const resolversArray = loadFilesSync(path.join(__dirname, '../modules/**/*.resolvers.*'));
export const resolvers = mergeResolvers(resolversArray);
