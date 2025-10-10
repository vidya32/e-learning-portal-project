document.addEventListener('DOMContentLoaded', () => {
    // --- View Switching Logic ---
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view');
    const headerTitle = document.getElementById('header-title');
    const fabContainer = document.querySelector('.fab-container');
    let currentCourseId = null; // Used to remember the context for various actions

    const switchView = (viewId, linkText) => {
        views.forEach(view => view.classList.remove('active-view'));
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.add('active-view');
        if (linkText) headerTitle.textContent = linkText;

        if (viewId === 'courses-view') {
            fabContainer.classList.remove('hidden');
        } else {
            fabContainer.classList.add('hidden');
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');
            const viewId = link.getAttribute('data-view');
            const linkText = link.textContent.trim();
            switchView(viewId, linkText);
            if (viewId === 'quizzes-view') {
                displayAllQuizzes();
            }
        });
    });

    // --- Dashboard Card Creation ---
    const dashboardFeed = document.getElementById('dashboard-feed');
    const createFeedCard = (title, content, type) => {
        const card = document.createElement('div');
        card.className = 'announcement-card';
        let iconHtml = '';
        if (type === 'post') iconHtml = '<i class="fas fa-bullhorn"></i>';
        if (type === 'question') iconHtml = '<i class="fas fa-question-circle"></i>';
        if (type === 'event') iconHtml = '<i class="fas fa-calendar-alt"></i>';
        const cardTitle = document.createElement('h4');
        cardTitle.innerHTML = `${iconHtml} ${title}`;
        card.appendChild(cardTitle);
        const cardContent = document.createElement('p');
        cardContent.textContent = content;
        card.appendChild(cardContent);
        if (type === 'question') {
            const footer = document.createElement('div');
            footer.className = 'card-footer';
            const replyButton = document.createElement('button');
            replyButton.textContent = 'Reply';
            replyButton.addEventListener('click', () => {
                if (card.querySelector('.reply-box')) return;
                const replyBox = document.createElement('div');
                replyBox.className = 'reply-box';
                const replyTextarea = document.createElement('textarea');
                replyTextarea.placeholder = 'Write your reply...';
                const submitReplyBtn = document.createElement('button');
                submitReplyBtn.textContent = 'Submit Reply';
                submitReplyBtn.addEventListener('click', () => {
                    const replyText = replyTextarea.value;
                    if (replyText.trim()) {
                        const replyElement = document.createElement('div');
                        replyElement.className = 'reply-display';
                        replyElement.innerHTML = `<p><strong>Your Reply:</strong> ${replyText}</p>`;
                        card.appendChild(replyElement);
                        replyBox.remove();
                    }
                });
                replyBox.appendChild(replyTextarea);
                replyBox.appendChild(submitReplyBtn);
                card.appendChild(replyBox);
                replyButton.disabled = true;
            });
            footer.appendChild(replyButton);
            card.appendChild(footer);
        }
        dashboardFeed.prepend(card);
    };

    // --- All Modals Logic ---
    const allModals = {
        post: { btn: document.getElementById('new-post-btn'), modal: document.getElementById('new-post-modal'), handler: () => { const content = document.getElementById('post-textarea').value; if (content.trim()) { createFeedCard('New Post by Vidya', content, 'post'); document.getElementById('post-textarea').value = ''; return true; } return false; } },
        question: { btn: document.getElementById('ask-question-btn'), modal: document.getElementById('ask-question-modal'), handler: () => { const title = document.getElementById('question-title-input').value; const content = document.getElementById('question-textarea').value; if (title.trim() && content.trim()) { createFeedCard(title, content, 'question'); document.getElementById('question-title-input').value = ''; document.getElementById('question-textarea').value = ''; return true; } return false; } },
        event: { btn: document.getElementById('add-event-btn'), modal: document.getElementById('add-event-modal'), handler: () => { const title = document.getElementById('event-title-input').value; const date = document.getElementById('event-date-input').value; if (title.trim() && date) { createFeedCard(`Event: ${title}`, `Scheduled for: ${date}`, 'event'); document.getElementById('event-title-input').value = ''; document.getElementById('event-date-input').value = ''; return true; } return false; } },
        createCourse: { btn: document.getElementById('create-course-btn'), modal: document.getElementById('create-course-modal'), handler: async () => { const courseName = document.getElementById('course-name-input').value; const profName = document.getElementById('professor-name-input').value; if (courseName && profName) { const res = await fetch('/api/createCourse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseName, professorName: profName }) }); if (res.ok) { const newCourse = await res.json(); alert(`Course Created! Access Code: ${newCourse.accessCode}`); displayCourses(); return true; } else { alert('Failed to create course.'); } } return false; } },
        joinCourse: { btn: document.getElementById('join-course-btn'), modal: document.getElementById('join-course-modal'), handler: () => { alert('Join course functionality to be implemented yet.'); return true; } },
        addNote: { modal: document.getElementById('add-note-modal') },
        createQuiz: { modal: document.getElementById('create-quiz-modal') }
    };
    for (const key in allModals) {
        const item = allModals[key];
        if (item.btn) item.btn.addEventListener('click', () => item.modal.classList.remove('hidden'));
        const closeBtn = item.modal.querySelector('.close-button');
        if (closeBtn) closeBtn.addEventListener('click', () => item.modal.classList.add('hidden'));
        const submitBtn = item.modal.querySelector('.submit-button');
        if (submitBtn && item.handler) submitBtn.addEventListener('click', async () => { if (await item.handler()) item.modal.classList.add('hidden'); else alert('Please fill out all fields.'); });
    }

    // --- Course & Quiz Logic ---
    const courseGrid = document.querySelector('#courses-view .course-grid');
    const displayCourses = async () => {
        try {
            const response = await fetch('/api/getCourses');
            if(!response.ok) throw new Error('Failed to fetch courses');
            const courses = await response.json();
            courseGrid.innerHTML = '';
            courses.forEach(course => {
                const card = document.createElement('div');
                card.className = 'course-card';
                card.innerHTML = `<div class="card-header"><h3>${course.courseName}</h3></div><div class="card-body"><p>Professor: ${course.professorName}</p></div><div class="card-footer"><i class="fas fa-folder"></i></div>`;
                card.addEventListener('click', () => showCourseDetail(course.id));
                courseGrid.appendChild(card);
            });
        } catch(e) { courseGrid.innerHTML = '<p>Could not load courses. Check terminal for API errors.</p>'; }
    };
    const showCourseDetail = async (courseId) => {
        currentCourseId = courseId;
        switchView('course-detail-view', '');
        document.getElementById('detail-course-name').textContent = 'Loading...';
        try {
            const response = await fetch(`/api/getCourseById?id=${courseId}`);
            if (!response.ok) throw new Error('Course not found.');
            const courseData = await response.json();
            document.getElementById('detail-course-name').textContent = courseData.courseName;
            document.getElementById('detail-professor-name').textContent = `Professor: ${courseData.professorName}`;
            document.getElementById('detail-access-code').innerHTML = `<strong>Access Code:</strong> ${courseData.accessCode}`;
            const populateList = (listId, items, clickHandler) => {
                const list = document.getElementById(listId);
                list.innerHTML = '';
                if(items && items.length > 0) {
                    items.forEach(item => { 
                        const li = document.createElement('li');
                        li.textContent = item.title;
                        if (clickHandler) li.onclick = () => clickHandler(courseId, item.id);
                        list.appendChild(li);
                    });
                } else { list.innerHTML = `<li>No content available.</li>` }
            };
            populateList('notes-list', courseData.notes);
            populateList('quizzes-list', courseData.quizzes, takeQuiz);
            populateList('videos-list', courseData.videos);
            document.getElementById('add-note-btn').onclick = () => allModals.addNote.modal.classList.remove('hidden');
            document.getElementById('add-quiz-btn').onclick = () => {
                // Reset quiz builder before showing
                document.getElementById('quiz-questions-builder').innerHTML = '';
                questionCount = 0;
                document.getElementById('create-quiz-title-input').value = '';
                allModals.createQuiz.modal.classList.remove('hidden');
            };
            document.getElementById('upload-note-form').onsubmit = async (event) => {
                event.preventDefault();
                const fileInput = document.getElementById('note-file-input');
                const titleInput = document.getElementById('note-title-input');
                const file = fileInput.files[0];
                if (!file || !titleInput.value) { alert('Please provide a title and file.'); return; }
                const formData = new FormData();
                formData.append('file', file);
                formData.append('title', titleInput.value);
                alert('Uploading file...');
                const uploadResponse = await fetch('/api/uploadFile', { method: 'POST', body: formData });
                if (uploadResponse.ok) {
                    const result = await uploadResponse.json();
                    const saveRes = await fetch('/api/addNote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, title: titleInput.value, url: result.url }) });
                    if(saveRes.ok) { alert('Note added successfully!'); allModals.addNote.modal.classList.add('hidden'); showCourseDetail(courseId); } else { alert('Failed to save note.'); }
                } else { alert('File upload failed. Check the VS Code terminal for errors.'); }
            };
        } catch (error) { document.getElementById('detail-course-name').textContent = 'Error loading course details.'; }
    };
    const displayAllQuizzes = async () => {
        const listEl = document.getElementById('all-quizzes-list');
        listEl.innerHTML = '<p>Loading quizzes...</p>';
        try {
            const res = await fetch('/api/getCourses');
            if(!res.ok) throw new Error('Failed to load quizzes');
            const courses = await res.json();
            listEl.innerHTML = '';
            let quizFound = false;
            courses.forEach(course => {
                if(course.quizzes && course.quizzes.length > 0) {
                    quizFound = true;
                    course.quizzes.forEach(quiz => {
                        const item = document.createElement('div');
                        item.className = 'quiz-list-item';
                        item.innerHTML = `<h4>${quiz.title}</h4><p>From Course: ${course.courseName}</p>`;
                        item.onclick = () => takeQuiz(course.id, quiz.id);
                        listEl.appendChild(item);
                    });
                }
            });
            if (!quizFound) { listEl.innerHTML = '<p>No quizzes found in any of your courses.</p>'; }
        } catch(e) { listEl.innerHTML = '<p>Could not load quizzes.</p>'; }
    };
    const takeQuiz = async (courseId, quizId) => {
        currentCourseId = courseId;
        switchView('take-quiz-view', '');
        const quizTitleEl = document.getElementById('quiz-title');
        const quizQuestionsEl = document.getElementById('quiz-questions');
        const submitQuizBtn = document.getElementById('submit-quiz-btn');
        const quizResultEl = document.getElementById('quiz-result');
        quizTitleEl.textContent = 'Loading Quiz...';
        quizQuestionsEl.innerHTML = '';
        quizResultEl.classList.add('hidden');
        submitQuizBtn.classList.remove('hidden');
        quizQuestionsEl.classList.remove('hidden');
        try {
            const response = await fetch(`/api/getQuizById?courseId=${courseId}&quizId=${quizId}`);
            if(!response.ok) throw new Error('Could not load quiz.');
            const quizData = await response.json();
            quizTitleEl.textContent = quizData.title;
            quizData.questions.forEach(q => {
                const questionBlock = document.createElement('div');
                questionBlock.className = 'question-block';
                let optionsHtml = '<div class="options-container">';
                q.options.forEach(option => { optionsHtml += `<label class="option-label"><input type="radio" name="${q.id}" value="${option}"> ${option}</label>`; });
                optionsHtml += '</div>';
                questionBlock.innerHTML = `<p>${q.text}</p>${optionsHtml}`;
                quizQuestionsEl.appendChild(questionBlock);
            });
            submitQuizBtn.onclick = async () => {
                const answers = {};
                quizData.questions.forEach(q => {
                    const selected = document.querySelector(`input[name="${q.id}"]:checked`);
                    if (selected) answers[q.id] = selected.value;
                });
                const res = await fetch('/api/submitQuiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, quizId, answers }) });
                if (res.ok) {
                    const result = await res.json();
                    quizQuestionsEl.classList.add('hidden');
                    submitQuizBtn.classList.add('hidden');
                    quizResultEl.innerHTML = `<h2>Quiz Complete!</h2><p>${result.message}</p>`;
                    quizResultEl.classList.remove('hidden');
                } else { alert('Failed to submit quiz.'); }
            };
        } catch(e) { quizTitleEl.textContent = 'Error loading quiz.'; }
    };
    document.querySelector('.back-button').addEventListener('click', () => switchView('courses-view', 'Courses'));
    document.querySelector('.back-button-quiz').addEventListener('click', () => showCourseDetail(currentCourseId));
    document.getElementById('fab-main-btn').addEventListener('click', () => fabContainer.classList.toggle('active'));
    
    // --- Create Quiz Modal Logic ---
    const addQuestionBtn = document.getElementById('add-question-btn');
    const questionsBuilder = document.getElementById('quiz-questions-builder');
    let questionCount = 0;
    addQuestionBtn.addEventListener('click', () => {
        questionCount++;
        const newQuestion = document.createElement('div');
        newQuestion.className = 'quiz-question-builder-item';
        newQuestion.innerHTML = `<input type="text" placeholder="Question ${questionCount} text..." class="question-text" required><div class="quiz-options-builder"><div class="quiz-option-item"><input type="radio" name="q${questionCount}-correct" value="0" checked> <input type="text" placeholder="Option 1 (Correct Answer)" required></div><div class="quiz-option-item"><input type="radio" name="q${questionCount}-correct" value="1"> <input type="text" placeholder="Option 2" required></div><div class="quiz-option-item"><input type="radio" name="q${questionCount}-correct" value="2"> <input type="text" placeholder="Option 3" required></div></div>`;
        questionsBuilder.appendChild(newQuestion);
    });
    document.getElementById('submit-create-quiz-btn').addEventListener('click', async () => {
        const quizTitle = document.getElementById('create-quiz-title-input').value;
        if (!quizTitle) return alert('Please enter a quiz title.');
        const questions = [];
        questionsBuilder.querySelectorAll('.quiz-question-builder-item').forEach((item, index) => {
            const text = item.querySelector('.question-text').value;
            const options = [];
            item.querySelectorAll('.quiz-options-builder input[type="text"]').forEach(opt => options.push(opt.value));
            const correctIndex = item.querySelector(`input[name="q${index+1}-correct"]:checked`).value;
            questions.push({ id: `q${index+1}`, text, options, answer: options[correctIndex] });
        });
        if(questions.length === 0) return alert('Please add at least one question.');
        const quizData = { title: quizTitle, questions };
        const res = await fetch('/api/addQuiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: currentCourseId, quizData }) });
        if(res.ok) { alert('Quiz created successfully!'); allModals.createQuiz.modal.classList.add('hidden'); showCourseDetail(currentCourseId); } else { alert('Failed to create quiz.'); }
    });

    // --- Chatbot Logic ---
    const chatbotToggleButton = document.getElementById('chatbot-toggle-button');
    const chatWindow = document.getElementById('chat-window');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    let chatHistory = [];
    let isChatInitialized = false;
    const initializeChat = () => { if (!isChatInitialized) { addMessageToChat("Hello! Ask me about your courses.", 'ai'); isChatInitialized = true; } };
    chatbotToggleButton.addEventListener('click', () => { chatWindow.classList.toggle('hidden'); initializeChat(); });
    chatCloseBtn.addEventListener('click', () => chatWindow.classList.add('hidden'));
    const addMessageToChat = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    const handleSendMessage = async () => {
        const userMessage = chatInput.value;
        if (!userMessage.trim()) return;
        addMessageToChat(userMessage, 'user');
        chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });
        chatInput.value = '';
        addMessageToChat('Typing...', 'ai');
        try {
            const response = await fetch('/api/askChatbot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history: chatHistory, message: userMessage }) });
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            document.querySelector('.chat-message.ai-message:last-child').textContent = data.response;
            chatHistory.push({ role: 'model', parts: [{ text: data.response }] });
        } catch (e) { document.querySelector('.chat-message.ai-message:last-child').textContent = 'Sorry, connection failed.'; }
    };
    chatSendBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') handleSendMessage(); });

    // --- Initial Load ---
    displayCourses();
    switchView('dashboard-view', 'Dashboard');
});