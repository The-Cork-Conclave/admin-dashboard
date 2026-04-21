import { EditEventPageClient } from "./_components/edit-event-page-client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-5xl p-6 md:p-10 lg:p-12">
      <header className="mb-8">
        <h1 className="flex items-center gap-3 font-semibold text-2xl tracking-tight">Update Event</h1>
        <p className="mt-1.5 text-muted-foreground text-sm">Fill in the details below to update this event.</p>
      </header>

      <EditEventPageClient id={id} />
    </main>
  );
}
