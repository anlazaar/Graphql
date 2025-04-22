import { projectNameFormater } from "../utils.js";

export function renderProjectSuccessChart(progresses) {
  if (!progresses || progresses.length === 0) {
    console.error("No progress data available");
    return;
  }

  // Get SVG element
  const svg = document.getElementById("projectChart");
  if (!svg) {
    console.error("Project Success Chart SVG element not found");
    return;
  }

  // Wait for the SVG to be properly sized
  if (svg.clientWidth <= 0 || svg.clientHeight <= 0) {
    console.log("SVG dimensions not ready, scheduling redraw");
    setTimeout(() => renderProjectSuccessChart(progresses), 300);
    return;
  }

  // Filter and calculate success rates
  const projectResults = progresses.filter(
    (p) =>
      p.grade !== null &&
      !p.path.includes("checkpoint") &&
      !p.path.includes("onboarding") &&
      !p.path.includes("piscine") &&
      !p.path.includes("piscine-js")
  );

  const totalProjects = projectResults.length;
  const successfulProjects = projectResults.filter((p) => p.grade >= 1).length;
  const successRate = (successfulProjects / totalProjects) * 100 || 0;

  // Get SVG element
  const width = svg.clientWidth || 300;
  const height = svg.clientHeight || 300;
  const centerX = width / 2;

  // Clear previous content
  svg.innerHTML = "";

  // Tank dimensions
  const tankWidth = width * 0.4;
  const tankHeight = height * 0.7;
  const tankX = centerX - tankWidth / 2;
  const tankY = height * 0.15;
  const cornerRadius = 8;

  // Calculate fill height based on success rate
  const fillHeight = (successRate / 100) * tankHeight;
  const fillY = tankY + tankHeight - fillHeight;

  // Create wave effect
  const waveAmplitude = 5;
  const waveFrequency = 0.15;
  const wavePoints = [];

  // Create wave path
  let wavePath = `M ${tankX} ${fillY + waveAmplitude}`;

  for (let i = 0; i <= tankWidth; i += 5) {
    const x = tankX + i;
    const y = fillY + Math.sin(i * waveFrequency) * waveAmplitude;
    wavePath += ` L ${x} ${y}`;
  }

  // Complete the wave path
  wavePath += ` L ${tankX + tankWidth} ${tankY + tankHeight}`;
  wavePath += ` L ${tankX} ${tankY + tankHeight}`;
  wavePath += ` Z`;

  // Create gradient for tank fill
  const gradientId = "tankFillGradient";

  svg.innerHTML = `
    <defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="var(--chart-primary)" stop-opacity="1" />
        <stop offset="100%" stop-color="var(--chart-primary)" stop-opacity="0.7" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    <!-- Tank outline -->
    <rect
      x="${tankX}"
      y="${tankY}"
      width="${tankWidth}"
      height="${tankHeight}"
      rx="${cornerRadius}"
      ry="${cornerRadius}"
      fill="none"
      stroke="var(--chart-grid)"
      stroke-width="2"
    />
    
    <!-- Tank fill with wave effect -->
    <path
      d="${wavePath}"
      fill="url(#${gradientId})"
      filter="url(#glow)"
    />
    
    <!-- Tank level markers -->
    ${[0, 25, 50, 75, 100]
      .map((level) => {
        const markerY = tankY + tankHeight - (level / 100) * tankHeight;
        return `
        <line
          x1="${tankX - 5}"
          y1="${markerY}"
          x2="${tankX}"
          y2="${markerY}"
          stroke="var(--chart-grid)"
          stroke-width="1"
        />
        <text
          x="${tankX - 10}"
          y="${markerY}"
          fill="var(--muted-foreground)"
          text-anchor="end"
          dominant-baseline="middle"
          style="font-size: 10px;"
        >${level}%</text>
      `;
      })
      .join("")}
    
    <!-- Percentage text -->
    <text
      x="${centerX}"
      y="${tankY + tankHeight + 30}"
      fill="white"
      text-anchor="middle"
      dominant-baseline="middle"
      style="font-size: 36px; font-weight: 700;"
    >
      ${Math.round(successRate)}%
    </text>
    
    <!-- Label -->
    <text
      x="${centerX}"
      y="${tankY + tankHeight + 60}"
      fill="var(--muted-foreground)"
      text-anchor="middle"
      dominant-baseline="middle"
      style="font-size: 14px;"
    >Success Rate</text>
    
    <!-- Project count -->
    <text
      x="${centerX}"
      y="${tankY + tankHeight + 85}"
      fill="var(--muted-foreground)"
      text-anchor="middle"
      dominant-baseline="middle"
      style="font-size: 12px;"
    >${successfulProjects}/${totalProjects} Projects</text>
  `;

  // Add animation for wave effect
  const waveElement = svg.querySelector("path");
  if (waveElement) {
    let offset = 0;
    const waveAnimation = setInterval(() => {
      offset += 0.2;
      let newWavePath = `M ${tankX} ${fillY + waveAmplitude}`;

      for (let i = 0; i <= tankWidth; i += 5) {
        const x = tankX + i;
        const y = fillY + Math.sin(i * waveFrequency + offset) * waveAmplitude;
        newWavePath += ` L ${x} ${y}`;
      }

      newWavePath += ` L ${tankX + tankWidth} ${tankY + tankHeight}`;
      newWavePath += ` L ${tankX} ${tankY + tankHeight}`;
      newWavePath += ` Z`;

      waveElement.setAttribute("d", newWavePath);
    }, 100);

    // Store the interval ID on the element to clear it if needed
    svg.dataset.waveAnimationId = waveAnimation;
  }

  // Render project list
  renderProjectList(projectResults);
}

function renderProjectList(projectResults) {
  const projectList = document.getElementById("projectList");
  if (!projectList) {
    console.error("Project list element not found");
    return;
  }

  projectList.innerHTML = "";

  // Sort projects by success/failure and then by name
  const sortedProjects = [...projectResults].sort((a, b) => {
    // First sort by success/failure
    const aSuccess = a.grade >= 1;
    const bSuccess = b.grade >= 1;
    if (aSuccess !== bSuccess) {
      return aSuccess ? -1 : 1;
    }

    // Then sort by name
    const aName = a.path.split("/").pop();
    const bName = b.path.split("/").pop();
    return aName.localeCompare(bName);
  });

  sortedProjects.forEach((project) => {
    const listItem = document.createElement("li");
    listItem.className = "project-item";

    const statusIndicator = document.createElement("span");
    statusIndicator.className = `project-status ${
      project.grade >= 1 ? "success" : "failure"
    }`;

    const projectName = document.createElement("span");
    projectName.className = "project-name";
    projectName.textContent = projectNameFormater(
      project.path.split("/")[project.path.split("/").length - 1]
    );

    const gradeSpan = document.createElement("span");
    gradeSpan.className = "project-grade";
    gradeSpan.textContent = project.grade.toFixed(1);

    listItem.appendChild(statusIndicator);
    listItem.appendChild(projectName);
    listItem.appendChild(gradeSpan);
    projectList.appendChild(listItem);
  });
}
