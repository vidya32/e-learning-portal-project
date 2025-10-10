const { app } = require('@azure/functions');
const { CosmosClient } = require("@azure/cosmos");
const bcrypt = require("bcrypt");

// Cosmos DB Setup
const connectionString = process.env.MyCosmosDBConnectionString;
const client = new CosmosClient(connectionString);
const database = client.database("TasksDB");
const container = database.container("Users");

app.http('login', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http 'login' function processed a request.`);

        try {
            const { email, password } = await request.json();

            if (!email || !password) {
                return { status: 400, body: "Please provide both an email and password." };
            }

            // 1. Find the user by their email
            const { resources: users } = await container.items
                .query({
                    query: "SELECT * from c WHERE c.email = @email",
                    parameters: [{ name: "@email", value: email }]
                })
                .fetchAll();

            if (users.length === 0) {
                return { status: 401, body: "Invalid email or password." }; // Unauthorized
            }

            const user = users[0];

            // 2. Compare the submitted password with the hashed password in the database
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return { status: 401, body: "Invalid email or password." }; // Unauthorized
            }
            
            // 3. Login successful
            // In a real app, you would create a session token (JWT) here.
            // For now, we'll just return a success message.
            return {
                status: 200,
                jsonBody: {
                    message: "Login successful!",
                    user: {
                        id: user.id,
                        email: user.email
                    }
                }
            };

        } catch (error) {
            context.log(`Error during login: ${error.message}`);
            return { status: 500, body: "An error occurred during login." };
        }
    }
});