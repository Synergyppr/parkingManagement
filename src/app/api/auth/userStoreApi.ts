export async function validateUser({
  username,
  password,
  propertyId,
}: {
  username: string;
  password: string;
  propertyId: string;
}) {
  try {
    const loginForm = {
      username,
      temporaryPassword: password,
      device: "web",
      location: propertyId,
    };

    const response = await fetch("/api/proxy-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginForm),
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Login failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Login fetch error:", error);
    return undefined;
  }
}
