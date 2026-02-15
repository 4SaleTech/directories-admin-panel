"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/application/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, admin, token } = useAuth();

  // Check if Console auth is in progress
  const isConsoleAuthInProgress =
    typeof window !== "undefined" &&
    (window.location.search.includes("admin_token=") ||
      sessionStorage.getItem("console_auth") === "true" ||
      window.parent !== window); // Embedded in iframe (postMessage flow)

  useEffect(() => {
    // Wait for auth to initialize before redirecting
    if (isAuthenticated && admin && token) {
      router.push("/dashboard");
    } else if (!isAuthenticated && admin === null && token === null) {
      // Don't redirect to login if Console auth is in progress
      if (!isConsoleAuthInProgress) {
        router.push("/login");
      }
    }
  }, [isAuthenticated, admin, token, router, isConsoleAuthInProgress]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <p>{isConsoleAuthInProgress ? "Authenticating..." : "Loading..."}</p>
    </div>
  );
}
