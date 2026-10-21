
const registerForm = document.getElementById("registerForm");
const registerStatus = document.getElementById("registerStatus");
const passwordInput = document.getElementById("registerPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const togglePasswordButton = document.getElementById("toggleRegisterPassword");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");

function showRegisterStatus(message, success = false) {
    registerStatus.textContent = message;
    registerStatus.style.color = success ? "green" : "#c0392b";
}

togglePasswordButton?.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";
    togglePasswordButton.textContent = isHidden ? "Hide" : "Show";
    togglePasswordButton.setAttribute(
        "aria-label",
        isHidden ? "Hide password" : "Show password"
    );
});

passwordInput?.addEventListener("input", () => {
    const password = passwordInput.value;
    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const widths = ["0%", "25%", "50%", "75%", "100%"];
    const labels = [
        "Use at least 8 characters.",
        "Weak password",
        "Fair password",
        "Good password",
        "Strong password"
    ];

    strengthBar.style.width = widths[score];
    strengthText.textContent = labels[score];
});

registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const agreeTerms = document.getElementById("agreeTerms").checked;
    const submitButton = registerForm.querySelector('[type="submit"]');

    if (password !== confirmPassword) {
        showRegisterStatus("Passwords do not match.");
        confirmPasswordInput.focus();
        return;
    }

    if (!agreeTerms) {
        showRegisterStatus("Please agree to the terms and privacy notice.");
        return;
    }

    submitButton.disabled = true;
    showRegisterStatus("Creating your account...", true);

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                fullName,
                email,
                username,
                password,
                confirmPassword
            })
        });

        const responseText = await response.text();

let data;

try {
    data = JSON.parse(responseText);
} catch {
    console.error("Registration response is not JSON:", responseText);
    throw new Error(
        `Server returned HTTP ${response.status}: ${responseText.slice(0, 150)}`
    );
}

if (!response.ok || !data.success) {
    throw new Error(data.message || "Registration failed.");
}
       

        showRegisterStatus(
            "Account created successfully! Redirecting...",
            true
        );

        window.location.href = "dashboard.html";
    } catch (error) {
        showRegisterStatus(
            error.message || "Unable to connect to the server."
        );
    } finally {
        submitButton.disabled = false;
    }
});
