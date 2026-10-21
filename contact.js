
const contactForm = document.getElementById("contactForm");
const messageInput = document.getElementById("message");
const charCount = document.getElementById("charCount");
const contactStatus = document.getElementById("contactStatus");

messageInput.addEventListener("input", function () {
  charCount.textContent = messageInput.value.length;
});

contactForm.addEventListener("submit", function (event) {
  event.preventDefault();

  contactStatus.textContent = "";
  contactStatus.className = "contact-status";

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  const fullName = document.getElementById("fullName").value.trim();
  const message = messageInput.value.trim();

  if (fullName.length < 2) {
    contactStatus.textContent = "Please enter a valid name.";
    contactStatus.classList.add("error");
    return;
  }

  if (message.length < 10) {
    contactStatus.textContent = "Please write a message containing at least 10 characters.";
    contactStatus.classList.add("error");
    return;
  }

  contactStatus.textContent =
    "Thank you, " + fullName + "! Your form passed validation. Actual message delivery will be enabled after backend integration.";
  contactStatus.classList.add("success");

  contactForm.reset();
  charCount.textContent = "0";
});
