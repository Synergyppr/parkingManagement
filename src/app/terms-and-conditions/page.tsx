import React, { Suspense } from "react";
import PageLoader from "../components/elements/PageLoader";
import TermsAndConditions from "../components/TermsAndConditions";

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TermsAndConditions />
    </Suspense>
  );
}
