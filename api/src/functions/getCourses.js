const { app } = require('@azure/functions');
const { CosmosClient } = require("@azure/cosmos");

// Cosmos DB Setup
const connectionString = process.env.MyCosmosDBConnectionString;
const client = new CosmosClient(connectionString);
const database = client.database("TasksDB");
const container = database.container("Courses");

app.http('getCourses', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http 'getCourses' function processed a request.`);
        try {
            // Query to select all documents in the Courses container
            const { resources: courses } = await container.items
                .query("SELECT * from c")
                .fetchAll();
            
            return {
                status: 200,
                jsonBody: courses
            };

        } catch (error) {
            context.log(`Error fetching courses: ${error.message}`);
            return { status: 500, body: "Could not fetch courses." };
        }
    }
});