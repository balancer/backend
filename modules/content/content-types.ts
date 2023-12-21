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
    chainId: number;
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
    getFeaturedPoolGroups(chainIds: string[]): Promise<HomeScreenFeaturedPoolGroup[]>;
    getNewsItems(): Promise<HomeScreenNewsItem[]>;
}
