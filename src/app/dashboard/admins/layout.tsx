import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cork Conclave - Admins",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
