import React, { Suspense } from "react";
import RequestCar from "../components/RequestCar";
import PageLoader from "../components/elements/PageLoader";

// Guest/Visitor Request Page

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RequestCar />
    </Suspense>
  );
}
