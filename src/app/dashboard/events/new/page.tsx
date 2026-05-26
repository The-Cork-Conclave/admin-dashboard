"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";

import type { DraftQuestion, FormInput } from "./_components/constants";
import { postCreateEvent } from "./_components/constants";
import { CreateEventForm } from "./_components/create-event-form";
import { RegistrationQuestions } from "./_components/registration-questions";

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(1);
  const [eventDraft, setEventDraft] = useState<FormInput | null>(null);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!eventDraft) {
        throw new Error("Event details are missing. Go back and complete step 1.");
      }
      return postCreateEvent({ event: eventDraft, questions });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created", { description: "Your event has been saved as a draft." });
      router.push(`/dashboard/events/${encodeURIComponent(data.id)}`);
    },
    onError: (err: Error) => {
      toast.error("Could not create event", { description: err.message });
    },
  });

  const handleNext = (data: FormInput) => {
    setEventDraft(data);
    setTab(2);
  };

  const previous = () => {
    setTab(1);
  };

  const handleSubmit = () => {
    mutation.mutate();
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 md:p-10 lg:p-12">
      <div className="w-full">
        <Progress value={(tab / 2) * 100} className="w-full" />
      </div>

      <header>
        <h1 className="flex items-center gap-3 font-semibold text-2xl tracking-tight">
          {tab === 1 ? "Create Event" : "Registration Questions"}
        </h1>
        <p className="mt-1.5 text-muted-foreground text-sm">
          {tab === 1
            ? "Fill in the details below to create a new Cork Conclave event."
            : "Add optional registration questions for attendees."}
        </p>
      </header>

      <div>
        {tab === 1 ? <CreateEventForm defaultValues={eventDraft ?? undefined} onNext={handleNext} /> : null}
        {tab === 2 && eventDraft ? (
          <RegistrationQuestions
            previous={previous}
            questions={questions}
            onQuestionsChange={setQuestions}
            onSubmit={handleSubmit}
            isSubmitting={mutation.isPending}
          />
        ) : null}
      </div>
    </main>
  );
}
