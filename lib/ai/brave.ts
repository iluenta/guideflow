import axios from 'axios';

export async function searchBrave(query: string, count: number = 5, extraSnippets: boolean = true) {
    let retries = 0;
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    while (retries <= maxRetries) {
        try {
            const url = 'https://api.search.brave.com/res/v1/web/search';
            const params = {
                q: query,
                count: count,
                extra_snippets: extraSnippets ? 1 : 0
            };

            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip',
                    'X-Subscription-Token': process.env.BRAVE_API_KEY
                },
                params: params
            });

            return response.data.web?.results || [];
        } catch (error: any) {
            const isRateLimit = error.response?.status === 429;
            if (isRateLimit && retries < maxRetries) {
                const backoff = Math.pow(2, retries) * 2000;
                console.warn(`[BRAVE-SEARCH] Rate limited (429). Retrying in ${backoff}ms...`);
                await delay(backoff);
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
    return results.map(r => {
        const extra = r.extra_snippets ? `\nDETALLES ADICIONALES: ${r.extra_snippets.join(' ')}` : '';
        return `TITULO: ${r.title}\nURL: ${r.url}\nDESCRIPCION: ${r.description}${extra}`;
    }).join('\n---\n');
}
