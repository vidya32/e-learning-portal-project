const { app } = require('@azure/functions');
const { CosmosClient } = require("@azure/cosmos");
const bcrypt = require("bcrypt");

// Cosmos DB Setup
const connectionString = process.env.MyCosmosDBConnectionString;
const client = new CosmosClient(connectionString);
const database = client.database("TasksDB");
const container = database.container("Users");

app.http('register', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http 'register' function processed a request.`);

        try {
            const { email, password } = await request.json();

            if (!email || !password) {
                return { status: 400, body: "Please provide both an email and password." };
            }

            // 1. Check if user already exists
            const { resources: users } = await container.items
                .query({
                    query: "SELECT * from c WHERE c.email = @email",
                    parameters: [{ name: "@email", value: email }]
                })
                .fetchAll();

            if (users.length > 0) {
                return { status: 409, body: "A user with this email already exists." }; // 409 Conflict
            }

            // 2. Hash the password for security
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // 3. Create the new user object
            const newUser = {
                id: new Date().getTime().toString(),
                email: email,
                password: hashedPassword // Store the HASHED password
            };
            
            // 4. Save the new user to the database
            const { resource: createdUser } = await container.items.create(newUser);
            
            // Return a success message (don't send the password back)
            return {
                status: 201,
                jsonBody: {
                    id: createdUser.id,
                    email: createdUser.email
                }
            };

        } catch (error) {
            context.log(`Error during registration: ${error.message}`);
            return { status: 500, body: "An error occurred during registration." };
        }
    }
});