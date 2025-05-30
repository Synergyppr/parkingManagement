import React from "react";
import { GetContentData } from "../lib/apiFunctions";
import Tenants from "../components/Tenants";

// /api/ValetParking/GetTenants

interface PageParams {
  [key: string]: string | undefined;
}

async function Page({ params }: { params: PageParams }) {
  let result;
  if (params) {
    result = await GetContentData("Get Tenants");
  }

  return (
    <>
      <Tenants data={result} />
    </>
  );
}

export default Page;
