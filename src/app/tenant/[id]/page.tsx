import { GetContentData } from "../../lib/apiFunctions";
import { Tenant as TenantType } from "../../types";

function isTenant(obj: unknown): obj is TenantType {
  if (typeof obj !== "object" || obj === null) return false;

  const tenant = obj as Record<string, unknown>;
  return (
    typeof tenant.id === "string" &&
    typeof tenant.name === "string" &&
    typeof tenant.type === "string"
  );
}

function isTenantArray(data: unknown): data is TenantType[] {
  return Array.isArray(data) && data.every(isTenant);
}

export default async function Page() {
  // let tenants: TenantType[] | null = null;

  const response = await GetContentData("Get Tenants");

  const result =
    typeof response === "object" && response !== null && "data" in response
      ? (response as { data: unknown }).data
      : null;

  if (isTenantArray(result)) {
    // tenants = result;
  } else {
    console.warn("Invalid data received from backend", response);
  }

  // const tenant = tenants?.find(
  //   (tenant) => tenant.id === "907b5b8a-3e2b-4b5f-bbb3-9f5f99fb5c37"
  // );

  // let userResult;
  // let propertyResult;

  // if (tenant?.id) {
  //   userResult = await PostContentData("Get Users By Tenant", {
  //     id: tenant?.id as string,
  //   });
  //   propertyResult = await PostContentData("Get Properties By Tenant", {
  //     id: tenant?.id as string,
  //   });
  // }

  // console.log("User Result:", userResult);
  // console.log("Property Result:", propertyResult);

  return <div></div>;

  // return (
  //   <div>
  //     <Tenant
  //       data={tenant as Tenant}
  //       users={userResult?.data}
  //       properties={propertyResult?.data}
  //     />
  //   </div>
  // );
}

// import React from "react";
// import { headers } from "next/headers";
// import { ServicePageParams } from "@/lib/ContentApiInterfaces";
// import { GetItemList, GetProperty } from "@/lib/ContentApi";
// import PageModel from "@/app/components/PageModel";

// async function Page({ params }: ServicePageParams) {
//   const property = await GetProperty(params.dashboard);
//   const pageData = await GetItemList(params.service);
//   const headersList = headers();
//   const domain = headersList.get("host");

//   return (
//     <PageModel
//       page={pageData?.data}
//       propertyId={params.dashboard}
//       propertyColor={property?.color}
//       titleAfterHero={true}
//       backRoute={"/" + params.dashboard}
//       domain={domain}
//     />
//   );
// }

// export default Page;
