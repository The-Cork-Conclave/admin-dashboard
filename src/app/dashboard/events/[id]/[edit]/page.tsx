import { EditEventPageClient } from "./_components/edit-event-page-client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="w-full max-w-5xl mx-auto p-6 md:p-10 lg:p-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
          Update Event
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Fill in the details below to update this event.
        </p>
      </header>

      <EditEventPageClient id={id} />
    </main>
  );
}
