import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cork Conclave - Events',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}