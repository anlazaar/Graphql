import { formatXP, projectNameFormater } from "../utils.js";

export function renderXPDistributionChart(transactions) {
  if (!transactions || transactions.length === 0) {
    console.error("No transaction data available");
    return;
  }

  // Get SVG element
  const svg = document.getElementById("xpDistributionChart");
  if (!svg) {
    console.error("XP Distribution Chart SVG element not found");
    return;
  }

  // Wait for the SVG to be properly sized
  if (svg.clientWidth <= 0 || svg.clientHeight <= 0) {
    console.log("SVG dimensions not ready, scheduling redraw");
    setTimeout(() => renderXPDistributionChart(transactions), 300);
    return;
  }

  // Filter XP transactions and group by path project
  const xpByproject = transactions
    .filter(
      (tx) =>
        tx.type === "xp" &&
        tx.path.startsWith("/oujda/module/") &&
        !tx.path.includes("piscine")
    )
    .reduce((acc, tx) => {
      const project = tx.path.split("/")[3] || "other";
      acc[project] = (acc[project] || 0) + tx.amount;
      return acc;
    }, {});

  // Convert to array and sort by XP amount
  const projectData = Object.entries(xpByproject)
    .map(([project, xp]) => ({ project, xp }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 8); // Show top 8 projects

  const width = svg.clientWidth || 800;
  const height = svg.clientHeight || 300;
  const padding = { top: 30, right: 20, bottom: 40, left: 30 };

  // Clear previous content
  svg.innerHTML = "";

  // Calculate scales
  const maxXP = Math.max(...projectData.map((d) => d.xp));
  const barHeight =
    ((height - padding.top - padding.bottom) / projectData.length) * 0.7;
  const barGap =
    ((height - padding.top - padding.bottom) / projectData.length) * 0.3;
  const xScale = (width - padding.left - padding.right) / maxXP;

  // Create gradient for bars
  const gradientIds = projectData.map((_, i) => `barGradient${i}`);

  const gradients = gradientIds
    .map(
      (id, i) => `
    <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="var(--chart-primary)" stop-opacity="1" />
      <stop offset="100%" stop-color="var(--chart-primary)" stop-opacity="0.6" />
    </linearGradient>
  `
    )
    .join("");

  // Create grid lines
  const gridLines = [];
  const numGridLines = 5;
  for (let i = 0; i <= numGridLines; i++) {
    const x =
      padding.left +
      ((width - padding.left - padding.right) * i) / numGridLines;
    const xpValue = (maxXP * i) / numGridLines;

    gridLines.push(`
      <line 
        x1="${x}" 
        y1="${padding.top}" 
        x2="${x}" 
        y2="${height - padding.bottom}" 
        stroke="var(--chart-grid)" 
        stroke-width="1"
        stroke-dasharray="4 4"
      />
      <text 
        x="${x}" 
        y="${height - padding.bottom + 15}" 
        fill="var(--muted-foreground)"
        text-anchor="middle"
        style="font-size: 12px"
      >${formatXP(Math.round(xpValue))}</text>
    `);
  }

  // Create bars and labels
  const bars = projectData
    .map((d, i) => {
      const y = padding.top + (barHeight + barGap) * i;
      const barWidth = d.xp * xScale;
      const formattedProject = projectNameFormater(d.project);

      return `
      <g class="bar-group" data-project="${formattedProject}" data-xp="${d.xp}">
        <!-- Bar background -->
        <rect 
          x="${padding.left}"
          y="${y}"
          width="${width - padding.left - padding.right}"
          height="${barHeight}"
          fill="var(--chart-grid)"
          opacity="0.2"
          rx="4"
        />
        
        <!-- Actual bar -->
        <rect 
          x="${padding.left}"
          y="${y}"
          width="${barWidth}"
          height="${barHeight}"
          fill="url(#${gradientIds[i]})"
          rx="4"
          class="bar"
        >
          <animate 
            attributeName="width" 
            from="0" 
            to="${barWidth}" 
            dur="1s" 
            fill="freeze" 
            calcMode="spline"
            keySplines="0.25 0.1 0.25 1"
          />
        </rect>
        
        <!-- Project label - positioned inside the bar at the start -->
        <text 
          x="${padding.left + 10}"
          y="${y + barHeight / 2}"
          fill="white"
          dominant-baseline="middle"
          class="project-label"
          style="font-size: 12px; font-weight: 600;"
        >${formattedProject}</text>
        
        <!-- XP value -->
        <text 
          x="${padding.left + barWidth + 5}"
          y="${y + barHeight / 2}"
          fill="white"
          dominant-baseline="middle"
          style="font-size: 12px; font-weight: 500;"
        >
          ${formatXP(d.xp)}
        </text>
      </g>
    `;
    })
    .join("");

  // Add all elements to SVG
  svg.innerHTML = `
    <defs>
      ${gradients}
    </defs>
    
    <!-- Grid lines and x-axis labels -->
    ${gridLines.join("")}
    
    <!-- Y-axis line -->
    <line
      x1="${padding.left}"
      y1="${padding.top}"
      x2="${padding.left}"
      y2="${height - padding.bottom}"
      stroke="var(--border)"
      stroke-width="1"
    />
    
    <!-- X-axis line -->
    <line
      x1="${padding.left}"
      y1="${height - padding.bottom}"
      x2="${width - padding.right}"
      y2="${height - padding.bottom}"
      stroke="var(--border)"
      stroke-width="1"
    />
    
    <!-- Chart title -->
    <text
      x="${padding.left}"
      y="${padding.top - 10}"
      fill="var(--foreground)"
      style="font-size: 14px; font-weight: 500;"
    >XP by Project</text>
    
    <!-- Bars and labels -->
    ${bars}
  `;

  // Add tooltip functionality
  setupTooltip();
}

function setupTooltip() {
  // Create tooltip element if it doesn't exist
  let tooltip = document.querySelector(".chart-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "chart-tooltip";
    document.body.appendChild(tooltip);
  }

  // Add event listeners to bar groups
  const svg = document.getElementById("xpDistributionChart");
  if (!svg) return;

  svg.querySelectorAll(".bar-group").forEach((group) => {
    group.addEventListener("mousemove", (e) => {
      const project = group.dataset.project;
      const xp = formatXP(Number.parseInt(group.dataset.xp));

      tooltip.innerHTML = `
        <div style="font-weight: 500">${project}</div>
        <div>${xp}</div>
      `;

      tooltip.style.left = `${e.pageX + 10}px`;
      tooltip.style.top = `${e.pageY - 40}px`;
      tooltip.style.opacity = "1";

      // Highlight the bar
      const rect = group.querySelector("rect.bar");
      if (rect) rect.setAttribute("opacity", "0.8");
    });

    group.addEventListener("mouseleave", () => {
      tooltip.style.opacity = "0";

      // Remove highlight
      const rect = group.querySelector("rect.bar");
      if (rect) rect.removeAttribute("opacity");
    });
  });
}
