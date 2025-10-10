const { app } = require('@azure/functions');
const { CosmosClient } = require("@azure/cosmos");

// Cosmos DB Setup
const connectionString = process.env.MyCosmosDBConnectionString;
const client = new CosmosClient(connectionString);
const database = client.database("TasksDB");
const container = database.container("Courses");

app.http('getCourseById', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http 'getCourseById' function processed a request.`);

        try {
            // Get the course ID from the query string (e.g., ?id=1)
            const courseId = request.query.get('id');

            if (!courseId) {
                return { status: 400, body: "Please provide a course ID." };
            }

            // Find the specific course by its ID in the database
            const { resource: course } = await container.item(courseId, courseId).read();

            if (course) {
                // If the course is found, return it
                return {
                    status: 200,
                    jsonBody: course
                };
            } else {
                // If no course is found with that ID
                return {
                    status: 404,
                    body: "Course not found."
                };
            }

        } catch (error) {
            context.log(`Error fetching course: ${error.message}`);
            return { status: 500, body: "Error fetching course data." };
        }
    }
});