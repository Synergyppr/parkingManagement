import React from "react";
import Dashboard from "../components/Dashboard";

interface PageProps {
  searchParams?: { [key: string]: string | undefined };
}

export default function DashboardPage({ searchParams }: PageProps) {
  // Pull a status query param server-side (if present) and forward to client
  const statusParam = searchParams?.status ?? null;

  return <Dashboard initialStatus={statusParam} />;
}
