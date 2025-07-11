import React, { Suspense } from "react";
import Location from "../components/Location";
import PageLoader from "../components/elements/PageLoader";

// Guest/Visitor Location Page

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Location />
    </Suspense>
  );
}
