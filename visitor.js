const API_URL = "https://script.google.com/macros/s/AKfycbz_lhUFiSu8PGNfZMKC9CmUG_cLwm02Z2D4FmBn1hhQamMQeIOLGk18zBNE5X8KEGxh/exec";

const visitorForm = document.getElementById("visitorForm");
const messageBox = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

function showMessage(type, text) {
  messageBox.className = `message-box full show ${type}`;
  messageBox.textContent = text;
}

visitorForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  const payload = {
    action: "submitVisitor",
    fullName: document.getElementById("fullName").value.trim(),
    company: document.getElementById("company").value.trim(),
    contactNumber: document.getElementById("contactNumber").value.trim(),
    email: document.getElementById("email").value.trim(),
    personToVisit: document.getElementById("personToVisit").value.trim(),
    department: document.getElementById("department").value.trim(),
    purpose: document.getElementById("purpose").value.trim(),
    visitDate: document.getElementById("visitDate").value,
    visitTime: document.getElementById("visitTime").value,
    vehicleType: document.getElementById("vehicleType").value,
    carModel: document.getElementById("carModel").value.trim(),
    plateNumber: document.getElementById("plateNumber").value.trim()
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      showMessage("success", `Request submitted successfully. Your Request ID is ${result.requestId}. Please check your email for confirmation.`);
      visitorForm.reset();
    } else {
      showMessage("error", result.message || "Submission failed.");
    }
  } catch (error) {
    showMessage("error", "Unable to connect to the server.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Request";
  }
});