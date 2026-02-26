import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        if (data.models) {
            console.log('Available Model Names:');
            data.models.forEach((m: any) => console.log(` - ${m.name}`));
        } else {
            console.log('Error or no models found:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
