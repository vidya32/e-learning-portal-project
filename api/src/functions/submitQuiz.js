const { app } = require('@azure/functions');
const { CosmosClient } = require("@azure/cosmos");

const connectionString = process.env.MyCosmosDBConnectionString;
const client = new CosmosClient(connectionString);
const database = client.database("TasksDB");
const container = database.container("Courses");

app.http('submitQuiz', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { courseId, quizId, answers } = await request.json();

            if (!courseId || !quizId || !answers) {
                return { status: 400, body: "Course ID, Quiz ID, and answers are required." };
            }

            const { resource: course } = await container.item(courseId, courseId).read();
            if (!course) { return { status: 404, body: "Course not found." }; }

            const quiz = course.quizzes.find(q => q.id === quizId);
            if (!quiz) { return { status: 404, body: "Quiz not found." }; }

            let score = 0;
            quiz.questions.forEach(question => {
                if (answers[question.id] === question.answer) {
                    score++;
                }
            });

            const totalQuestions = quiz.questions.length;

            return {
                status: 200,
                jsonBody: {
                    score: score,
                    total: totalQuestions,
                    message: `You scored ${score} out of ${totalQuestions}!`
                }
            };

        } catch (error) {
            context.log(`Error submitting quiz: ${error.message}`);
            return { status: 500, body: "Error processing quiz submission." };
        }
    }
});