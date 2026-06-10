"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { auth } from "@/lib/clients/firebase-client";

type LogoutButtonProps = {
  className?: string;
  icon?: ReactNode;
  label?: string;
};

export default function LogoutButton({
  className = "q-button q-button-secondary",
  icon,
  label = "Sign out",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await signOut(auth);
      await fetch("/api/session", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className}
      disabled={isLoading}
    >
      {icon}
      {isLoading ? "Signing out..." : label}
    </button>
  );
}
