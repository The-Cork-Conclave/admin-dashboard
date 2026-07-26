import { MemberDetailsView } from "./_components/member-details-view";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MemberDetailsView memberId={id} />;
}
