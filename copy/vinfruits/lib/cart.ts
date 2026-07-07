import { availableStock, products, type FruitProduct } from "@vinfuit/fruitData";
import { isCurrentVinfruitsRootHost } from "@vinfuit/lib/host";
import { type Language } from "@vinfuit/lib/i18n";
import { cartKey, type CartItem, type RouteState } from "@vinfuit/lib/types";

export const productCacheKey = "vinfruits_products_v1";

const routeSegments = {
  en: {
    home: "",
    homepageZalo: "homepage-zalo",
    products: "products",
    about: "about",
    contact: "contact",
    account: "account",
    wishlist: "wishlist",
    checkout: "checkout",
    admin: "admin",
  },
  vi: {
    home: "",
    homepageZalo: "trang-chu-zalo",
    products: "san-pham",
    about: "gioi-thieu",
    contact: "lien-he",
    account: "tai-khoan",
    wishlist: "yeu-thich",
    checkout: "thanh-toan",
    admin: "admin",
  },
} satisfies Record<Language, Record<string, string>>;

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

function collapseRepeatedBaseSegments(segments: string[]) {
  for (let size = 1; size <= Math.floor(segments.length / 2); size += 1) {
    if (segments.length % size !== 0) continue;
    const candidate = segments.slice(0, size);
    const repeats = segments.every(
      (segment, index) => segment === candidate[index % size],
    );
    if (repeats) return candidate;
  }

  return segments;
}

export function routeLanguageFromPath(pathname: string): Language {
  return pathname.split("/").includes("en") ? "en" : "vi";
}

export function appBasePathFromPath(pathname: string) {
  const path = pathname.replace(/\/$/, "");
  const segments = path.split("/").filter(Boolean);
  const languageIndex = segments.findIndex(
    (segment) => segment === "en" || segment === "vi",
  );
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
    const baseSegments = collapseRepeatedBaseSegments(
      segments.slice(0, routeStartIndex),
    );
    return baseSegments.length ? `/${baseSegments.join("/")}` : "";
  }

  return path === "/" ? "" : path;
}

export function currentAppBasePath() {
  if (typeof window === "undefined") return "";
  if (isCurrentVinfruitsRootHost()) return "";
  return appBasePathFromPath(window.location.pathname);
}

export function localizedPath(
  language: Language,
  route:
    | "home"
    | "homepageZalo"
    | "products"
    | "about"
    | "contact"
    | "account"
    | "wishlist"
    | "checkout"
    | "payosStagingCheckout"
    | "admin",
  suffix = "",
  appBasePath = currentAppBasePath(),
) {
  const base = appBasePath.replace(/\/$/, "");
  if (route === "payosStagingCheckout") {
    return `${base}/${language}/${routeSegments[language].checkout}/payos-staging`;
  }
  const segment = routeSegments[language][route];
  const path = segment
    ? `${base}/${language}/${segment}`
    : `${base}/${language}`;
  return suffix ? `${path}/${suffix.replace(/^\/+/, "")}` : path;
}

export function routeToPath(route: RouteState, language: Language) {
  const appBasePath =
    typeof window === "undefined"
      ? route.appBasePath || ""
      : currentAppBasePath();
  if (route.page === "home") return localizedPath(language, "home", "", appBasePath);
  if (route.page === "homeZalo") {
    return localizedPath(language, "homepageZalo", "", appBasePath);
  }
  if (route.page === "about") return localizedPath(language, "about", "", appBasePath);
  if (route.page === "contact") return localizedPath(language, "contact", "", appBasePath);
  if (route.page === "account") return localizedPath(language, "account", "", appBasePath);
  if (route.page === "wishlist") return localizedPath(language, "wishlist", "", appBasePath);
  if (route.page === "checkout") return localizedPath(language, "checkout", "", appBasePath);
  if (route.page === "payosStagingCheckout") {
    return localizedPath(language, "payosStagingCheckout", "", appBasePath);
  }
  if (route.page === "checkoutComplete") {
    return localizedPath(
      language,
      "checkout",
      `complete/${route.slug || ""}`,
      appBasePath,
    );
  }
  if (route.page === "admin") {
    return localizedPath(language, "admin", route.adminPath || "", appBasePath);
  }
  if (route.page === "product") {
    return localizedPath(language, "products", route.slug || "", appBasePath);
  }
  return localizedPath(language, "products", route.slug || "", appBasePath);
}

export function parseRouteFromPath(pathname: string): RouteState {
  const path = pathname.replace(/\/$/, "");
  const language = routeLanguageFromPath(pathname);
  const appBasePath = appBasePathFromPath(pathname);
  const segments = path.split("/").filter(Boolean);
  const languageIndex = segments.findIndex(
    (segment) => segment === "en" || segment === "vi",
  );
  const legacyRouteIndex = segments.findIndex((segment) =>
    legacyRouteStarts.has(segment),
  );
  const routeSegmentsOnly =
    languageIndex >= 0
      ? segments.slice(languageIndex + 1)
      : legacyRouteIndex >= 0
        ? segments.slice(legacyRouteIndex)
        : segments;
  const routePath = `/${routeSegmentsOnly.join("/")}`.replace(/\/$/, "");
  const withLanguage = (route: Omit<RouteState, "language">): RouteState => ({
    ...route,
    language,
    appBasePath,
  });

  if (!routeSegmentsOnly.length) {
    return withLanguage({ page: "home", slug: null });
  }
  if (routePath === "/homepage-zalo" || routePath === "/trang-chu-zalo") {
    return withLanguage({ page: "homeZalo", slug: null });
  }
  if (routePath === "/about" || routePath === "/gioi-thieu") {
    return withLanguage({ page: "about", slug: null });
  }
  if (routePath === "/account" || routePath === "/tai-khoan") {
    return withLanguage({ page: "account", slug: null });
  }
  const adminMatch = routePath.match(/^\/admin(?:\/(.*))?$/);
  if (adminMatch) {
    return withLanguage({
      page: "admin",
      slug: null,
      adminPath: adminMatch[1]?.replace(/\/$/, "") || "",
    });
  }
  if (routePath === "/contact" || routePath === "/lien-he") {
    return withLanguage({ page: "contact", slug: null });
  }
  if (routePath === "/wishlist" || routePath === "/yeu-thich") {
    return withLanguage({ page: "wishlist", slug: null });
  }
  if (
    routePath === "/products" ||
    routePath === "/shop" ||
    routePath === "/san-pham"
  ) {
    return withLanguage({ page: "products", slug: null });
  }
  if (
    routePath === "/checkout/payos-staging" ||
    routePath === "/thanh-toan/payos-staging"
  ) {
    return withLanguage({ page: "payosStagingCheckout", slug: null });
  }
  if (routePath === "/checkout" || routePath === "/thanh-toan") {
    return withLanguage({ page: "checkout", slug: null });
  }
  const checkoutMatch = routePath.match(
    /^\/(?:checkout|thanh-toan)\/complete\/([^/]+)$/,
  );
  if (checkoutMatch) {
    return withLanguage({ page: "checkoutComplete", slug: checkoutMatch[1] });
  }
  const productsMatch = routePath.match(
    /^\/(?:products|san-pham)\/([^/]+)$/,
  );
  if (productsMatch) {
    return withLanguage({
      page: "product",
      slug: productsMatch[1],
    });
  }
  const categoryMatch = routePath.match(/^\/(?:shop|danh-muc)\/([^/]+)$/);
  if (categoryMatch) {
    return withLanguage({ page: "products", slug: categoryMatch[1] });
  }
  return withLanguage({ page: "home", slug: null });
}

export function parsePath(): RouteState {
  if (typeof window === "undefined") {
    return { page: "home", slug: null, language: "vi" };
  }
  return parseRouteFromPath(window.location.pathname);
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(cartKey) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.slug === "string")
      .filter((item) => cartStockQuantity(item) !== 0)
      .map((item) => ({
        ...item,
        quantity: clampCartQuantity(item, Number(item.quantity || 1)),
      }));
  } catch {
    return [];
  }
}

export function clampCartQuantity(item: CartItem, nextQuantity: number) {
  const stock = cartStockQuantity(item);
  if (stock !== null && stock <= 0) return 1;
  const max = stock ?? Number.POSITIVE_INFINITY;
  return Math.max(1, Math.min(max, nextQuantity));
}

export function cartStockQuantity(item: CartItem) {
  if (item.stockQuantity !== undefined) return item.stockQuantity;
  const product =
    readCachedProducts().find((candidate) => candidate.slug === item.slug) ||
    products.find((candidate) => candidate.slug === item.slug);
  return product ? availableStock(product) : null;
}

export function cartStockLabel(item: CartItem) {
  const stock = cartStockQuantity(item);
  if (stock === null) return "Không giới hạn tồn kho";
  if (stock <= 0) return "Hết hàng";
  if (stock <= 5) return `Only ${stock} left`;
  return `${stock} available`;
}

function readCachedProducts(): FruitProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(productCacheKey) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((product) => product && typeof product.slug === "string")
      : [];
  } catch {
    return [];
  }
}
