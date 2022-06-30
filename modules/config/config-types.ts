export interface ConfigHomeScreen {
    chainId: number;
    featuredPoolGroups: HomeScreenFeaturedPoolGroup[];
    newsItems: HomeScreenNewsItem[];
}

interface HomeScreenFeaturedPoolGroup {
    _key: string;
    _type: string;
    icon: string;
    id: string;
    items: (HomeScreenFeaturedPoolGroupItemPoolId | HomeScreenFeaturedPoolGroupItemExternalLink)[];
    title: string;
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

interface HomeScreenNewsItem {
    id: string;
    timestamp: string;
    source: 'twitter' | 'medium' | 'discord';
    url: string;
    text: string;
    image?: string;
}
