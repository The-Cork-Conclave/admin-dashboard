import type { MerchOrder, MerchOrdersListResponse, MerchProduct, MerchProductsResponse } from "./types";

async function readError(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as { message?: string };
    if (typeof json.message === "string" && json.message.trim()) return json.message;
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`;
}

export async function listMerchProducts(): Promise<MerchProduct[]> {
  const res = await fetch("/api/merch/products", { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res));
  const json = (await res.json()) as MerchProductsResponse;
  return json.products;
}

export async function createMerchProduct(body: unknown): Promise<MerchProduct> {
  const res = await fetch("/api/merch/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as MerchProduct;
}

export async function updateMerchProduct(id: string, body: unknown): Promise<MerchProduct> {
  const res = await fetch(`/api/merch/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as MerchProduct;
}

export async function deleteMerchProduct(id: string): Promise<void> {
  const res = await fetch(`/api/merch/products/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(await readError(res));
}

export async function listMerchOrders(params?: {
  page?: number;
  per_page?: number;
  status?: string;
}): Promise<MerchOrdersListResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.per_page) sp.set("per_page", String(params.per_page));
  if (params?.status) sp.set("status", params.status);
  const qs = sp.toString();
  const res = await fetch(`/api/merch/orders${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as MerchOrdersListResponse;
}

export async function getMerchOrder(id: string): Promise<MerchOrder> {
  const res = await fetch(`/api/merch/orders/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as MerchOrder;
}
