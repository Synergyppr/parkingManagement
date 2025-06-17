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
      const response = await fetch("http://104.46.113.1:8080/api/ValetParking/Login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          temporaryPassword: password,
          device: "web", // Adjust as needed
          location: propertyId, // Assuming propertyId maps to location
        }),
      });
  
      if (response.status === 401) {
        return null; // Unauthorized
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
  