import { Chain } from '@prisma/client';
import { GqlChain } from '../../schema';

export interface ConfigHomeScreen {
    featuredPoolGroups: HomeScreenFeaturedPoolGroup[];
    newsItems: HomeScreenNewsItem[];
}

export interface HomeScreenFeaturedPoolGroup {
    _key: string;
    _type: string;
    icon: string;
    id: string;
    items: (HomeScreenFeaturedPoolGroupItemPoolId | HomeScreenFeaturedPoolGroupItemExternalLink)[];
    title: string;
    primary: boolean;
    chain: GqlChain;
}

interface HomeScreenFeaturedPoolGroupItemPoolId {
    _key: string;
    _type: 'homeScreenFeaturedPoolGroupPoolId';
    poolId: string;
}

interface HomeScreenFeaturedPoolGroupItemExternalLink {
    _key: string;
    _type: 'homeScreenFeaturedPoolGroupExternalLink';
    id: string;
    buttonText: string;
    buttonUrl: string;
    image: string;
}

export interface HomeScreenNewsItem {
    id: string;
    timestamp: string;
    source: 'twitter' | 'medium' | 'discord';
    url: string;
    text: string;
    image?: string;
}

export interface ContentService {
    syncTokenContentData(): Promise<void>;
    syncPoolContentData(): Promise<void>;
    getFeaturedPoolGroups(chains: Chain[]): Promise<HomeScreenFeaturedPoolGroup[]>;
    getNewsItems(): Promise<HomeScreenNewsItem[]>;
}
