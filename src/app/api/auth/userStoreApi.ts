export async function validateUser({
  username,
  temporaryPassword,
  device,
  latitude,
  longitude,
  location,
}: {
  username: string;
  temporaryPassword: string;
  device?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
}) {
  // CHV
  // const latitude = 18.458770636752906;
  // const longitude = -66.0760822589064;

  //new - closer to condado
  // const latitude = 18.459051035458092;
  // const longitude = -66.07700161860517;

  // 250
  // const latitude = 18.426434330459355;
  // const longitude = -66.05954507209249;

  const loginForm = {
    username,
    temporaryPassword: temporaryPassword,
    device,
    location,
    latitude: latitude || 0,
    longitude: longitude || 0,
  };

  // console.log("Login form data:", loginForm);

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginForm),
    });

    // Only succeed if response is 200
    if (response.status === 200) {
      const data = await response.json();
      return data;
    }

    if (response.status === 401) {
      throw new Error("Invalid username or password.");
    }

    if (response.status === 403) {
      throw new Error("Your account is not authorized to access the system.");
    }

    if (response.status === 500) {
      throw new Error("Internal server error. Please try again later.");
    }

    throw new Error(`Login failed with status ${response.status}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Login fetch error:", error.message);
      throw new Error(
        error.message || "Unexpected error occurred during login."
      );
    } else {
      console.error("Login fetch error:", error);
      throw new Error("Unexpected error occurred during login.");
    }
  }
}
