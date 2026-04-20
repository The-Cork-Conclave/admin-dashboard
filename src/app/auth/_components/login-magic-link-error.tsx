"use client";

import { useSearchParams } from "next/navigation";

export function LoginMagicLinkError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error !== "magic_link_invalid") {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-left text-destructive text-sm"
    >
      This sign-in link is invalid or has expired. Request a new link below.
    </div>
  );
}
