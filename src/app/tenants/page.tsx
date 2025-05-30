import { GetContentData } from "../lib/apiFunctions";
import Tenants from "../components/Tenants";

interface Tenant {
  id: string;
  name: string;
  type: string;
  description?: string;
  isActive?: boolean;
}

function isTenant(obj: unknown): obj is Tenant {
  if (typeof obj !== "object" || obj === null) return false;

  const tenant = obj as Record<string, unknown>;
  return (
    typeof tenant.id === "string" &&
    typeof tenant.name === "string" &&
    typeof tenant.type === "string"
  );
}

function isTenantArray(data: unknown): data is Tenant[] {
  return Array.isArray(data) && data.every(isTenant);
}

export default async function Page() {
  let tenants: Tenant[] | null = null;

  const response = await GetContentData("Get Tenants");

  const result =
    typeof response === "object" && response !== null && "data" in response
      ? (response as { data: unknown }).data
      : null;

  if (isTenantArray(result)) {
    tenants = result;
  } else {
    console.warn("Invalid data received from backend", response);
  }

  return <Tenants data={{ data: tenants }} />;
}
