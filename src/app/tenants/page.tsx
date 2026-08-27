import { GetContentData } from "../lib/apiFunctions";
import { Tenant } from "../types";
import Tenants from "../components/Tenants";

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
  const allowedTenantId = process.env.TENANT_ID || "";

  let tenants: Tenant[] | null = null;

  const response = await GetContentData("Get Tenants");

  console.log("=== TENANTS API RESPONSE ===", JSON.stringify(response, null, 2));

  const result =
    typeof response === "object" && response !== null && "data" in response
      ? (response as { data: unknown }).data
      : null;

  if (isTenantArray(result)) {
    tenants = allowedTenantId
      ? result.filter((t) => t.id === allowedTenantId)
      : result;
    console.log("=== TENANTS PARSED DATA ===", JSON.stringify(tenants, null, 2));
  } else {
    console.warn("Invalid data received from backend", response);
  }

  return (
    <div>
      <Tenants data={{ data: tenants as Tenant[] }} />
    </div>
  );
}
