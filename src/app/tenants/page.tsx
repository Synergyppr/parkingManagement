import React from "react";
import { GetContentData } from "../lib/apiFunctions";
import Tenants from "../components/Tenants";

interface Tenant {
  id: string;
  name: string;
  type: string;
  description?: string;
  isActive?: boolean;
}

// Type guard to check if an object is a Tenant
function isTenant(obj: unknown): obj is Tenant {
  if (typeof obj !== "object" || obj === null) return false;

  const tenant = obj as Record<string, unknown>;
  return (
    typeof tenant.id === "string" &&
    typeof tenant.name === "string" &&
    typeof tenant.type === "string"
  );
}

// Type guard to check if array is Tenant[]
function isTenantArray(data: unknown): data is Tenant[] {
  return Array.isArray(data) && data.every(isTenant);
}

async function Page({ params }: { params: Record<string, string> }) {
  let tenants: Tenant[] | null = null;

  if (params) {
    const response = await GetContentData("Get Tenants");

    const result =
      typeof response === "object" && response !== null && "data" in response
        ? (response as { data: unknown }).data
        : null;

    console.log("Response from Get Tenants:", response);

    if (isTenantArray(result)) {
      tenants = result;
    } else {
      console.warn("Invalid data received from backend", response);
    }
  }

  return <Tenants data={{ data: tenants }} />;
}

export default Page;
