import { blocksSubgraphService } from '../blocks-subgraph/blocks-subgraph.service';
import { masterchefService } from '../masterchef-subgraph/masterchef.service';
import _ from 'lodash';

const NUM_DAYS = 7;

export class HistoricalDataService {
    public async cacheFarmUserData() {
        const blocks = await blocksSubgraphService.getHourlyBlocks(NUM_DAYS);

        for (const block of blocks) {
            const farmUsers = await masterchefService.getAllFarmUsers({
                block: { number: parseInt(block.number) },
            });

            console.log('number of farm users for block', farmUsers.length);
        }
    }
}
