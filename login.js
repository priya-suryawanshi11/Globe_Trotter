
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const loginPassword = document.getElementById("loginPassword");
const togglePassword = document.getElementById("togglePassword");

function showLoginStatus(message, success = false) {
    loginStatus.textContent = message;
    loginStatus.style.color = success ? "green" : "#c0392b";
}

togglePassword?.addEventListener("click", () => {
    const isHidden = loginPassword.type === "password";

    loginPassword.type = isHidden ? "text" : "password";
    togglePassword.textContent = isHidden ? "Hide" : "Show";
    togglePassword.setAttribute(
        "aria-label",
        isHidden ? "Hide password" : "Show password"
    );
});

document.getElementById("forgotPassword")?.addEventListener("click", (event) => {
    event.preventDefault();
    showLoginStatus(
        "Password recovery is not implemented yet. Please contact your project administrator."
    );
});

loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = loginPassword.value;
    const rememberMe = document.getElementById("rememberMe").checked;
    const submitButton = loginForm.querySelector('[type="submit"]');

    submitButton.disabled = true;
    showLoginStatus("Signing you in...", true);

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                email,
                password,
                rememberMe
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Login failed.");
        }

        showLoginStatus("Login successful! Redirecting...", true);

        if (data.user.role === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "dashboard.html";
        }
    } catch (error) {
        showLoginStatus(
            error.message || "Unable to connect to the server."
        );
    } finally {
        submitButton.disabled = false;
    }
});
