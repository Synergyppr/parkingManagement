import React, { Suspense } from "react";
import Dashboard from "../components/Dashboard";
import PageLoader from "../components/elements/PageLoader";
import { InferGetServerSidePropsType } from "next"; // <-- correctly imports the type for server-side props

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DashboardPage({ searchParams }: InferGetServerSidePropsType<any>) {
  const statusParam =
    Array.isArray(searchParams?.status) ? searchParams?.status[0] : searchParams?.status ?? null;

  return (
    <Suspense fallback={<PageLoader />}>
      <Dashboard initialStatus={statusParam} />
    </Suspense>
  );
}
