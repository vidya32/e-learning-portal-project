const { app } = require('@azure/functions');
const { CosmosClient } = require("@azure/cosmos");

// Set up the Cosmos DB client
const connectionString = process.env.MyCosmosDBConnectionString;
const client = new CosmosClient(connectionString);
const database = client.database("TasksDB");
const container = database.container("Items");

app.http('createTask', {
    methods: ['POST'], // This function only accepts POST requests
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http 'createTask' function processed a request.`);

        try {
            // Get the data sent from the frontend
            const taskData = await request.json();

            if (!taskData || !taskData.name) {
                return { status: 400, body: "Please provide a name for the task." };
            }

            // Create a new object to save in the database
            const newItem = {
                id: new Date().getTime().toString(),
                category: "general",
                name: taskData.name,
                isComplete: false
            };
            
            // Save the new item to the database
            const { resource: createdItem } = await container.items.create(newItem);
            
            // Return the newly created item as confirmation
            return {
                status: 201, // 201 means "Created"
                jsonBody: createdItem
            };

        } catch (error) {
            context.log(`Error creating task: ${error.message}`);
            return { status: 500, body: "Error creating task." };
        }
    }
});