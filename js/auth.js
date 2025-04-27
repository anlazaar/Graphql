const AUTH_URL = "https://learn.zone01oujda.ma/api/auth/signin";

export function logout() {
  localStorage.removeItem("jwt");
  window.location.reload();
}

export async function handleLogin(e) {
  e.preventDefault();
  const usernameOrEmail = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const credentials = btoa(`${usernameOrEmail}:${password}`);

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
    jwt = jwt.replaceAll('"', ""); // Remove any quotes

    // Validate JWT format [header, payload, signature]
    const parts = jwt.split(".");
    if (parts.length !== 3) {
      throw new Error(
        `Invalid JWT format: expected 3 parts, got ${parts.length}`
      );
    }

    localStorage.setItem("jwt", jwt);

    return true; // Return success
  } catch (error) {
    console.error("Login error:", error);
    document.getElementById("errorMessage").textContent =
      "failed to login !, verify your credentials and try again";
    console.log(error.message);
    return false;
  }
}
