import beetsResolver from './resolvers/beets.resolvers';
import poolResolver from './resolvers/pool.resolvers';
import protocolResolver from './resolvers/protocol.resolvers';
import scalarResolver from './resolvers/scalar.resolvers';
import stsResolver from './resolvers/sts.resolvers';
import sorResolver from './resolvers/sor.resolvers';
import tokenResolver from './resolvers/token.resolvers';
import userResolver from './resolvers/user.resolvers';
import vebalResolver from './resolvers/vebal.resolvers';
import lbpResolver from './resolvers/lbp.resolvers';
import loopsResolver from './resolvers/loops.resolvers';

export const resolvers = {
    Query: {
        ...beetsResolver.Query,
        ...poolResolver.Query,
        ...protocolResolver.Query,
        ...scalarResolver.Query,
        ...stsResolver.Query,
        ...sorResolver.Query,
        ...tokenResolver.Query,
        ...userResolver.Query,
        ...vebalResolver.Query,
        ...lbpResolver.Query,
        ...loopsResolver.Query,
    },
    Mutation: {
        ...poolResolver.Mutation,
        ...protocolResolver.Mutation,
        ...sorResolver.Mutation,
        ...tokenResolver.Mutation,
        ...userResolver.Mutation,
        ...vebalResolver.Mutation,
        ...lbpResolver.Mutation,
    },
};
