document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('message');

    // Function to display messages
    const showMessage = (text, color) => {
        if (messageDiv) {
            messageDiv.textContent = text;
            messageDiv.style.color = color;
        }
    };

    // --- Registration Form Logic ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            showMessage('Registering...', 'white');

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.status === 201) {
                showMessage('Registration successful! Redirecting to login...', 'lime');
                setTimeout(() => { window.location.href = '/login.html'; }, 2000);
            } else {
                const error = await response.text();
                showMessage(`Error: ${error}`, 'red');
            }
        });
    }

    // --- Login Form Logic ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // This is the line that prevents the form from clearing
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            showMessage('Signing in...', 'white');

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                showMessage('Success! Redirecting to dashboard...', 'lime');
                setTimeout(() => { window.location.href = '/index.html'; }, 1000);
            } else {
                showMessage('Invalid email or password.', 'red');
            }
        });
    }
});