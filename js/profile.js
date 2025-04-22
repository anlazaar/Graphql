import {
  formatXP,
  totalXPCalculate,
  completedProjectsCalculation,
  auditRatioCalculator,
} from "./utils.js";
import { renderXPProgressChart } from "./charts/xpProgressChart.js";
import { renderProjectSuccessChart } from "./charts/projectSuccessChart.js";
import { renderXPDistributionChart } from "./charts/xpDistributionChart.js";

export function showProfilePage() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("profilePage").style.display = "block";
}

export function renderProfile(user) {
  if (!user) {
    console.error("No user data provided to renderProfile");
    return;
  }

  // Set user info
  document.getElementById("userName").textContent = user.login;
  document.getElementById("userEmail").textContent = user.email;

  // Set user initial for avatar
  const userInitial = document.getElementById("userInitial");
  if (userInitial) {
    userInitial.textContent = user.login.charAt(0).toUpperCase();
  }

  const totalXP = totalXPCalculate(user.transactions);
  document.getElementById("totalXP").textContent = formatXP(totalXP);

  const completedProjects = completedProjectsCalculation(user.progresses);
  document.getElementById("completedProjects").textContent = completedProjects;

  const auditRatio = auditRatioCalculator(user.transactions);
  document.getElementById("auditRatio").textContent = auditRatio;

  // Ensure DOM is fully rendered before drawing charts
  requestAnimationFrame(() => {
    // Render all charts
    renderXPProgressChart(user.transactions);
    renderProjectSuccessChart(user.progresses);
    renderXPDistributionChart(user.transactions);
  });

  // Show profile page
  showProfilePage();
}
