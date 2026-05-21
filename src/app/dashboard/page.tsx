import React, { Suspense } from "react";
import Dashboard from "../components/Dashboard";
import PageLoader from "../components/elements/PageLoader";

type SearchParams = {
  status?: string | string[];
};

type DashboardPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const statusParam = Array.isArray(params?.status)
    ? params.status[0]
    : params?.status ?? null;

  return (
    <Suspense fallback={<PageLoader />}>
      <Dashboard initialStatus={statusParam} />
    </Suspense>
  );
}
