// Tenants
const GetTenantsEndpoint = process.env.GET_TENANTS_ENDPOINT + "";
const CreateAndUpdateTenantEndpoint =
  process.env.CREATE_AND_UPDATE_TENANT_ENDPOINT + "";
const DeleteTenantEndpoint = process.env.DELETE_TENANT_ENDPOINT + "";
// Users
const GetUsersByTenantEndpoint = process.env.GET_USERS_BY_TENANT_ENDPOINT + "";
const GetAppUserByEndpoint = process.env.GET_APP_USER_BY_ENDPOINT + "";
const CreateAndUpdateAppUserByEndpoint =
  process.env.CREATE_AND_UPDATE_APP_USER_BY_ENDPOINT + "";
const DeleteAppUserByEndpoint = process.env.DELETE_APP_USER_BY_ENDPOINT + "";
// Properties
const GetPropertiesByTenantEndpoint =
  process.env.GET_PROPERTIES_BY_TENANT_ENDPOINT + "";
const GetPropertyByEndpoint = process.env.GET_PROPERTY_BY_ENDPOINT + "";
const CreateAndUpdatePropertyEndpoint =
  process.env.CREATE_AND_UPDATE_PROPERTY_ENDPOINT + "";
const DeletePropertyEndpoint = process.env.DELETE_PROPERTY_ENDPOINT + "";
// Valet Tickets
const GetValetTicketByEndpoint = process.env.GET_VALET_TICKET_BY_ENDPOINT + ""; // api/getTicket
const GetTicketDetailsByTicketIdEndpoint =
  process.env.GET_TICKET_DETAILS_BY_TICKET_ID_ENDPOINT + "";
const GetVehicleByPatronTicketIdEndpoint =
  process.env.GET_VEHICLE_BY_PATRON_TICKET_ID_ENDPOINT + ""; // api/getVehicle/byTicketId
const GetVehicleByPatronPhoneEndpoint =
  process.env.GET_VEHICLE_BY_PATRON_PHONE_ENDPOINT + ""; // api/getVehicle/byPhone
const CreateValetTicketEndpoint = process.env.CREATE_VALET_TICKET_ENDPOINT + ""; // api/vehicleCheckIn
const UpdateValetTicketStatusEndpoint =
  process.env.UPDATE_VALET_TICKET_STATUS_ENDPOINT + ""; // api/vehicleStatus
const CreatePatronRatingEndpoint =
  process.env.CREATE_PATRON_RATING_ENDPOINT + ""; // api/patronRating
const ReadNotificationEndpoint = process.env.READ_NOTIFICATION_ENDPOINT + "";
const UnreadNotificationEndpoint =
  process.env.UNREAD_NOTIFICATION_ENDPOINT + "";
const NotificationHubEndpoint = process.env.NOTIFICATION_HUB_ENDPOINT + "";

const Endpoints = [
  {
    name: "Get Tenants",
    endpoint: GetTenantsEndpoint,
  },
  {
    name: "Create And Update Tenant",
    endpoint: CreateAndUpdateTenantEndpoint,
  },
  {
    name: "Delete Tenant",
    endpoint: DeleteTenantEndpoint,
  },
  {
    name: "Get Users By Tenant",
    endpoint: GetUsersByTenantEndpoint,
  },
  {
    name: "Get App User By",
    endpoint: GetAppUserByEndpoint,
  },
  {
    name: "Create And Update App User",
    endpoint: CreateAndUpdateAppUserByEndpoint,
  },
  {
    name: "Delete App User",
    endpoint: DeleteAppUserByEndpoint,
  },
  {
    name: "Get Properties By Tenant",
    endpoint: GetPropertiesByTenantEndpoint,
  },
  {
    name: "Get Property By",
    endpoint: GetPropertyByEndpoint,
  },
  {
    name: "Create And Update Property",
    endpoint: CreateAndUpdatePropertyEndpoint,
  },
  {
    name: "Delete Property",
    endpoint: DeletePropertyEndpoint,
  },
  {
    name: "Get Valet Ticket By",
    endpoint: GetValetTicketByEndpoint,
  },
  {
    name: "Get Ticket Details By Ticket ID",
    endpoint: GetTicketDetailsByTicketIdEndpoint,
  },
  {
    name: "Get Vehicle By Patron Ticket ID",
    endpoint: GetVehicleByPatronTicketIdEndpoint,
  },
  {
    name: "Get Vehicle By Patron Phone",
    endpoint: GetVehicleByPatronPhoneEndpoint,
  },
  {
    name: "Create Valet Ticket",
    endpoint: CreateValetTicketEndpoint,
  },
  {
    name: "Update Valet Ticket Status",
    endpoint: UpdateValetTicketStatusEndpoint,
  },
  {
    name: "Create Patron Rating",
    endpoint: CreatePatronRatingEndpoint,
  },
  {
    name: "Read Notification",
    endpoint: ReadNotificationEndpoint,
  },
  {
    name: "Unread Notification",
    endpoint: UnreadNotificationEndpoint,
  },
  {
    name: "Notification Hub",
    endpoint: NotificationHubEndpoint,
  },
];

export async function PostContentData(
  endpointName: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  let data = [];
  try {
    const endpoint = Endpoints.find((e) => e.name === endpointName)?.endpoint;
    if (!endpoint) {
      throw new Error(`Endpoint not found for name '${endpointName}'`);
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "*/*",
    });

    const response = await fetch(`${endpoint}`, {
      method: "POST",
      headers: headers,
      cache: "no-store",
      body: JSON.stringify(body),
    });

    data = await response.json();
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.name);
      console.log(err.message);
      console.log(err.stack);
    }
  }
  return Promise.resolve(data);
}

export async function GetContentData(
  endpointName: string
): Promise<Record<string, unknown>[]> {
  let data = [];
  try {
    const endpoint2 = Endpoints.filter(
      (e) => e.name?.toLowerCase() === endpointName?.toLowerCase()
    )[0]?.endpoint;
    if (!endpoint2) {
      throw new Error(`Endpoint not found for name '${endpointName}'`);
    }

    const res = await fetch(`${endpoint2}`, {
      method: "GET",
      cache: "no-store",
    });

    data = await res.json();
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.name);
      console.error(err.message);
      console.error(err.stack);
    }
    return [];
  }
  return Promise.resolve(data);
}
