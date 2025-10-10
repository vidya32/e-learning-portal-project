const { app } = require('@azure/functions');
const { CosmosClient } = require("@azure/cosmos");

const connectionString = process.env.MyCosmosDBConnectionString;
const client = new CosmosClient(connectionString);
const database = client.database("TasksDB");
const container = database.container("Courses");

// Function to generate a random 6-character code
const generateAccessCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

app.http('createCourse', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { courseName, professorName } = await request.json();
            if (!courseName || !professorName) {
                return { status: 400, body: "Course name and professor name are required." };
            }

            const newCourse = {
                id: new Date().getTime().toString(),
                category: "UserCreated",
                courseName: courseName,
                professorName: professorName,
                accessCode: generateAccessCode(),
                notes: [],
                quizzes: [],
                videos: []
            };

            const { resource: createdCourse } = await container.items.create(newCourse);
            return { status: 201, jsonBody: createdCourse };

        } catch (error) {
            context.log(`Error creating course: ${error.message}`);
            return { status: 500, body: "Could not create course." };
        }
    }
});
