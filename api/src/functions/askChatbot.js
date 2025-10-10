const { app } = require('@azure/functions');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GeminiApiKey;

if (!apiKey) {
    throw new Error("Gemini API Key is not set or loaded correctly from local.settings.json");
}
const genAI = new GoogleGenerativeAI(apiKey);

app.http('askChatbot', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http 'askChatbot' function processed a request.`);
        
        try {
            const { message } = await request.json();
            if (!message) {
                return { status: 400, body: "Please provide a message." };
            }

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});

            // ** THIS IS THE PERSONALIZATION AND FORMATTING PROMPT **
            const systemPrompt = `
                You are an AI assistant for the "E-Learn Portal".
                Your ONLY purpose is to help students with questions related to their courses: Cloud Computing, FOML, Web Development, and Database Management.

                **Your Rules:**
                1.  Your answers must be in plain text only. Do not use markdown like ** for bolding.
                2.  Keep your answers short and structured.
                3.  Use a hyphen (-) for any lists.
                4.  If a user asks about any topic NOT related to the courses listed above, you MUST politely respond with exactly this message: "I can only answer questions about the E-Learn Portal courses."
            `;

            const result = await model.generateContent(`${systemPrompt}\n\nUser Question: ${message}`);
            const response = result.response;
            const aiResponse = response.text();
            
            return {
                status: 200,
                jsonBody: { response: aiResponse }
            };

        } catch (error) {
            context.log(`Error in askChatbot function: ${JSON.stringify(error, null, 2)}`);
            return { status: 500, body: "An error occurred. Check the VS Code terminal logs for details." };
        }
    }
});