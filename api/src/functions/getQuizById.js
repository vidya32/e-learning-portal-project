const { app } = require('@azure/functions');
const { CosmosClient } = require("@azure/cosmos");

// Cosmos DB Setup
const connectionString = process.env.MyCosmosDBConnectionString;
const client = new CosmosClient(connectionString);
const database = client.database("TasksDB");
const container = database.container("Courses");

app.http('getQuizById', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const courseId = request.query.get('courseId');
            const quizId = request.query.get('quizId');

            if (!courseId || !quizId) {
                return { status: 400, body: "Course ID and Quiz ID are required." };
            }

            const { resource: course } = await container.item(courseId, courseId).read();
            if (!course) {
                return { status: 404, body: "Course not found." };
            }

            const quiz = course.quizzes.find(q => q.id === quizId);
            if (!quiz) {
                return { status: 404, body: "Quiz not found." };
            }

            // IMPORTANT: Remove the answers before sending the questions to the user.
            const questionsForUser = quiz.questions.map(q => {
                const { answer, ...question } = q; // Destructure to exclude the answer
                return question;
            });

            return {
                status: 200,
                jsonBody: {
                    title: quiz.title,
                    questions: questionsForUser
                }
            };

        } catch (error) {
            context.log(`Error fetching quiz: ${error.message}`);
            return { status: 500, body: "Error fetching quiz data." };
        }
    }
});