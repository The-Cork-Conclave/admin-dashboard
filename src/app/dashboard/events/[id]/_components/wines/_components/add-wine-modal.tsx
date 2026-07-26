/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/refs */
"use client";

import * as React from "react";

import Image from "next/image";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Wine } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import useDebouncedValue from "@/hooks/use-debounced-value";
import { cloudinaryDisplayUrl } from "@/lib/cloudinary-client-upload";
import { cn } from "@/lib/utils";

import { WINE_COLORS } from "../_lib/types";
import { announceEventWine, searchWinesCatalog, type WineCatalogItem, WinesApiError } from "../_lib/wines-api.client";

const formSchema = z.object({
  name: z.string().trim().min(1, { message: "Wine name is required." }),
  producer: z.string().trim().min(1, { message: "Producer is required." }),
  year: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}$/.test(value), { message: "Enter a 4-digit year." }),
  grapeVariety: z.string(),
  wineType: z.string().trim().min(1, { message: "Wine type is required." }),
  alcoholLevel: z.string(),
  imageUrl: z.string(),
});

type FormInput = z.infer<typeof formSchema>;

const INITIAL: FormInput = {
  name: "",
  producer: "",
  year: "",
  grapeVariety: "",
  wineType: "",
  alcoholLevel: "",
  imageUrl: "",
};

const WINE_TYPE_OPTIONS = [...WINE_COLORS];

type AddWineModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSuccess: () => void | Promise<void>;
};

function optionalTrim(value: string): string | null {
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function WineTypeField({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Select or type a type"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className="pr-9"
        autoComplete="off"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute top-1/2 right-0.5 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Show wine type options"
          >
            <ChevronDown className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={4}
          className="z-100 gap-0 p-1"
          style={{ width: containerRef.current?.offsetWidth }}
        >
          {WINE_TYPE_OPTIONS.map((option) => {
            const selected = value.trim().toLowerCase() === option.toLowerCase();
            return (
              <button
                key={option}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  selected && "bg-accent/60",
                )}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                <Check className={cn("size-3.5 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                {option}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function WineNameField({
  value,
  onChange,
  onSelectWine,
  disabled,
  invalid,
  modalOpen,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelectWine: (wine: WineCatalogItem) => void;
  disabled?: boolean;
  invalid?: boolean;
  modalOpen: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [panelWidth, setPanelWidth] = React.useState(320);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const debouncedName = useDebouncedValue(value, 350);
  const searchQ = debouncedName.trim();

  const searchQuery = useQuery({
    queryKey: ["wines-catalog-search", searchQ],
    queryFn: () =>
      searchWinesCatalog({
        q: searchQ,
        limit: 10,
      }),
    enabled: modalOpen && searchQ.length >= 2,
    retry: 1,
    staleTime: 30_000,
  });

  const suggestions = searchQuery.data?.wines ?? [];
  const showPanel = open && searchQ.length >= 2;

  React.useEffect(() => {
    if (!modalOpen) {
      setOpen(false);
      return;
    }
    if (searchQ.length < 2) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [modalOpen, searchQ]);

  React.useLayoutEffect(() => {
    if (!showPanel) return;
    const width = containerRef.current?.offsetWidth ?? 0;
    if (width > 0) setPanelWidth(width);
  }, [showPanel]);

  return (
    <Popover
      open={showPanel}
      onOpenChange={(next) => {
        if (!next) setOpen(false);
      }}
    >
      <PopoverAnchor asChild>
        <div ref={containerRef} className="relative">
          <Input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (e.target.value.trim().length >= 2) setOpen(true);
            }}
            onFocus={() => {
              if (searchQ.length >= 2) setOpen(true);
            }}
            placeholder="e.g. Four Cousins"
            disabled={disabled}
            aria-invalid={invalid || undefined}
            className="pr-9"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute top-1/2 right-0.5 z-10 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Show matching wines"
            onClick={() => {
              if (searchQ.length >= 2) setOpen((prev) => !prev);
            }}
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
        className="z-100 gap-0 p-1"
        style={{ width: panelWidth, maxWidth: panelWidth }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {searchQuery.isFetching ? (
          <div className="px-2.5 py-2 text-muted-foreground text-sm">Searching…</div>
        ) : searchQuery.isError ? (
          <div className="px-2.5 py-2 text-destructive text-sm">
            {searchQuery.error instanceof Error ? searchQuery.error.message : "Search failed."}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="px-2.5 py-2 text-muted-foreground text-sm">
            No catalog matches — fill the form to add a new wine.
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {suggestions.map((wine) => {
              const imageSrc = wine.image_url?.trim() ? cloudinaryDisplayUrl(wine.image_url) : "";
              const selected = value.trim().toLowerCase() === wine.name.trim().toLowerCase();
              return (
                <button
                  key={wine.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none hover:bg-accent hover:text-accent-foreground",
                    selected && "bg-accent/60",
                  )}
                  onClick={() => {
                    onSelectWine(wine);
                    setOpen(false);
                  }}
                >
                  <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
                    {imageSrc ? (
                      <Image src={imageSrc} alt="" fill unoptimized className="object-cover" />
                    ) : (
                      <Wine className="size-4 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm">{wine.name}</div>
                    <div className="truncate text-muted-foreground text-xs">
                      {[wine.producer, wine.wine_type, wine.year].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <Check className={cn("size-3.5 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function AddWineModal({ open, onOpenChange, eventId, onSuccess }: AddWineModalProps) {
  const [pending, setPending] = React.useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: INITIAL,
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(INITIAL);
    setPending(false);
  }, [form, open]);

  const applyCatalogWine = (wine: WineCatalogItem) => {
    form.setValue("name", wine.name, { shouldDirty: true, shouldValidate: true });
    form.setValue("producer", wine.producer, { shouldDirty: true, shouldValidate: true });
    form.setValue("wineType", wine.wine_type || wine.color, { shouldDirty: true, shouldValidate: true });
    form.setValue("year", wine.year != null ? String(wine.year) : "", { shouldDirty: true, shouldValidate: true });
    form.setValue("alcoholLevel", wine.alcohol_level != null ? String(wine.alcohol_level) : "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("grapeVariety", wine.grape_variety?.trim() ?? "", { shouldDirty: true });
    form.setValue("imageUrl", wine.image_url?.trim() ?? "", { shouldDirty: true });
  };

  const submit = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    const values = form.getValues();
    setPending(true);

    try {
      const yearTrimmed = values.year.trim();
      const alcoholTrimmed = values.alcoholLevel.trim();
      const wineType = values.wineType.trim();
      await announceEventWine(eventId, {
        name: values.name.trim(),
        producer: values.producer.trim(),
        wine_type: wineType,
        year: yearTrimmed ? Number(yearTrimmed) : null,
        grape_variety: optionalTrim(values.grapeVariety),
        alcohol_level: alcoholTrimmed ? Number(alcoholTrimmed) : null,
        image_url: optionalTrim(values.imageUrl),
      });
      toast.success("Wine announced", { description: values.name.trim() });
      await onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof WinesApiError ? err.message : err instanceof Error ? err.message : "Could not announce wine.";
      toast.error(
        err instanceof WinesApiError && err.status === 409 ? "Wine already on this event" : "Announce failed",
        {
          description: message,
        },
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b bg-muted/20 px-6 py-5">
          <DialogTitle>Add &amp; Announce Wine</DialogTitle>
          <DialogDescription>Add the next wine being sampled. Attendees can review it in realtime.</DialogDescription>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => e.preventDefault()}>
          <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
            <FieldGroup className="gap-5">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Wine Name <span className="text-primary">*</span>
                    </FieldLabel>
                    <WineNameField
                      value={field.value}
                      onChange={field.onChange}
                      onSelectWine={applyCatalogWine}
                      disabled={pending}
                      invalid={fieldState.invalid}
                      modalOpen={open}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="producer"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        Producer / Winery <span className="text-primary">*</span>
                      </FieldLabel>
                      <Input {...field} placeholder="e.g. Château Margaux" disabled={pending} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="wineType"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        Wine Type <span className="text-primary">*</span>
                      </FieldLabel>
                      <WineTypeField
                        value={field.value}
                        onChange={field.onChange}
                        disabled={pending}
                        invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="year"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel>Year</FieldLabel>
                      <Input {...field} type="number" placeholder="e.g. 2015" disabled={pending} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="alcoholLevel"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel>Alcohol Level</FieldLabel>
                      <Input {...field} type="number" step="0.1" placeholder="e.g. 13.5" disabled={pending} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <Field className="gap-1.5">
                    <FieldLabel>Bottle Image</FieldLabel>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      folder={`cork-conclave/events/${eventId}/wines`}
                      disabled={pending}
                      maxSizeBytes={5 * 1024 * 1024}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <DialogFooter className="justify-end gap-3 border-t bg-muted/30 px-6 py-4">
            <div className="flex w-full flex-col items-stretch gap-2 pb-4 sm:w-auto sm:flex-row sm:items-center">
              <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)} size="lg">
                Cancel
              </Button>
              <Button type="button" disabled={pending} onClick={() => void submit()} size="lg">
                {pending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
