import React, { Suspense } from "react";
import TipsReport from "../../components/TipsReport";
import PageLoader from "../../components/elements/PageLoader";

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TipsReport />
    </Suspense>
  );
}
