const CATEGORIES_BASE = 'https://raw.githubusercontent.com/balancer/metadata/main/pools/categories/';
const CATEGORIES_URL = CATEGORIES_BASE + 'index.json';

type CategoryItem = {
    id: string;
    name: string;
    file: string;
};

export const getPoolCategories = async (): Promise<{ [id: string]: string[] }> => {
    const response = await fetch(CATEGORIES_URL);
    const categoriesList = (await response.json()) as CategoryItem[];

    // Fetch all category files concurrently and parse the data
    const metadataEntries = await Promise.all(
        categoriesList.map(async ({ id, name, file }) => {
            try {
                const response = await fetch(CATEGORIES_BASE + file);
                const data = (await response.json()) as string[];
                return [id, data] as [string, string[]];
            } catch (e) {
                console.error(`Failed to fetch category file for: ${name}`);
                return [id, []] as [string, string[]];
            }
        }),
    );

    const metadata = Object.fromEntries(metadataEntries);

    // Transform the metadata to the desired format
    const transformed: Record<string, string[]> = {};

    for (const [category, ids] of Object.entries(metadata)) {
        ids.forEach((id) => {
            if (!transformed[id]) {
                transformed[id] = [];
            }
            transformed[id].push(category);
        });
    }

    return transformed;
};
