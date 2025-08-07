import React, { Suspense } from "react";
import PageLoader from "../components/elements/PageLoader";
import PrivacyPolicy from "../components/PrivacyPolicy";

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PrivacyPolicy />
    </Suspense>
  );
}
