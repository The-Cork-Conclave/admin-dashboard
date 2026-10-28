"use client";

import * as React from "react";

import Image from "next/image";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { deleteMerchProduct, listMerchOrders, listMerchProducts } from "../_lib/api";
import type { MerchProduct } from "../_lib/types";
import { ProductFormModal } from "./product-form-modal";

function formatNaira(kobo: number) {
  return `₦${Math.trunc(kobo / 100).toLocaleString()}`;
}

export function MerchView() {
  const [tab, setTab] = React.useState("products");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MerchProduct | null>(null);
  const [deleting, setDeleting] = React.useState<MerchProduct | null>(null);

  const productsQuery = useQuery({
    queryKey: ["merch-products"],
    queryFn: listMerchProducts,
  });

  const ordersQuery = useQuery({
    queryKey: ["merch-orders"],
    queryFn: () => listMerchOrders({ page: 1, per_page: 50 }),
    enabled: tab === "orders",
  });

  async function refreshProducts() {
    await productsQuery.refetch();
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMerchProduct(id),
    onSuccess: async () => {
      toast.success("Product deleted");
      setDeleting(null);
      await refreshProducts();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete");
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Merch</h1>
          <p className="text-muted-foreground text-sm">Manage anniversary shirts, pause sales, and review orders.</p>
        </div>
        {tab === "products" ? (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            New product
          </Button>
        ) : null}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4 space-y-4">
          {productsQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading products…</p>
          ) : productsQuery.isError ? (
            <p className="text-destructive text-sm">
              {productsQuery.error instanceof Error ? productsQuery.error.message : "Failed to load products"}
            </p>
          ) : (productsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-sm">No products yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {productsQuery.data?.map((product) => (
                <div key={product.id} className="border-border bg-card overflow-hidden rounded-lg border">
                  <div className="bg-muted relative aspect-square">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-contain p-4"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-medium">{product.name}</h2>
                        <p className="text-muted-foreground text-sm">
                          {formatNaira(product.price_in_kobo)} · delivery {formatNaira(product.delivery_fee_in_kobo)}
                        </p>
                      </div>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">Colors: {product.colors.join(", ")}</p>
                    <p className="text-muted-foreground text-xs">Sizes: {product.sizes.join(", ")}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(product);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleting(product)}>
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-4 space-y-3">
          {ordersQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading orders…</p>
          ) : ordersQuery.isError ? (
            <p className="text-destructive text-sm">
              {ordersQuery.error instanceof Error ? ordersQuery.error.message : "Failed to load orders"}
            </p>
          ) : (ordersQuery.data?.data.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-sm">No orders yet.</p>
          ) : (
            ordersQuery.data?.data.map((order) => (
              <details key={order.id} className="border-border bg-card rounded-lg border p-4 open:shadow-sm">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">Order {order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(order.created_at).toLocaleString()} · {order.items.length} item
                        {order.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === "paid" ? "default" : "secondary"}>{order.status}</Badge>
                      <span className="text-sm font-medium">{formatNaira(order.total_in_kobo)}</span>
                    </div>
                  </div>
                </summary>
                <div className="mt-4 space-y-3 border-t pt-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="text-sm">
                      <p className="font-medium">
                        {item.recipient_name} · {item.color_label} / {item.size}
                      </p>
                      <p className="text-muted-foreground">
                        {item.recipient_email} · {item.recipient_phone}
                      </p>
                      <p className="text-muted-foreground">
                        {item.fulfillment_type === "pickup"
                          ? "Pickup"
                          : `Delivery: ${item.delivery_address ?? "—"}${
                              item.delivery_note ? ` (${item.delivery_note})` : ""
                            }`}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            ))
          )}
        </TabsContent>
      </Tabs>

      <ProductFormModal open={formOpen} product={editing} onOpenChange={setFormOpen} onSaved={refreshProducts} />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (deleteMutation.isPending) return;
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? (
                <>
                  <span className="text-foreground font-medium">{deleting.name}</span> will be deleted. This cannot be
                  undone.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending || !deleting}
              onClick={(e) => {
                e.preventDefault();
                if (deleting) deleteMutation.mutate(deleting.id);
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
