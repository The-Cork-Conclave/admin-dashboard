import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cork Conclave - Finance",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
