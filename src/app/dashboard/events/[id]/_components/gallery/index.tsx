"use client";

import * as React from "react";

import Image from "next/image";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import { CirclePlus, Pencil, Trash2 } from "lucide-react";

import {
  type GalleryItem,
  deleteGalleryItem,
  fetchEventGallery,
  patchUpdateGalleryItem,
  postCreateGalleryItem,
} from "@/app/dashboard/events/[id]/_components/gallery/_lib/gallery-api.client";

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

  return (
    <main className="mx-auto w-full px-6 py-4 md:px-10 lg:px-12">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Event Gallery</h1>
        </div>

        <Button type="button" variant="default" size="sm" onClick={openAdd}>
          <span className="mr-2">Add Image</span>
          <CirclePlus />
        </Button>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">
            Gallery Images <span className="ml-1 font-normal text-muted-foreground">({galleryCount})</span>
          </h2>
        </div>

        {galleryQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading gallery…</div>
        ) : galleryQuery.isError ? (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Could not load gallery.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => galleryQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : gallery.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-4 py-16 text-center shadow-sm">
            <div className="mb-4 grid size-16 place-items-center rounded-full border border-border bg-muted/30">
              <CirclePlus className="size-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">No gallery images yet</h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
            {gallery.map((img) => (
              <Card
                key={img.id}
                className="group relative gap-0 overflow-hidden rounded-xl py-0 ring-1 ring-foreground/10 shadow-sm transition-all hover:shadow-md"
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
                    <h4 className="truncate text-sm font-medium">{img.caption}</h4>
                  ) : (
                    <h4 className="truncate text-sm font-normal text-muted-foreground italic">No caption added</h4>
                  )}

                  {img.alt?.trim() ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">Alt: {img.alt}</p>
                  ) : (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground italic">Alt text missing</p>
                  )}
                </CardContent>
                <CardFooter className="hidden" />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
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
              <label className="text-sm font-medium">Image URL</label>
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={addForm.url}
                onChange={(e) => setAddForm((s) => ({ ...s, url: e.target.value }))}
              />
              <div className="text-xs text-muted-foreground">Or upload a file below.</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload</label>
              <ImageUpload
                value={addForm.url}
                onChange={(url) => setAddForm((s) => ({ ...s, url }))}
                folder={`cork-conclave/events/${id}/gallery`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Caption <span className="font-normal text-muted-foreground">(Optional)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. VIP seating area"
                value={addForm.caption}
                onChange={(e) => setAddForm((s) => ({ ...s, caption: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Alt Text <span className="font-normal text-muted-foreground">(Optional)</span>
              </label>
              <Textarea
                rows={2}
                placeholder="Describe what is happening in the image..."
                value={addForm.alt}
                onChange={(e) => setAddForm((s) => ({ ...s, alt: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Recommended for accessibility</p>
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
              <label className="text-sm font-medium">Image URL</label>
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={editForm.url}
                onChange={(e) => setEditForm((s) => ({ ...s, url: e.target.value }))}
              />
              <div className="text-xs text-muted-foreground">Or upload a file below.</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload</label>
              <ImageUpload
                value={editForm.url}
                onChange={(url) => setEditForm((s) => ({ ...s, url }))}
                folder={`cork-conclave/events/${id}/gallery`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Caption <span className="font-normal text-muted-foreground">(Optional)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. CEO delivering the opening remarks"
                value={editForm.caption}
                onChange={(e) => setEditForm((s) => ({ ...s, caption: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Alt Text <span className="font-normal text-muted-foreground">(Optional)</span>
              </label>
              <Textarea
                rows={2}
                placeholder="Describe what is happening in the image..."
                value={editForm.alt}
                onChange={(e) => setEditForm((s) => ({ ...s, alt: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={updateMutation.isPending}>
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
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={deleteMutation.isPending}>
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
