const axios = require('axios');
const fs = require('fs');

async function debugScraping(url) {
    console.log(`Debugging scraping for: ${url}`);
    try {
        const response = await axios.get(`https://r.jina.ai/${encodeURIComponent(url.trim())}`, {
            timeout: 60000,
            headers: {
                'X-Return-Format': 'html'
            }
        });
        const content = response.data;
        fs.writeFileSync('scraped_debug.html', content);
        console.log('Content saved to scraped_debug.html');

        // Search for host-related keywords and classes
        const keywords = ['host-profile', 'js-k2-hp--block', 'Iván Rodríguez', '¡Hola! Soy Iván'];
        console.log('\n--- Keyword Search Results ---');
        keywords.forEach(kw => {
            const index = content.toLowerCase().indexOf(kw.toLowerCase());
            if (index !== -1) {
                console.log(`Found "${kw}" at position ${index}`);
                console.log(`Context: ...${content.substring(index - 50, index + 100)}...`);
            } else {
                console.log(`"${kw}" not found`);
            }
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

const targetUrl = 'https://www.booking.com/hotel/es/alto-de-torremar-torremar-natura-vera-fkk.es.html';
debugScraping(targetUrl);
