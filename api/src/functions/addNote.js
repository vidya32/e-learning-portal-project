const { app } = require('@azure/functions');
const { CosmosClient } = require("@azure/cosmos");

const connectionString = process.env.MyCosmosDBConnectionString;
const client = new CosmosClient(connectionString);
const database = client.database("TasksDB");
const container = database.container("Courses");

app.http('addNote', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http 'addNote' function processed a request.`);

        try {
            const { courseId, title, url } = await request.json();

            if (!courseId || !title || !url) {
                return { status: 400, body: "Missing required fields (courseId, title, url)." };
            }

            // 1. Fetch the existing course document
            const { resource: course } = await container.item(courseId, courseId).read();

            if (!course) {
                return { status: 404, body: "Course not found." };
            }

            // 2. Add the new note to the 'notes' array
            const newNote = {
                id: `n${new Date().getTime()}`,
                title: title,
                url: url // We now save the file URL
            };
            course.notes.push(newNote);

            // 3. Save the updated course document back to the database
            const { resource: updatedCourse } = await container.items.upsert(course);

            return { status: 200, jsonBody: updatedCourse };

        } catch (error) {
            context.log(`Error adding note: ${error.message}`);
            return { status: 500, body: "Error adding note to course." };
        }
    }
});