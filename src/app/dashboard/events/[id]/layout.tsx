
import { getEvent } from './_lib/get-event'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}) {
  const post = await getEvent(params.id)
  return {
    title: post.slug,
    description: post.slug,
  }
}



export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}