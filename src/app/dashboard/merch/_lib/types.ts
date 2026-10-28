export type MerchProduct = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_in_kobo: number;
  delivery_fee_in_kobo: number;
  pickup_location: string;
  colors: string[];
  sizes: string[];
  is_active: boolean;
  created_at: string;
};

export type MerchOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string;
  color_label: string;
  color_value: string;
  size: string;
  fulfillment_type: "pickup" | "delivery";
  delivery_address: string | null;
  delivery_note: string | null;
  unit_price_in_kobo: number;
  delivery_fee_in_kobo: number;
  created_at: string;
};

export type MerchOrder = {
  id: string;
  status: string;
  total_in_kobo: number;
  payment_deadline_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  items: MerchOrderItem[];
};

export type MerchProductsResponse = {
  products: MerchProduct[];
};

export type MerchOrdersListResponse = {
  data: MerchOrder[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
};
