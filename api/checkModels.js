const fetch = require('node-fetch');

// PASTE YOUR FULL GEMINI API KEY INSIDE THE QUOTES BELOW
const API_KEY = "paste your key";

async function listModels() {
    const url = 'https://generativelanguage.googleapis.com/v1/models?key=' + API_KEY;

    try {
        console.log("Asking Google AI for a list of your compatible models...");
        const response = await fetch(url);
        const data = await response.json();
        
        console.log("\n--- Your Compatible Models ---");
        if (data.models && data.models.length > 0) {
            data.models.forEach(model => {
                if (model.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${model.name}`);
                }
            });
        } else {
            console.log("No compatible models found. This might indicate an issue with your API key or project setup.");
        }
        console.log("----------------------------\n");

    } catch (error) {
        console.error("\nError listing models:", error.message);
    }
}

listModels();
