import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        console.error("GOOGLE_AI_API_KEY not found");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const models = await genAI.listModels();
        console.log("Available models:");
        models.models.forEach(m => console.log(`- ${m.name} (Supports: ${m.supportedGenerationMethods.join(', ')})`));
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
