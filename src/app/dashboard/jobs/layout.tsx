import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cork Conclave - Jobs",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
