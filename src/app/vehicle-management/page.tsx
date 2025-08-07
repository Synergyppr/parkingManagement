import React, { Suspense } from "react";
import VehicleManager from "../components/VehicleManager";
import PageLoader from "../components/elements/PageLoader";

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <VehicleManager />
    </Suspense>
  );
}
