const AUTH_URL = "https://learn.zone01oujda.ma/api/auth/signin";
const API_URL = "https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql";

function logout() {
  localStorage.removeItem("jwt");
  window.location.reload();
}

// HELPERS
function formatXP(xp) {
  if (xp >= 1000000) {
    return Math.round(xp / 1000000) + " MB";
  } else if (xp >= 100000) {
    return Math.round(xp / 1000) + " kB";
  } else if (xp >= 1000) {
    return (xp / 1000).toFixed(1).replace(".0", "") + " kB";
  } else {
    return xp.toLocaleString();
  }
}

// Calculate total XP
const totalXPCalculate = (transactions) => {
  const totalXP = transactions
    ? transactions.reduce((sum, tx) => {
        if (
          tx.path.startsWith("/oujda/module/") &&
          tx.type == "xp" &&
          !tx.path.includes("piscine-js")
        ) {
          console.log(tx);
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

  if (!progresses) return 0;

  const uniquePaths = new Set();
  const completedProjects = progresses.reduce((acc, p) => {
    if (
      p.grade !== null &&
      p.grade >= 1 &&
      !p.path.includes("checkpoint") &&
      !p.path.includes("piscine-go") &&
      !p.path.includes("piscine-js") &&
      !p.path.includes("onboarding") &&
      !uniquePaths.has(p.path) // Ensure it's not a duplicate
    ) {
      uniquePaths.add(p.path);
      acc.push(p);
    }
    return acc;
  }, []);

  console.log("THE COMPLETED PROJECTS:\n", completedProjects);
  return completedProjects.length;
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
    console.log(`Invalid JWT format: expected 3 parts, got ${parts.length}`);

    // Verify each part is valid base64url
    for (let i = 0; i < parts.length; i++) {
      try {
        // Convert base64url to base64
        const base64 = parts[i].replace(/-/g, "+").replace(/_/g, "/");
        console.log("BASE64URL TO BASE64:\n ", parts[i], "\n", base64);

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
      createdAt
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
    console.log("User data:", user);
    renderProfile(user);
  } catch (error) {
    console.error("Error in loadProfile:", error);
    document.getElementById("errorMessage").textContent =
      "Failed to load profile data. Please try logging in again.";
  } finally {
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

  const totalXP = totalXPCalculate(user.transactions);
  document.getElementById("totalXP").textContent = formatXP(totalXP);

  const completedProjects = completedProjectsCalculation(user.progresses);
  document.getElementById("completedProjects").textContent = completedProjects;

  const auditRatio = auditRatioCalculator(user.transactions);
  document.getElementById("auditRatio").textContent = auditRatio;

  // Render charts
  renderXPProgressChart(user.transactions);
  renderProjectSuccessChart(user.progresses);

  // Show profile page
  showProfilePage();
}

function renderXPProgressChart(transactions) {
  if (!transactions || transactions.length === 0) {
    console.error("No transaction data available");
    return;
  }

  // Filter and sort XP transactions
  const xpData = transactions
    .filter(
      (tx) =>
        tx.type === "xp" &&
        tx.path.startsWith("/oujda/module/") &&
        !tx.path.includes("piscine-js")
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  console.log("XP Data points:", xpData);

  if (xpData.length === 0) {
    console.error("No XP transactions found");
    return;
  }

  // Calculate cumulative XP
  let cumulativeXP = 0;
  const dataPoints = xpData.map((tx) => {
    cumulativeXP += tx.amount;
    return { xp: cumulativeXP, date: new Date(tx.createdAt) };
  });

  console.log("Processed data points:", dataPoints);

  // Get SVG dimensions
  const svg = document.getElementById("xpChart");
  const width = svg.clientWidth || 800; // Fallback width
  const height = svg.clientHeight || 400; // Fallback height
  const padding = 60; // Increased padding for labels

  // Clear previous content
  svg.innerHTML = "";

  // Calculate scales
  const maxXP = Math.max(...dataPoints.map((d) => d.xp));
  const xScale = (width - 2 * padding) / (dataPoints.length - 1);
  const yScale = (height - 2 * padding) / maxXP;

  // Create path data
  let pathData = "";
  dataPoints.forEach((point, i) => {
    const x = padding + i * xScale;
    const y = height - padding - point.xp * yScale;
    pathData += `${i === 0 ? "M" : "L"} ${x} ${y}`;
  });

  // Create grid lines and labels
  const gridLines = [];
  const yLabels = [];
  const numGridLines = 5;

  for (let i = 0; i <= numGridLines; i++) {
    const y = height - padding - ((height - 2 * padding) * i) / numGridLines;
    const xpValue = (maxXP * i) / numGridLines;

    gridLines.push(`
      <line 
        x1="${padding}" 
        y1="${y}" 
        x2="${width - padding}" 
        y2="${y}" 
        stroke="rgba(255,255,255,0.1)" 
        stroke-dasharray="4"
      />
    `);

    yLabels.push(`
      <text 
        x="${padding - 10}" 
        y="${y}" 
        fill="var(--text-dim)"
        text-anchor="end"
        alignment-baseline="middle"
        style="font-size: 12px"
      >${formatXP(Math.round(xpValue))}</text>
    `);
  }

  // Add SVG elements with improved gradient
  svg.innerHTML = `
    <defs>
      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:rgba(255,68,68,0.6);stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:rgba(255,68,68,0.6);stop-opacity:0" />
      </linearGradient>
    </defs>
    
    <!-- Grid lines -->
    ${gridLines.join("")}
    
    <!-- Y-axis labels -->
    ${yLabels.join("")}
    
    <!-- Area fill -->
    <path 
      d="${pathData} L ${width - padding} ${height - padding} L ${padding} ${
    height - padding
  } Z"
      fill="url(#lineGradient)"
      opacity="0.3"
    />
    
    <!-- Line -->
    <path
      d="${pathData}"
      stroke="rgba(255,68,68,0.8)"
      stroke-width="3"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    
    <!-- Data points -->
    ${dataPoints
      .map((point, i) => {
        const x = padding + i * xScale;
        const y = height - padding - point.xp * yScale;
        return `
        <circle 
          cx="${x}" 
          cy="${y}" 
          r="4" 
          fill="rgba(255,68,68,0.8)"
          stroke="var(--paper-dark)"
          stroke-width="2"
        />
      `;
      })
      .join("")}
  `;
}

function renderProjectSuccessChart(progresses) {
  if (!progresses || progresses.length === 0) {
    console.error("No progress data available");
    return;
  }

  // Filter and calculate success rates
  const projectResults = progresses.filter(
    (p) =>
      p.grade !== null &&
      !p.path.includes("checkpoint") &&
      !p.path.includes("piscine") &&
      !p.path.includes("onboarding")
  );

  console.log("Project results:", projectResults);

  const totalProjects = projectResults.length;
  const successfulProjects = projectResults.filter((p) => p.grade >= 1).length;
  const successRate = (successfulProjects / totalProjects) * 100 || 0;

  console.log(
    `Success rate: ${successRate}% (${successfulProjects}/${totalProjects})`
  );

  // Get SVG element
  const svg = document.getElementById("projectChart");
  const width = svg.clientWidth || 400;
  const height = svg.clientHeight || 400;
  const radius = Math.min(width, height) / 3;
  const centerX = width / 2;
  const centerY = height / 2;
  const strokeWidth = 30;

  // Calculate arc path
  const circumference = 2 * Math.PI * radius;
  const dashArray = (successRate / 100) * circumference;

  svg.innerHTML = `
    <!-- Background circle -->
    <circle
      cx="${centerX}"
      cy="${centerY}"
      r="${radius}"
      fill="none"
      stroke="rgba(255,255,255,0.1)"
      stroke-width="${strokeWidth}"
    />
    
    <!-- Progress circle -->
    <circle
      cx="${centerX}"
      cy="${centerY}"
      r="${radius}"
      fill="none"
      stroke="rgba(255,68,68,0.6)"
      stroke-width="${strokeWidth}"
      stroke-dasharray="${dashArray} ${circumference}"
      transform="rotate(-90 ${centerX} ${centerY})"
      stroke-linecap="round"
    />
    
    <!-- Percentage text -->
    <text
      x="${centerX}"
      y="${centerY}"
      fill="var(--text)"
      text-anchor="middle"
      alignment-baseline="middle"
      style="font-size: 48px; font-family: 'Caveat', cursive; font-weight: bold;"
    >${Math.round(successRate)}%</text>
    
    <!-- Label -->
    <text
      x="${centerX}"
      y="${centerY + 40}"
      fill="var(--text-dim)"
      text-anchor="middle"
      alignment-baseline="middle"
      style="font-size: 16px;"
    >Success Rate</text>
    
    <!-- Project count -->
    <text
      x="${centerX}"
      y="${centerY + 70}"
      fill="var(--text-dim)"
      text-anchor="middle"
      alignment-baseline="middle"
      style="font-size: 14px;"
    >${successfulProjects}/${totalProjects} Projects</text>
  `;
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

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("handleLogin")
    .addEventListener("submit", handleLogin);
});
