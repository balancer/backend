import { Resolvers } from '../../schema';
import { votingListService } from './voting-list.service';

const resolvers: Resolvers = {
    Query: {
        veBalVotingList: async () => {
            return votingListService.getList();
        },
    },
};

export default resolvers;
