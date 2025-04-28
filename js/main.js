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
    // displayUsersByXp(jwt);

    if (!userDataResponse?.data?.user?.[0]) {
      throw new Error("User data not found, failed to fetch ...");
    }
    // a common concept in getting data from the Graphql is that even if you
    // get only one user the result may be in almost all cases an array, and
    // that's in first place becuase the server doesn't know either u wanna
    // get one user or all, so the result is always wrapped inside an array

    // soo same here after we console logged the user data it's an object
    // inside an array...
    // console.log(userDataResponse.data.user);

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
      const successLogin = await handleLogin(e);
      if (successLogin) loadProfile();
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

// async function displayUsersByXp(jwt) {
//   try {
//     const response = await fetchUsersFromPublicView(jwt);
//     const users = response.data.user_public_view;

//     // Filter out users where level is 0 or not greater than 1
//     const filteredUsers = users.filter((user) => {
//       // Only include users with at least one event with level > 1
//       return user.events.some((event) => event.level > 1);
//     });

//     console.log("Users with Level > 1 sorted by Level:");
//     filteredUsers
//       .sort((a, b) => {
//         const levelA = a.events[0]?.level || 0;
//         const levelB = b.events[0]?.level || 0;
//         return levelB - levelA; // Sort descending by level
//       })
//       .forEach((user, index) => {
//         console.log(
//           `${index + 1}. ${user.login} - Level: ${user.events[0]?.level || 0}`
//         );
//       });
//   } catch (error) {
//     console.error("Failed to fetch users:", error.message);
//   }
// }
