const { app } = require('@azure/functions');
const { CosmosClient } = require("@azure/cosmos");

// Read the connection string from our local.settings.json file
const connectionString = process.env.MyCosmosDBConnectionString;

// Create a new Cosmos DB client
const client = new CosmosClient(connectionString);

// The names of the database and container we just created
const databaseId = "TasksDB";
const containerId = "Items";

app.http('hello', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        try {
            // Get a reference to our database and container
            const database = client.database(databaseId);
            const container = database.container(containerId);

            // --- Create a new item ---
            // This creates a new task every time the function is run
            const newItem = {
                id: new Date().getTime().toString(), // Creates a unique ID based on the current time
                category: "school",
                name: "Complete cloud project",
                description: "Finish the E-Learning Portal project.",
                isComplete: false
            };
            
            // Save the new item to the database
            await container.items.create(newItem);
            context.log(`Created item with id: ${newItem.id}`);


            // --- Read all items from the database ---
            // This query selects all documents in the container
            const { resources: items } = await container.items
                .query("SELECT * from c")
                .fetchAll();
            
            context.log(`${items.length} items found.`);

            // Return the list of items as the response
            return {
                jsonBody: items
            };

        } catch (error) {
            context.log(`Error: ${error.message}`);
            // If an error occurs, return a 500 server error
            return {
                status: 500,
                body: "Error connecting to or querying the database."
            };
        }
    }
});
