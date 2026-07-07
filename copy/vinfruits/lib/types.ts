export type Page =
  | "home"
  | "homeZalo"
  | "about"
  | "contact"
  | "products"
  | "product"
  | "wishlist"
  | "checkout"
  | "payosStagingCheckout"
  | "checkoutComplete"
  | "admin"
  | "account";

export type RouteState = {
  page: Page;
  slug: string | null;
  adminPath?: string | null;
  language?: "vi" | "en";
  appBasePath?: string;
};

export type SortMode = "featured" | "name-asc" | "price-asc" | "price-desc";
export type PriceRange = "all" | "under-500" | "500-1000" | "over-1000";

export type CartItem = {
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  stockQuantity?: number | null;
};

export type CheckoutForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export const basePath = "";
export const cartKey = "vinfruits_cart_v1";

export const emptyCheckout: CheckoutForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};
