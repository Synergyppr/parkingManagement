export async function getVehicleList(propertyId: string) {
  let data = {};
  console.log("Data sent to backend:", { Property: propertyId });

  try {
    const response = await fetch(
      "http://104.46.113.1:8080/api/ValetParking/GetValetTicketBy",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify({ id: propertyId }), // Corrected structure
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    data = await response.json();
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.name, err.message, err.stack);
    }
  }
  console.log("Data received from backend:", data);
  return data;
}

export async function checkIn(vehicleData: Record<string, string>) {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "*/*",
  });

  const response = await fetch(
    "http://104.46.113.1:8080/api/ValetParking/CreateValetTicket",
    {
      method: "POST",
      headers,
      body: JSON.stringify(vehicleData),
    }
  );

  const data = await response.json();
  console.log("Data received from backend:", data);
  return data;
}