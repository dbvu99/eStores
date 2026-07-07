import { isCurrentVinfruitsRootHost } from "@vinfuit/lib/host";

type KleverApiSection =
  | "auth"
  | "orders"
  | "admin"
  | "coupons"
  | "wishlist"
  | "reviews"
  | "products";

const appRoutePatterns = [
  /^\/(?:homepage-zalo|about|account|admin|contact|wishlist|products|shop|checkout)(?:\/.*)?$/,
  /^\/(?:en|vi)(?:\/(?:homepage-zalo|trang-chu-zalo|about|gioi-thieu|account|tai-khoan|admin|contact|lien-he|wishlist|yeu-thich|products|san-pham|shop|danh-muc|checkout|thanh-toan)(?:\/.*)?)?$/,
  /^\/$/,
];

function appBasePathFromPathname(pathname: string) {
  const normalized = pathname.replace(/\/$/, "") || "/";
  for (const pattern of appRoutePatterns) {
    const match = normalized.match(pattern);
    if (match?.index === 0) return "";
  }

  const routeMatch = normalized.match(
    /^(.*)\/(?:en|vi)(?:\/(?:homepage-zalo|trang-chu-zalo|about|gioi-thieu|account|tai-khoan|admin|contact|lien-he|wishlist|yeu-thich|products|san-pham|shop|danh-muc|checkout|thanh-toan)(?:\/.*)?)?$/,
  ) || normalized.match(
    /^(.*)\/(?:homepage-zalo|about|account|admin|contact|wishlist|products|shop|checkout)(?:\/.*)?$/,
  );
  if (routeMatch) return routeMatch[1] || "";

  return normalized;
}

export function kleverAppBasePath() {
  if (typeof window === "undefined") return "";
  if (isCurrentVinfruitsRootHost()) return "";
  return appBasePathFromPathname(window.location.pathname);
}

export function kleverApiBase(section: KleverApiSection) {
  const appBasePath = kleverAppBasePath();
  if (!appBasePath) return `/api/vinfruits/${section}`;
  return `${appBasePath}/api/${section}`;
}

export async function kleverRequest<T>(
  section: KleverApiSection,
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${kleverApiBase(section)}${endpoint}`, {
    credentials: "same-origin",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.ok === false) {
    throw new Error(
      typeof payload?.error === "string" ? payload.error : "Request failed.",
    );
  }

  return payload as T;
}
