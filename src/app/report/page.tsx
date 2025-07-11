import React, { Suspense } from "react";
import Report from "../components/Report";
import PageLoader from "../components/elements/PageLoader";

// Guest/Visitor Report Page

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Report />
    </Suspense>
  );
}
