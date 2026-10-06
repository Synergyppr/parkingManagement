import React, { Suspense } from "react";
import ReceiveVehicles from "../components/ReceiveVehicles"; // Receive Form & Vehicle List
import PageLoader from "../components/elements/PageLoader";

type SearchParams = {
  status?: string | string[];
};

type DashboardPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const statusParam = Array.isArray(params?.status)
    ? params.status[0]
    : params?.status ?? null;

  const quickVehicleWorkflow = process.env.QUICK_VEHICLE_WORKFLOW === "true";

  return (
    <Suspense fallback={<PageLoader />}>
      <ReceiveVehicles
        initialStatus={statusParam}
        quickVehicleWorkflow={quickVehicleWorkflow}
      />
    </Suspense>
  );
}
