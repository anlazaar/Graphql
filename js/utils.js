export function projectNameFormater(projectName) {
  return projectName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatXP(xp) {
  if (xp >= 1000000) {
    return Math.round(xp / 1000000) + " MB";
  } else if (xp >= 100000) {
    return Math.round(xp / 1000) + " kB";
  } else if (xp >= 1000) {
    return (xp / 1000).toFixed(1).replace(/\.0$/, "") + " kB";
  } else {
    return xp + " B";
  }
}

export function totalXPCalculate(transactions) {
  const totalXP = transactions
    ? transactions.reduce((sum, tx) => {
        if (
          (tx.path.startsWith("/oujda/module/") &&
            !tx.path.includes("onboarding") &&
            !tx.path.includes("piscine-js") &&
            tx.type == "xp") ||
          tx.path == "/oujda/module/piscine-js"
        ) {
          return sum + tx.amount;
        }
        return sum;
      }, 0)
    : 0;

  console.log("TOTAL XP: ", totalXP);
  return totalXP;
}

export function completedProjectsCalculation(progresses) {
  if (!progresses || progresses.length === 0) {
    console.error("No progress data available");
    return 0;
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
  const successfulProjects = projectResults.filter((p) => p.grade >= 1).length;

  return successfulProjects;
}

export function auditRatioCalculator(transactions = []) {
  const { auditsDone, auditsReceived } = transactions.reduce(
    (acc, { type, amount }) => {
      if (type === "up") acc.auditsDone += amount;
      else if (type === "down") acc.auditsReceived += amount;
      return acc;
    },
    { auditsDone: 0, auditsReceived: 0 }
  );

  if (!auditsReceived) return "0.0";

  return (Math.ceil((auditsDone / auditsReceived) * 100) / 100).toFixed(1);
}
