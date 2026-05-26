"use client";

import * as React from "react";

import Image from "next/image";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CirclePlus, FileArchive, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteGalleryItem,
  fetchEventGallery,
  type GalleryItem,
  patchUpdateGalleryItem,
  postCreateGalleryItem,
} from "@/app/dashboard/events/[id]/_components/gallery/_lib/gallery-api.client";
import {
  collectZipImageFiles,
  GALLERY_ZIP_MAX_BYTES,
  GALLERY_ZIP_MAX_IMAGES,
  runGalleryZipImport,
  type ZipImportFailure,
  type ZipImportProgress,
} from "@/app/dashboard/events/[id]/_components/gallery/_lib/gallery-zip-import";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type AddForm = {
  url: string;
  caption: string;
  alt: string;
};

type EditForm = {
  url: string;
  caption: string;
  alt: string;
};

export default function Gallery({ id }: { id: string }) {
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<GalleryItem | null>(null);

  const [addForm, setAddForm] = React.useState<AddForm>({ url: "", caption: "", alt: "" });
  const [editForm, setEditForm] = React.useState<EditForm>({ url: "", caption: "", alt: "" });

  const zipInputRef = React.useRef<HTMLInputElement>(null);
  const [zipDialogOpen, setZipDialogOpen] = React.useState(false);
  const [zipPhase, setZipPhase] = React.useState<"reading" | "uploading" | "done">("reading");
  const [zipBusy, setZipBusy] = React.useState(false);
  const [zipProgress, setZipProgress] = React.useState<ZipImportProgress>({
    completed: 0,
    total: 0,
    currentPath: null,
  });
  const [zipFailures, setZipFailures] = React.useState<ZipImportFailure[]>([]);
  const [zipSuccessCount, setZipSuccessCount] = React.useState(0);

  const galleryQuery = useQuery({
    queryKey: ["eventGallery", id],
    queryFn: () => fetchEventGallery(id),
    enabled: Boolean(id?.trim()),
  });

  const createMutation = useMutation({
    mutationFn: (input: { url: string; caption?: string; alt?: string }) =>
      postCreateGalleryItem(id, {
        url: input.url,
        caption: input.caption,
        alt: input.alt,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["eventGallery", id] });
      setIsAddOpen(false);
      setAddForm({ url: "", caption: "", alt: "" });
      toast.success("Image added successfully");
    },
    onError: (err: Error) => {
      toast.error("Could not add image", { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: { galleryId: string; url: string; caption?: string; alt?: string }) =>
      patchUpdateGalleryItem(id, input.galleryId, {
        url: input.url,
        caption: input.caption,
        alt: input.alt,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["eventGallery", id] });
      setIsEditOpen(false);
      setSelected(null);
      toast.success("Image updated successfully");
    },
    onError: (err: Error) => {
      toast.error("Could not update image", { description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (input: { galleryId: string }) => deleteGalleryItem(id, input.galleryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["eventGallery", id] });
      setIsDeleteOpen(false);
      setSelected(null);
      toast.success("Image deleted successfully");
    },
    onError: (err: Error) => {
      toast.error("Could not delete image", { description: err.message });
    },
  });

  const gallery = galleryQuery.data?.data ?? [];
  const galleryCount = gallery.length;

  const openAdd = () => {
    setAddForm({ url: "", caption: "", alt: "" });
    setIsAddOpen(true);
  };

  const openEdit = (item: GalleryItem) => {
    setSelected(item);
    setEditForm({
      url: item.url ?? "",
      caption: item.caption ?? "",
      alt: item.alt ?? "",
    });
    setIsEditOpen(true);
  };

  const openDelete = (item: GalleryItem) => {
    setSelected(item);
    setIsDeleteOpen(true);
  };

  const onSubmitAdd: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const url = addForm.url.trim();
    if (!url) {
      toast.error("Image URL is required");
      return;
    }
    createMutation.mutate({
      url,
      caption: addForm.caption.trim() ? addForm.caption.trim() : undefined,
      alt: addForm.alt.trim() ? addForm.alt.trim() : undefined,
    });
  };

  const onSubmitEdit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!selected) return;
    const url = editForm.url.trim();
    if (!url) {
      toast.error("Image URL is required");
      return;
    }
    updateMutation.mutate({
      galleryId: selected.id,
      url,
      caption: editForm.caption.trim() ? editForm.caption.trim() : undefined,
      alt: editForm.alt.trim() ? editForm.alt.trim() : undefined,
    });
  };

  const cloudinaryGalleryFolder = `cork-conclave/events/${id}/gallery`;

  const resetZipImportState = React.useCallback(() => {
    setZipPhase("reading");
    setZipProgress({ completed: 0, total: 0, currentPath: null });
    setZipFailures([]);
    setZipSuccessCount(0);
  }, []);

  const onZipInputChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isZipName = file.name.toLowerCase().endsWith(".zip");
    const isZipMime =
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed" ||
      file.type === "application/x-zip";
    if (!isZipName && !isZipMime) {
      toast.error("Please choose a ZIP file.");
      return;
    }

    setZipDialogOpen(true);
    setZipBusy(true);
    setZipPhase("reading");
    setZipFailures([]);
    setZipSuccessCount(0);
    setZipProgress({ completed: 0, total: 0, currentPath: null });

    try {
      const collected = await collectZipImageFiles(file);
      if ("error" in collected) {
        toast.error(collected.error);
        setZipBusy(false);
        setZipDialogOpen(false);
        resetZipImportState();
        return;
      }

      const total = collected.files.length;
      setZipPhase("uploading");
      setZipProgress({ completed: 0, total, currentPath: null });

      const result = await runGalleryZipImport(id, cloudinaryGalleryFolder, collected.files, setZipProgress);

      await queryClient.invalidateQueries({ queryKey: ["eventGallery", id] });
      setZipSuccessCount(result.successCount);
      setZipFailures(result.failures);
      setZipPhase("done");
      setZipBusy(false);

      if (result.failures.length === 0) {
        toast.success(`Imported ${result.successCount} of ${result.total} image(s).`);
      } else {
        toast.success(`Imported ${result.successCount} of ${result.total} image(s).`, {
          description: `${result.failures.length} failed — see the list in this dialog.`,
        });
      }
    } catch (err) {
      toast.error("ZIP import failed", { description: err instanceof Error ? err.message : "Unknown error" });
      setZipBusy(false);
      setZipDialogOpen(false);
      resetZipImportState();
    }
  };

  const zipProgressPercent = zipProgress.total > 0 ? Math.round((zipProgress.completed / zipProgress.total) * 100) : 0;

  return (
    <main className="mx-auto w-full px-6 py-4 md:px-10 lg:px-12">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Event Gallery</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="default" size="sm" onClick={openAdd} disabled={zipBusy}>
            <span className="mr-2">Add Image</span>
            <CirclePlus />
          </Button>
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="sr-only"
            aria-hidden
            tabIndex={-1}
            onChange={onZipInputChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={zipBusy || !id?.trim()}
            onClick={() => zipInputRef.current?.click()}
          >
            <span className="mr-2">Upload ZIP</span>
            <FileArchive className="size-4" />
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-sm">
            Gallery Images <span className="ml-1 font-normal text-muted-foreground">({galleryCount})</span>
          </h2>
        </div>

        {galleryQuery.isLoading ? (
          <div className="text-muted-foreground text-sm">Loading gallery…</div>
        ) : galleryQuery.isError ? (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <p className="text-muted-foreground text-sm">Could not load gallery.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => galleryQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : gallery.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-border border-dashed bg-card px-4 py-16 text-center shadow-sm">
            <div className="mb-4 grid size-16 place-items-center rounded-full border border-border bg-muted/30">
              <CirclePlus className="size-7 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-base">No gallery images yet</h3>
            <p className="mt-1.5 max-w-sm text-muted-foreground text-sm">
              Add images by uploading a file or pasting an image URL.
            </p>
            <div className="mt-6">
              <Button type="button" variant="outline" size="sm" onClick={openAdd}>
                <span className="mr-2">Add Image</span>
                <CirclePlus />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {gallery.map((img) => (
              <Card
                key={img.id}
                className="group relative gap-0 overflow-hidden rounded-xl py-0 shadow-sm ring-1 ring-foreground/10 transition-all hover:shadow-md"
              >
                <div className="relative aspect-video overflow-hidden bg-muted/30">
                  <Image
                    src={img.url}
                    alt={img.alt ?? ""}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 z-10 flex items-center justify-center gap-2.5 bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="bg-background/90"
                      onClick={() => openEdit(img)}
                      aria-label="Edit image"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      className="bg-destructive text-destructive-foreground"
                      onClick={() => openDelete(img)}
                      aria-label="Delete image"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="px-3 py-3">
                  {img.caption?.trim() ? (
                    <h4 className="truncate font-medium text-sm">{img.caption}</h4>
                  ) : (
                    <h4 className="truncate font-normal text-muted-foreground text-sm italic">No caption added</h4>
                  )}

                  {img.alt?.trim() ? (
                    <p className="mt-0.5 truncate text-muted-foreground text-xs">Alt: {img.alt}</p>
                  ) : (
                    <p className="mt-0.5 truncate text-muted-foreground text-xs italic">Alt text missing</p>
                  )}
                </CardContent>
                <CardFooter className="hidden" />
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={zipDialogOpen}
        onOpenChange={(open) => {
          if (!open && zipBusy) return;
          setZipDialogOpen(open);
          if (!open) resetZipImportState();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload images from ZIP</DialogTitle>
            <DialogDescription>
              Images are uploaded to storage and added to this gallery. Max{" "}
              {Math.round(GALLERY_ZIP_MAX_BYTES / (1024 * 1024))} MB per ZIP, up to {GALLERY_ZIP_MAX_IMAGES} images
              (jpg, png, webp, gif, avif, bmp, svg).
            </DialogDescription>
          </DialogHeader>

          {zipPhase === "reading" ? <p className="text-muted-foreground text-sm">Reading ZIP…</p> : null}

          {zipPhase === "uploading" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {zipProgress.completed} / {zipProgress.total} images
                </span>
                <span className="text-muted-foreground tabular-nums">{zipProgressPercent}%</span>
              </div>
              <Progress value={zipProgressPercent} />
              {zipProgress.currentPath ? (
                <p className="truncate text-muted-foreground text-xs" title={zipProgress.currentPath}>
                  {zipProgress.currentPath}
                </p>
              ) : null}
            </div>
          ) : null}

          {zipPhase === "done" ? (
            <div className="space-y-3">
              <p className="text-sm">
                Finished: <span className="font-medium">{zipSuccessCount}</span> of{" "}
                <span className="font-medium">{zipProgress.total}</span> imported successfully.
              </p>
              {zipFailures.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-medium text-destructive text-sm">Failed ({zipFailures.length})</p>
                  <ScrollArea className="max-h-40 rounded-md border border-border pr-3">
                    <ul className="space-y-2 p-3 text-xs">
                      {zipFailures.map((f) => (
                        <li key={`${f.path}:${f.message}`} className="wrap-break-word">
                          <span className="font-medium">{f.path}</span>
                          <span className="text-muted-foreground"> — {f.message}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="default"
              disabled={zipBusy || zipPhase !== "done"}
              onClick={() => {
                setZipDialogOpen(false);
                resetZipImportState();
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          if (!open && createMutation.isPending) return;
          setIsAddOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Gallery Image</DialogTitle>
            <DialogDescription>Upload a file to Cloudinary or paste an image URL.</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitAdd} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="gallery-add-url" className="font-medium text-sm">
                Image URL
              </label>
              <Input
                id="gallery-add-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={addForm.url}
                onChange={(e) => setAddForm((s) => ({ ...s, url: e.target.value }))}
              />
              <div className="text-muted-foreground text-xs">Or upload a file below.</div>
            </div>

            <div className="space-y-2">
              <span className="font-medium text-sm">Upload</span>
              <ImageUpload
                value={addForm.url}
                onChange={(url) => setAddForm((s) => ({ ...s, url }))}
                folder={cloudinaryGalleryFolder}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="gallery-add-caption" className="font-medium text-sm">
                Caption <span className="font-normal text-muted-foreground">(Optional)</span>
              </label>
              <Input
                id="gallery-add-caption"
                type="text"
                placeholder="e.g. VIP seating area"
                value={addForm.caption}
                onChange={(e) => setAddForm((s) => ({ ...s, caption: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="gallery-add-alt" className="font-medium text-sm">
                Alt Text <span className="font-normal text-muted-foreground">(Optional)</span>
              </label>
              <Textarea
                id="gallery-add-alt"
                rows={2}
                placeholder="Describe what is happening in the image..."
                value={addForm.alt}
                onChange={(e) => setAddForm((s) => ({ ...s, alt: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving…" : "Save Image"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!open && updateMutation.isPending) return;
          setIsEditOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Image Details</DialogTitle>
            <DialogDescription>Update the URL, caption, or alt text.</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitEdit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="gallery-edit-url" className="font-medium text-sm">
                Image URL
              </label>
              <Input
                id="gallery-edit-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={editForm.url}
                onChange={(e) => setEditForm((s) => ({ ...s, url: e.target.value }))}
              />
              <div className="text-muted-foreground text-xs">Or upload a file below.</div>
            </div>

            <div className="space-y-2">
              <span className="font-medium text-sm">Upload</span>
              <ImageUpload
                value={editForm.url}
                onChange={(url) => setEditForm((s) => ({ ...s, url }))}
                folder={cloudinaryGalleryFolder}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="gallery-edit-caption" className="font-medium text-sm">
                Caption <span className="font-normal text-muted-foreground">(Optional)</span>
              </label>
              <Input
                id="gallery-edit-caption"
                type="text"
                placeholder="e.g. CEO delivering the opening remarks"
                value={editForm.caption}
                onChange={(e) => setEditForm((s) => ({ ...s, caption: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="gallery-edit-alt" className="font-medium text-sm">
                Alt Text <span className="font-normal text-muted-foreground">(Optional)</span>
              </label>
              <Textarea
                id="gallery-edit-alt"
                rows={2}
                placeholder="Describe what is happening in the image..."
                value={editForm.alt}
                onChange={(e) => setEditForm((s) => ({ ...s, alt: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={updateMutation.isPending || !selected}>
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete modal */}
      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (!open && deleteMutation.isPending) return;
          setIsDeleteOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be undone and will remove it from the
              gallery.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!selected) return;
                deleteMutation.mutate({ galleryId: selected.id });
              }}
              disabled={deleteMutation.isPending || !selected}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
