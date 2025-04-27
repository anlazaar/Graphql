import { formatXP } from "../utils.js";

export function renderXPProgressChart(transactions) {
  if (!transactions || transactions.length === 0) {
    console.error("No transaction data available");
    return;
  }

  // Get SVG element
  const svg = document.getElementById("xpChart");
  if (!svg) {
    console.error("XP Progress Chart SVG element not found");
    return;
  }

  // Wait for the SVG to be properly sized
  if (svg.clientWidth <= 0 || svg.clientHeight <= 0) {
    console.log("SVG dimensions not ready, scheduling redraw");
    setTimeout(() => renderXPProgressChart(transactions), 300);
    return;
  }

  // Filter and sort XP transactions
  const xpData = transactions
    .filter(
      (tx) =>
        (tx.path.startsWith("/oujda/module/") &&
          !tx.path.includes("onboarding") &&
          !tx.path.includes("piscine-js") &&
          tx.type == "xp") ||
        tx.path == "/oujda/module/piscine-js"
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

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

  // Get SVG dimensions
  const width = svg.clientWidth || 800;
  const height = svg.clientHeight || 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  // Clear previous content
  svg.innerHTML = "";

  // Calculate scales
  const maxXP = Math.max(...dataPoints.map((d) => d.xp));
  const xScale =
    (width - padding.left - padding.right) / (dataPoints.length - 1);
  const yScale = (height - padding.top - padding.bottom) / maxXP;

  // Create stepped area path data
  let areaPathData = `M ${padding.left} ${height - padding.bottom}`;
  let linePathData = "";

  dataPoints.forEach((point, i) => {
    const x = padding.left + i * xScale;
    const y = height - padding.bottom - point.xp * yScale;

    if (i === 0) {
      linePathData = `M ${x} ${y}`;
      areaPathData += ` L ${x} ${y}`;
    } else {
      const prevY = height - padding.bottom - dataPoints[i - 1].xp * yScale;
      linePathData += ` L ${x - xScale / 2} ${prevY} L ${
        x - xScale / 2
      } ${y} L ${x} ${y}`;
      areaPathData += ` L ${x - xScale / 2} ${prevY} L ${
        x - xScale / 2
      } ${y} L ${x} ${y}`;
    }
  });

  // Complete the area path by closing it at the bottom
  areaPathData += ` L ${padding.left + (dataPoints.length - 1) * xScale} ${
    height - padding.bottom
  } Z`;

  // Create grid lines and labels
  const gridLines = [];
  const yLabels = [];
  const numGridLines = 5;

  for (let i = 0; i <= numGridLines; i++) {
    const y =
      height -
      padding.bottom -
      ((height - padding.top - padding.bottom) * i) / numGridLines;
    const xpValue = (maxXP * i) / numGridLines;

    gridLines.push(`
      <line
        x1="${padding.left}"
        y1="${y}"
        x2="${width - padding.right}"
        y2="${y}"
        stroke="var(--chart-grid)"
        stroke-width="1"
        stroke-dasharray="4 4"
      />
    `);

    yLabels.push(`
      <text 
        x="${padding.left - 10}" 
        y="${y}" 
        fill="var(--muted-foreground)"
        text-anchor="end"
        dominant-baseline="middle"
        style="font-size: 12px"
      >${formatXP(Math.round(xpValue))}</text>
    `);
  }

  // Add date labels on x-axis (first, middle, and last)
  const xLabels = [];
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  [0, Math.floor(dataPoints.length / 2), dataPoints.length - 1].forEach((i) => {
    if (i < dataPoints.length) {
      const x = padding.left + i * xScale;
      const date = dataPoints[i].date;
      xLabels.push(`
        <text 
          x="${x}" 
          y="${height - padding.bottom + 20}" 
          fill="var(--muted-foreground)"
          text-anchor="middle"
          style="font-size: 12px"
        >${dateFormatter.format(date)}</text>
      `);
    }
  });

  // Add SVG elements
  svg.innerHTML = `
    <defs>
      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="var(--chart-primary)" stop-opacity="0.7" />
        <stop offset="100%" stop-color="var(--chart-primary)" stop-opacity="0.1" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    <!-- Grid lines -->
    ${gridLines.join("")}
    
    <!-- Y-axis labels -->
    ${yLabels.join("")}
    
    <!-- X-axis labels -->
    ${xLabels.join("")}
    
    <!-- X-axis line -->
    <line
      x1="${padding.left}"
      y1="${height - padding.bottom}"
      x2="${width - padding.right}"
      y2="${height - padding.bottom}"
      stroke="var(--border)"
      stroke-width="1"
    />
    
    <!-- Y-axis line -->
    <line
      x1="${padding.left}"
      y1="${padding.top}"
      x2="${padding.left}"
      y2="${height - padding.bottom}"
      stroke="var(--border)"
      stroke-width="1"
    />
    
    <!-- Area fill -->
    <path 
      d="${areaPathData}"
      fill="url(#areaGradient)"
    >
      <animate 
        attributeName="opacity" 
        from="0" 
        to="1" 
        dur="1.5s" 
        fill="freeze" 
      />
    </path>
    
    <!-- Stepped Line -->
    <path
      d="${linePathData}"
      stroke="var(--chart-primary)"
      stroke-width="2.5"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      filter="url(#glow)"
    >
      <animate 
        attributeName="stroke-dasharray" 
        from="${linePathData.length} ${linePathData.length}" 
        to="0 ${linePathData.length}" 
        dur="2s" 
        fill="freeze" 
      />
    </path>
    
    <!-- Data points with pulse animation -->
    ${dataPoints
      .map((point, i) => {
        const x = padding.left + i * xScale;
        const y = height - padding.bottom - point.xp * yScale;
        const animationDelay = i * 100;

        return `
        <g class="data-point-group" data-index="${i}" data-xp="${
          point.xp
        }" data-date="${point.date.toISOString()}">
          <!-- Pulse animation -->
          <circle 
            cx="${x}" 
            cy="${y}" 
            r="6"
            fill="var(--chart-primary)"
            opacity="0"
            class="pulse-circle"
          >
            <animate 
              attributeName="r" 
              from="4" 
              to="12" 
              dur="1.5s" 
              begin="${animationDelay}ms"
              repeatCount="indefinite"
            />
            <animate 
              attributeName="opacity" 
              from="0.6" 
              to="0" 
              dur="1.5s" 
              begin="${animationDelay}ms"
              repeatCount="indefinite"
            />
          </circle>
          
          <!-- Actual data point -->
          <circle 
            cx="${x}" 
            cy="${y}" 
            r="4"
            fill="var(--chart-primary)"
            stroke="var(--background)"
            stroke-width="1.5"
            class="data-point"
          />
        </g>
      `;
      })
      .join("")}
  `;

  // Add tooltip functionality
  setupTooltip(svg, dataPoints, xScale, yScale, padding, height);
}

function setupTooltip(svg, dataPoints, xScale, yScale, padding, height) {
  if (!svg || !dataPoints || dataPoints.length === 0) return;

  // Create tooltip element if it doesn't exist
  let tooltip = document.querySelector(".chart-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "chart-tooltip";
    document.body.appendChild(tooltip);
  }

  // Add mouse move event to SVG
  svg.addEventListener("mousemove", (e) => {
    const svgRect = svg.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;

    // Find closest data point
    const xPos = mouseX - padding.left;
    const pointIndex = Math.min(
      Math.max(0, Math.round(xPos / xScale)),
      dataPoints.length - 1
    );

    const point = dataPoints[pointIndex];

    // Format date
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Update tooltip content and position
    tooltip.innerHTML = `
      <div style="font-weight: 500">${dateFormatter.format(point.date)}</div>
      <div>${formatXP(point.xp)}</div>
    `;

    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY - 40}px`;
    tooltip.style.opacity = "1";

    // Highlight the point
    const circles = svg.querySelectorAll(".data-point");
    circles.forEach((circle, i) => {
      if (i === pointIndex) {
        circle.setAttribute("r", "6");
        circle.setAttribute("stroke-width", "2");
      } else {
        circle.setAttribute("r", "4");
        circle.setAttribute("stroke-width", "1.5");
      }
    });
  });
}
