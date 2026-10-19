import React, { Suspense } from "react";
import ScanTicket from "../components/ScanTicket";
import PageLoader from "../components/elements/PageLoader";

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ScanTicket />
    </Suspense>
  );
}
