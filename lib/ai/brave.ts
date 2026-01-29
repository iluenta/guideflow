import axios from 'axios';

export async function searchBrave(query: string, count: number = 5) {
    let retries = 0;
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    while (retries <= maxRetries) {
        try {
            const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip',
                    'X-Subscription-Token': process.env.BRAVE_API_KEY
                },
                params: {
                    q: query,
                    count: count
                }
            });

            return response.data.web?.results || [];
        } catch (error: any) {
            if (error.response?.status === 429 && retries < maxRetries) {
                console.warn(`[BRAVE-SEARCH] Rate limited (429). Retrying in ${1000 * (retries + 1)}ms...`);
                await delay(1000 * (retries + 1));
                retries++;
                continue;
            }
            console.error('[BRAVE-SEARCH] Web search error:', error.message || error);
            return [];
        }
    }
    return [];
}

export function formatBraveResults(results: any[]) {
    return results.map(r => `TITULO: ${r.title}\nURL: ${r.url}\nDESCRIPCION: ${r.description}`).join('\n---\n');
}
