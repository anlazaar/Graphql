const AUTH_URL = "https://learn.zone01oujda.ma/api/auth/signin";
const API_URL = "https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql";

function logout() {
  localStorage.removeItem("jwt");
  window.location.reload();
}

// HELPERS
function formatXP(xp) {
  if (xp >= 1000000) {
    return Math.ceil(xp / 1_000_000) + " MB";
  } else if (xp >= 1000) {
    return Math.ceil(xp / 1_000) + " kB";
  } else {
    return xp.toLocaleString();
  }
}

// Calculate total XP
const totalXPCalculate = (transactions) => {
  const totalXP = transactions
    ? transactions.reduce((sum, tx) => {
        if (tx.path.startsWith("/oujda/module/") && tx.type == "xp") {
          return sum + tx.amount;
        }
        return sum;
      }, 0)
    : 0;

  console.log("TOTAL XP: ", totalXP);

  formatXP(totalXP);
  return totalXP;
};

// Calculate completed projects
const completedProjectsCalculation = (progresses) => {
  console.log("USER PROGRESSES:\n", progresses);
  const completedProjects = progresses
    ? progresses.filter(
        (p) =>
          p.grade !== null &&
          p.grade >= 1 &&
          p.path.startsWith("/oujda/module/") &&
          !p.path.startsWith("/oujda/module/checkpoint")
      ).length
    : 0;
  return completedProjects;
};

// Calculate Audit Ratio
const auditRatioCalculator = (transactions) => {
  let auditsDone = 0; // "up" type
  let auditsReceived = 0; // "down" type
  if (transactions) {
    transactions.forEach((tx) => {
      if (tx.type === "up") {
        auditsDone += tx.amount;
      } else if (tx.type === "down") {
        auditsReceived += tx.amount;
      }
    });
  }

  const auditRatio =
    auditsReceived > 0
      ? (Math.ceil((auditsDone / auditsReceived) * 100) / 100).toFixed(1)
      : "0.0";
  return auditRatio;
};

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const credentials = btoa(`${username}:${password}`);

  try {
    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    let jwt = await response.text();
    console.log("Raw JWT received:", jwt);

    // Clean the JWT string
    jwt = jwt.trim(); // Remove any whitespace
    jwt = jwt.replace(/^["'](.+)["']$/, "$1"); // Remove any quotes

    console.log("Cleaned JWT:", jwt);
    console.log("JWT parts:", jwt.split("."));

    // Validate JWT format
    const parts = jwt.split(".");
    if (parts.length !== 3) {
      throw new Error(
        `Invalid JWT format: expected 3 parts, got ${parts.length}`
      );
    }

    // Verify each part is valid base64url
    for (let i = 0; i < parts.length; i++) {
      try {
        // Convert base64url to base64
        const base64 = parts[i].replace(/-/g, "+").replace(/_/g, "/");

        // Pad with '=' if needed
        const pad = base64.length % 4;
        const paddedBase64 = pad ? base64 + "=".repeat(4 - pad) : base64;

        // Try to decode it
        atob(paddedBase64);
      } catch (e) {
        throw new Error(
          `Invalid base64url in JWT part ${i + 1}: ${parts[i].substring(
            0,
            10
          )}...`
        );
      }
    }

    localStorage.setItem("jwt", jwt);
    console.log("Stored JWT:", localStorage.getItem("jwt"));

    try {
      await testAuthToken(jwt);
      loadProfile();
    } catch (tokenError) {
      console.error("Token verification error:", tokenError);
      throw new Error(`Token verification failed: ${tokenError.message}`);
    }
  } catch (error) {
    console.error("Login error:", error);
    document.getElementById("errorMessage").textContent = error.message;
  }
}

async function testAuthToken(jwt) {
  console.log("Testing token:", jwt.substring(0, 20) + "...");

  const testQuery = `
query TestAuth {
user {
  id
}
}
`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: testQuery }),
  });

  const result = await response.json();
  console.log("Test auth response:", result);

  if (!response.ok || result.errors) {
    throw new Error(result.errors?.[0]?.message || "Token verification failed");
  }

  return result;
}

// function errorHandler(error) {
//   console.log(error);
//   // alert(`Error: ${error.message}`);
//   // logout();
// }

// Load Profile Data
async function loadProfile() {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    console.error("No JWT found, logging out...");
    return logout();
  }

  // Show loading spinner
  document.getElementById("loading").style.display = "flex";

  try {
    const userData = await graphqlQuery(
      jwt,
      `query GetUserData {
  user {
    id
    login
    email
    transactions {
      type
      amount
      path
    }
    progresses {
      grade
      path
    }
    results {
      path
      grade
    }
  }
}`
    );

    if (!userData?.data?.user?.[0]) {
      throw new Error("User data not found");
    }

    const user = userData.data.user[0];
    console.log(user);
    renderProfile(user);
  } catch (error) {
    console.error("Error in loadProfile:", error);
    document.getElementById("errorMessage").textContent =
      "Failed to load profile data. Please try logging in again.";
    // logout();
  } finally {
    // Hide loading spinner
    document.getElementById("loading").style.display = "none";
  }
}

function renderProfile(user) {
  if (!user) {
    console.error("No user data provided to renderProfile");
    return;
  }

  // Set user info
  document.getElementById("userName").textContent = user.login;
  document.getElementById("userEmail").textContent = user.email;

  console.log("USER TRANSACTIONS:\n", user.transactions);

  const totalXP = totalXPCalculate(user.transactions);
  // Set the XP
  document.getElementById("totalXP").textContent = formatXP(totalXP);

  const completedProjects = completedProjectsCalculation(user.progresses);
  document.getElementById("completedProjects").textContent = completedProjects;

  console.log("USER RESULTS:\n", user.results);

  const auditRatio = auditRatioCalculator(user.transactions);
  console.log("Final Audits Ratio:", auditRatio);
  // Set the Audit Ratio
  document.getElementById("auditRatio").textContent = auditRatio;

  // Show profile page
  showProfilePage();
}

function showProfilePage() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("profilePage").style.display = "block";
}

// GraphQL Helper
async function graphqlQuery(jwt, query) {
  if (!jwt) {
    throw new Error("No JWT provided");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const result = await response.json();

  if (!response.ok || result.errors) {
    const errorMessage = result.errors?.[0]?.message || "GraphQL query failed";
    console.error("GraphQL Error:", result.errors);
    throw new Error(errorMessage);
  }

  return result;
}

// Render Profile Info
window.onload = () => {
  if (localStorage.getItem("jwt")) loadProfile();
};

// Render SVG Charts
function renderCharts(user) {}

function renderProjectChart(progresses) {}

// Page Navigation

// Initial Check
window.onload = () => {
  if (localStorage.getItem("jwt")) loadProfile();
};

document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("handleLogin")
    .addEventListener("submit", handleLogin);
});
