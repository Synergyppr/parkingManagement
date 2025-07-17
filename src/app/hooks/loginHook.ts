// hooks/useAuthRedirect.ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn !== "true") {
      router.replace("/"); // Redirect to login
    }
  }, [router]);
}
