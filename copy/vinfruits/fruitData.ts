import { isCurrentVinfruitsRootHost } from "@vinfuit/lib/host";

export type FruitProduct = {
  slug: string;
  name: string;
  category: string;
  categorySlugs?: string[];
  origin: string;
  description: string;
  details: string[];
  price: number;
  compareAt?: number;
  badge?: string;
  image: string;
  images?: string[];
  giftReady?: boolean;
  inStock?: boolean;
  stockQuantity?: number | null;
  productType?: string;
  brand?: string;
  packagingType?: string;
  size?: string;
  rating?: number;
};

export function availableStock(product: FruitProduct) {
  if (product.inStock === false) return 0;
  return product.stockQuantity ?? null;
}

export function isProductAvailable(product: FruitProduct) {
  const stock = availableStock(product);
  return stock === null || stock > 0;
}

export function stockLabel(product: FruitProduct) {
  const stock = availableStock(product);
  if (stock === null) return "Còn hàng";
  if (stock <= 0) return "Hết hàng";
  if (stock <= 5) return `Only ${stock} left`;
  return `${stock} available`;
}

export type VinFruitsMenuItem = {
  label: string;
  href?: string;
  productCategory?: boolean;
  subcategories?: string[];
};

export const menuItems: VinFruitsMenuItem[] = [
  {
    label: "Giỏ Trái cây",
    productCategory: true,
    subcategories: [
      "Giỏ trái cây tặng bác sĩ",
      "Giỏ trái cây thăm bệnh",
      "Giỏ trái cây cảm ơn",
      "Giỏ trái cây tặng đối tác,khách hàng",
      "Giỏ trái cây khai trương",
      "Giỏ trái cây sinh nhật",
      "Giỏ trái cây Chúc mừng",
      "Giỏ trái cây và hoa",
      "Giỏ trái cây dâng lễ",
      "Giỏ trái cây đám giỗ",
      "Giỏ trái cây đám tang",
      "Ngân sách dưới 1 triệu",
      "Ngân sách 1tr-2tr",
      "Ngân sách 2tr-3tr",
      "Ngân sách trên 3tr",
    ],
  },
  {
    label: "Giỏ trái cây dịp lễ",
    productCategory: true,
    subcategories: [
      "Giỏ trái cây 8/3",
      "Giỏ trái cây 20/10",
      "Giỏ trái cây 20/11",
      "Giỏ trái cây Valentine",
      "Giỏ trái cây cúng Tổ",
      "Giỏ quà tặng ngày của Mẹ",
      "Giỏ quà tặng ngày của Ba",
      "Giỏ trái cây giáng sinh",
      "Giỏ trái cây Tết Nguyên Đán",
    ],
  },
  { label: "Trái cây nhập khẩu", productCategory: true },
  { label: "Giới thiệu", href: "/about" },
  { label: "Sản phẩm bán chạy", productCategory: true },
  { label: "Trái cây nội địa", productCategory: true },
  { label: "Giỏ hoa", productCategory: true },
];

export const categories = [
  "Tất cả",
  ...menuItems.flatMap((item) => {
    if (!item.productCategory) return [];
    return [item.label, ...(item.subcategories || [])];
  }),
];

export function categorySlug(category: string) {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function currentVinfruitsBasePath() {
  if (typeof window === "undefined") return "";
  if (isCurrentVinfruitsRootHost()) return "";
  const path = window.location.pathname.replace(/\/$/, "");
  const segments = path.split("/").filter(Boolean);
  const languageIndex = segments.findIndex(
    (segment) => segment === "en" || segment === "vi",
  );
  const legacyRouteStarts = new Set([
    "homepage-zalo",
    "about",
    "account",
    "admin",
    "contact",
    "wishlist",
    "products",
    "shop",
    "checkout",
  ]);
  const legacyRouteIndex = segments.findIndex((segment) =>
    legacyRouteStarts.has(segment),
  );
  const routeStartIndex =
    languageIndex >= 0
      ? languageIndex
      : legacyRouteIndex >= 0
        ? legacyRouteIndex
        : -1;

  if (routeStartIndex >= 0) {
    const rawBaseSegments = segments.slice(0, routeStartIndex);
    const baseSegments = (() => {
      for (let size = 1; size <= Math.floor(rawBaseSegments.length / 2); size += 1) {
        if (rawBaseSegments.length % size !== 0) continue;
        const candidate = rawBaseSegments.slice(0, size);
        const repeats = rawBaseSegments.every(
          (segment, index) => segment === candidate[index % size],
        );
        if (repeats) return candidate;
      }

      return rawBaseSegments;
    })();
    return baseSegments.length ? `/${baseSegments.join("/")}` : "";
  }

  return path === "/" ? "" : path;
}

export function categoryPath(category: string, language: "vi" | "en" = "vi") {
  const slug = categorySlug(category);
  const basePath = currentVinfruitsBasePath();
  if (!slug) {
    return language === "vi"
      ? `${basePath}/vi/san-pham`
      : `${basePath}/en/products`;
  }
  return language === "vi"
    ? `${basePath}/vi/danh-muc/${slug}`
    : `${basePath}/en/shop/${slug}`;
}

export function categoryFromSlug(slug: string | null) {
  if (!slug) return "Tất cả";
  const normalizedSlug = slug.toLowerCase();
  return (
    categories.find((category) => categorySlug(category) === normalizedSlug) ||
    "Tất cả"
  );
}

const giftBasketCategories = new Set(
  menuItems
    .filter((item) => item.label.toLowerCase().includes("giỏ"))
    .flatMap((item) => [item.label, ...(item.subcategories || [])]),
);

export function productMatchesCategory(
  product: FruitProduct,
  category: string,
) {
  if (category === "Tất cả") return true;
  if (product.category === category) return true;
  if (product.categorySlugs?.includes(categorySlug(category))) return true;
  if (category === "Trái cây nhập khẩu") return product.origin !== "Vietnam";
  if (category === "Trái cây nội địa") return product.origin === "Vietnam";
  if (category === "Sản phẩm bán chạy") return Boolean(product.badge);
  if (giftBasketCategories.has(category)) return Boolean(product.giftReady);
  return false;
}

const productCatalog: FruitProduct[] = [
  {
    slug: "rainier-cherry-gift-box",
    name: "Rainier Cherry Gift Box",
    category: "Cherry Nhập Khẩu",
    origin: "USA",
    description:
      "A premium cherry box with bright color, crisp texture, and a naturally sweet finish.",
    details: [
      "Packed for gifting",
      "Available in 1kg, 2kg, and 3kg options",
      "Best served chilled",
    ],
    price: 479000,
    compareAt: 779000,
    badge: "-39%",
    image:
      "https://images.unsplash.com/photo-1528821128474-25c5c6a6b0f3?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    inStock: true,
    stockQuantity: 12,
  },
  {
    slug: "jumbo-red-cherry",
    name: "Jumbo Red Cherry",
    category: "Cherry Nhập Khẩu",
    origin: "USA",
    description:
      "Large red cherries selected for firm bite, deep color, and balanced sweetness.",
    details: [
      "Imported by air",
      "Size-focused daily selection",
      "Packed in recyclable trays",
    ],
    price: 510000,
    compareAt: 549000,
    badge: "-7%",
    image:
      "https://images.unsplash.com/photo-1611096265583-5d745206f2a0?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    inStock: true,
    stockQuantity: 8,
  },
  {
    slug: "musk-melon",
    name: "Musk Melon",
    category: "Trái cây Việt Nam",
    origin: "Vietnam",
    description:
      "Japanese-style musk melon with a soft aroma, smooth texture, and elegant presentation.",
    details: [
      "Single-fruit luxury gift",
      "Wrapped with care",
      "Pairs well with fresh berries",
    ],
    price: 499000,
    compareAt: 549000,
    badge: "-9%",
    image:
      "https://images.unsplash.com/photo-1622205313162-be1d5712a43f?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    inStock: true,
    stockQuantity: 4,
  },
  {
    slug: "green-grapes-autumn-crisp",
    name: "Autumn Crisp Green Grapes",
    category: "Nho Nhập Khẩu",
    origin: "Australia",
    description:
      "Seedless grapes with a crisp snap and fresh green sweetness for everyday snacking.",
    details: [
      "Sold by tray or box",
      "Seedless variety",
      "Good for family fruit bowls",
    ],
    price: 125000,
    compareAt: 150000,
    badge: "-17%",
    image:
      "https://images.unsplash.com/photo-1625499940894-8796928bf9c4?auto=format&fit=crop&w=1200&q=80",
    inStock: true,
  },
  {
    slug: "blueberries-family-pack",
    name: "Blueberries Family Pack",
    category: "Việt Quất Nhập Khẩu",
    origin: "USA",
    description:
      "A compact antioxidant-rich pack built for breakfast, lunch boxes, and smoothies.",
    details: [
      "Washed before serving",
      "Great with yogurt",
      "Family-friendly portion",
    ],
    price: 229000,
    compareAt: 249000,
    badge: "-8%",
    image:
      "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=1200&q=80",
    inStock: true,
  },
  {
    slug: "thank-you-fruit-basket",
    name: "Thank You Fruit Basket",
    category: "Trái Cây Đang Mùa",
    origin: "Assorted",
    description:
      "A generous basket arranged for partners, colleagues, family, and thoughtful thank-you moments.",
    details: [
      "Seasonal fruit selection",
      "Hand-arranged gift basket",
      "Greeting card included",
    ],
    price: 1499000,
    compareAt: 1699000,
    badge: "-12%",
    image:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    inStock: true,
  },
  {
    slug: "summer-wellness-box",
    name: "Summer Wellness Box",
    category: "Trái Cây Đang Mùa",
    origin: "Assorted",
    description:
      "A clean, colorful gift box with cherries, grapes, citrus, apples, and seasonal accents.",
    details: [
      "Designed for health wishes",
      "Premium paper box",
      "Seasonal substitutions available",
    ],
    price: 1199000,
    image:
      "https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    inStock: true,
  },
  {
    slug: "kyoho-grape-juice",
    name: "Kyoho Grape Juice",
    category: "Đồ Uống",
    origin: "Japan",
    description:
      "A polished bottled juice with rich grape aroma and a smooth finish for premium gifting.",
    details: ["720ml bottle", "Imported beverage", "Serve chilled"],
    price: 1499000,
    compareAt: 1747000,
    badge: "-14%",
    image:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    inStock: true,
  },
  {
    slug: "nikkori-pear-vip-box",
    name: "Nikkori Pear VIP Box",
    category: "Trái Cây Đang Mùa",
    origin: "Japan",
    description:
      "Large Japanese pears presented in a refined gift box for formal occasions.",
    details: [
      "Limited seasonal supply",
      "Individual fruit sleeves",
      "Best for corporate gifting",
    ],
    price: 1725000,
    image:
      "https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    stockQuantity: 0,
  },
  {
    slug: "korean-shine-muscat",
    name: "Korean Shine Muscat",
    category: "Nho Sữa Hàn Quốc",
    origin: "Korea",
    description:
      "Fragrant seedless grapes with a glossy finish and a honey-like sweetness.",
    details: [
      "Premium bunch selection",
      "Seedless table grape",
      "Ideal for gifts and dessert plates",
    ],
    price: 899000,
    compareAt: 990000,
    badge: "-9%",
    image:
      "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    inStock: true,
    stockQuantity: 6,
  },
  {
    slug: "japanese-fuji-apple-box",
    name: "Japanese Fuji Apple Box",
    category: "Táo Nhập Khẩu",
    origin: "Japan",
    description:
      "Crisp, aromatic Fuji apples packed for families, offices, and premium gifting.",
    details: [
      "Box of selected apples",
      "Crisp texture",
      "Long shelf life when refrigerated",
    ],
    price: 690000,
    image:
      "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    inStock: true,
    stockQuantity: 10,
  },
  {
    slug: "new-zealand-kiwi-gold",
    name: "New Zealand Kiwi Gold",
    category: "Kiwi Nhập Khẩu",
    origin: "New Zealand",
    description:
      "Golden kiwis with a smooth tropical sweetness and soft, spoonable texture.",
    details: [
      "Sold by box",
      "Naturally sweet gold variety",
      "Good for daily vitamin sets",
    ],
    price: 255000,
    compareAt: 295000,
    badge: "-14%",
    image:
      "https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=1200&q=80",
    inStock: true,
  },
  {
    slug: "australian-orange-box",
    name: "Australian Orange Box",
    category: "Cam, Quýt",
    origin: "Australia",
    description:
      "Juicy oranges for breakfast, office pantries, and everyday wellness routines.",
    details: [
      "Family box",
      "Good for fresh juice",
      "Naturally bright citrus flavor",
    ],
    price: 185000,
    image:
      "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=1200&q=80",
    inStock: true,
  },
  {
    slug: "strawberry-premium-pack",
    name: "Premium Strawberry Pack",
    category: "Dâu Tây",
    origin: "Korea",
    description:
      "Sweet strawberries packed in a gift-ready tray for desserts and celebrations.",
    details: [
      "Premium tray",
      "Serve chilled",
      "Pairs well with cherry and grape gifts",
    ],
    price: 399000,
    compareAt: 459000,
    badge: "-13%",
    image:
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    inStock: true,
  },
  {
    slug: "fresh-cut-tropical-cup",
    name: "Fresh Cut Tropical Cup",
    category: "Trái Cây Cắt Sẵn",
    origin: "Assorted",
    description:
      "Ready-to-eat mango, melon, grape, and citrus portions for quick daily fruit.",
    details: ["Prepared daily", "Single-serve cup", "Keep refrigerated"],
    price: 79000,
    image:
      "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1200&q=80",
    inStock: true,
    stockQuantity: 24,
  },
  {
    slug: "office-vitamin-set",
    name: "Office Vitamin Set",
    category: "Trái Cây Đang Mùa",
    origin: "Assorted",
    description:
      "A weekly fruit set designed for teams, pantry refills, and meeting rooms.",
    details: [
      "Serves 8 to 12 people",
      "Seasonal mix",
      "Delivery scheduling available",
    ],
    price: 799000,
    compareAt: 899000,
    badge: "-11%",
    image:
      "https://images.unsplash.com/photo-1478144592103-25e218a04891?auto=format&fit=crop&w=1200&q=80",
    inStock: true,
  },
  {
    slug: "corporate-thank-you-hamper",
    name: "Corporate Thank You Hamper",
    category: "Trái Cây Đang Mùa",
    origin: "Assorted",
    description:
      "A polished corporate gift hamper with premium fruit, juice, and a branded card option.",
    details: [
      "Corporate note option",
      "Bulk order support",
      "Premium ribbon packaging",
    ],
    price: 2499000,
    image:
      "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    inStock: true,
  },
  {
    slug: "hospitality-fruit-platter",
    name: "Hospitality Fruit Platter",
    category: "Trái Cây Cắt Sẵn",
    origin: "Assorted",
    description:
      "A fresh-cut platter for events, hotel rooms, office hospitality, and receptions.",
    details: [
      "Prepared to order",
      "Event-ready tray",
      "Best consumed same day",
    ],
    price: 599000,
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    inStock: true,
  },
  {
    slug: "cold-pressed-orange-juice",
    name: "Cold Pressed Orange Juice",
    category: "Đồ Uống",
    origin: "Vietnam",
    description:
      "Fresh bottled orange juice for breakfast sets, lunch orders, and quick gifting.",
    details: ["No added sugar", "Cold pressed daily", "Best served chilled"],
    price: 89000,
    image:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=1200&q=80",
    inStock: true,
    stockQuantity: 18,
  },
  {
    slug: "deluxe-cherry-melon-basket",
    name: "Deluxe Cherry Melon Basket",
    category: "Trái Cây Đang Mùa",
    origin: "Assorted",
    description:
      "A large fruit basket centered on cherries and melon for celebrations and formal visits.",
    details: [
      "Large basket format",
      "Greeting card included",
      "Seasonal premium fruit mix",
    ],
    price: 2199000,
    compareAt: 2399000,
    badge: "-8%",
    image:
      "https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=1200&q=80",
    giftReady: true,
    inStock: true,
  },
  {
    slug: "kids-school-fruit-box",
    name: "Kids School Fruit Box",
    category: "Trái Cây Đang Mùa",
    origin: "Assorted",
    description:
      "Snackable fruit portions for kids with colorful, easy-to-eat selections.",
    details: [
      "Kid-friendly portions",
      "Weekly box option",
      "Washed before serving",
    ],
    price: 329000,
    image:
      "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1200&q=80",
    inStock: true,
  },
];

export function inferProductFilters(product: FruitProduct) {
  const isDrink = product.category === "Đồ Uống";
  const isCut = product.category === "Trái Cây Cắt Sẵn";
  const isBasket = Boolean(product.giftReady);
  const isPremium = product.price >= 1000000;
  const isValue = product.price < 300000;

  return {
    productType: isDrink
      ? "Đồ uống trái cây"
      : isCut
        ? "Trái cây cắt sẵn"
        : isBasket
          ? "Giỏ quà trái cây"
          : "Quả trái cây tươi",
    brand: isDrink
      ? "Vitamin House"
      : product.origin === "Vietnam"
        ? "Farm Select"
        : isPremium
          ? "VinFruits Premium"
          : "VinFruits",
    packagingType: isBasket ? "Giỏ / hộp quà" : isCut ? "Khay dùng ngay" : "1 mặt",
    size: isPremium ? "10.5" : isValue ? "8.5" : product.giftReady ? "10" : "9",
    rating: product.badge ? 5 : product.stockQuantity === 0 ? 3 : 4,
  };
}

export const products: FruitProduct[] = productCatalog.map((product) => ({
  ...product,
  ...inferProductFilters(product),
}));

export const coupons = [
  {
    title: "Fast 1H Delivery",
    text: "Save shipping on orders from 499k",
    code: "FREESHIP-04",
  },
  {
    title: "Save 100k",
    text: "For orders from 1,999k",
    code: "KM100K",
  },
  {
    title: "Save 40k",
    text: "For orders from 899k",
    code: "KM40K",
  },
];

export function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function findProduct(slug: string | null) {
  return products.find((product) => product.slug === slug) || products[0];
}
