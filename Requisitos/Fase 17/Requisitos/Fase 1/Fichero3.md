// app/api/search-manual/route.ts
import axios from 'axios';

export async function POST(req: Request) {
  const { brand, model, applianceType } = await req.json();
  
  // Brave Search API
  const searchQuery = `${brand} ${model} ${applianceType} manual usuario PDF`;
  
  const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
    headers: {
      'X-Subscription-Token': process.env.BRAVE_API_KEY
    },
    params: {
      q: searchQuery,
      count: 5
    }
  });
  
  // Filtrar resultados con PDFs o páginas de soporte
  const relevantUrls = response.data.web.results
    .filter(r => 
      r.url.includes('.pdf') || 
      r.url.includes('manual') || 
      r.url.includes('support')
    )
    .slice(0, 3);
    
  return Response.json({ urls: relevantUrls });
}