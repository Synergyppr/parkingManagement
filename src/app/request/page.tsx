import React, { Suspense } from "react";
import RequestCar from "../components/RequestCar";
import PageLoader from "../components/elements/PageLoader";

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RequestCar />
    </Suspense>
  );
}
