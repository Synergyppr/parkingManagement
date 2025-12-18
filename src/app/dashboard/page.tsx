import React, { Suspense } from "react";
import Dashboard from "../components/Dashboard";
import PageLoader from "../components/elements/PageLoader";
import { InferGetServerSidePropsType } from "next"; // <-- correctly imports the type for server-side props
import { getServerSideProps } from "next/dist/build/templates/pages";

export default function DashboardPage({
  searchParams,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const statusParam = Array.isArray(searchParams?.status)
    ? searchParams?.status[0]
    : searchParams?.status ?? null;

  return (
    <Suspense fallback={<PageLoader />}>
      <Dashboard initialStatus={statusParam} />
    </Suspense>
  );
}
