import { handleLogin, logout } from "./auth.js";
import { fetchUserData } from "./api.js";
import { renderProfile } from "./profile.js";
import { renderXPProgressChart } from "./charts/xpProgressChart.js";
import { renderProjectSuccessChart } from "./charts/projectSuccessChart.js";
import { renderXPDistributionChart } from "./charts/xpDistributionChart.js";

// Global variable to store user data
let userData = null;

// Load Profile Data
async function loadProfile() {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    console.error("No JWT found, logging out...");
    return logout();
  }

  document.getElementById("loading").style.display = "flex";

  try {
    const userDataResponse = await fetchUserData(jwt);

    if (!userDataResponse?.data?.user?.[0]) {
      throw new Error("User data not found");
    }

    userData = userDataResponse.data.user[0];
    renderProfile(userData);
  } catch (error) {
    console.error("Error in loadProfile:", error);
    document.getElementById("errorMessage").textContent =
      "Failed to load profile data. Please try logging in again.";
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

// Function to handle window resize and redraw charts
function handleResize() {
  if (!userData) return;

  // Redraw all charts
  renderXPProgressChart(userData.transactions);
  renderProjectSuccessChart(userData.progresses);
  renderXPDistributionChart(userData.transactions);
}

// Initialize the application
function initApp() {
  // Check if user is logged in
  if (localStorage.getItem("jwt")) {
    loadProfile();
  }

  // Set up event listeners
  const loginForm = document.getElementById("handleLogin");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      const success = await handleLogin(e);
      if (success) loadProfile();
    });
  }

  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  // Add resize event listener with debounce
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 250); // Debounce resize events
    handleResize();
  });
}

// Run initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);
