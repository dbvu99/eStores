import { useEffect, useMemo, useState } from "react";
import { type ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";
import { type FruitProduct } from "@vinfuit/fruitData";
import { localizedPath } from "@vinfuit/lib/cart";
import { type PriceRange, type SortMode } from "@vinfuit/lib/types";
import { LinkButton } from "@vinfuit/components/LinkButton";
import { ProductCard } from "@vinfuit/components/ProductCard";
import { text, type Language } from "@vinfuit/lib/i18n";

type ProductFilterKey =
  | "productType"
  | "brand"
  | "packagingType"
  | "size"
  | "rating";

type ProductFilters = Record<ProductFilterKey, string[]>;

const emptyProductFilters: ProductFilters = {
  productType: [],
  brand: [],
  packagingType: [],
  size: [],
  rating: [],
};

const filterLabels: Record<ProductFilterKey, Record<Language, string>> = {
  productType: { vi: "Product type", en: "Product type" },
  brand: { vi: "Brand", en: "Brand" },
  packagingType: { vi: "Loại", en: "Type" },
  size: { vi: "Size", en: "Size" },
  rating: { vi: "Số lượt xếp hạng sản phẩm", en: "Product rating" },
};

function uniqueFilterOptions(products: FruitProduct[], key: ProductFilterKey) {
  return Array.from(
    new Set(
      products
        .map((product) => product[key])
        .filter((value): value is string | number => value !== undefined)
        .map(String),
    ),
  ).sort((a, b) => {
    const numericA = Number(a);
    const numericB = Number(b);
    if (!Number.isNaN(numericA) && !Number.isNaN(numericB)) {
      return numericA - numericB;
    }
    return a.localeCompare(b);
  });
}

function filterMatches(product: FruitProduct, filters: ProductFilters) {
  return (Object.keys(filters) as ProductFilterKey[]).every((key) => {
    const selected = filters[key];
    if (!selected.length) return true;
    const productValue = product[key];
    return productValue !== undefined && selected.includes(String(productValue));
  });
}

function toggleFilterValue(
  filters: ProductFilters,
  key: ProductFilterKey,
  value: string,
) {
  const selected = filters[key];
  return {
    ...filters,
    [key]: selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value],
  };
}

function FilterAccordion({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="kf-filter-accordion" open>
      <summary>
        <span>{title}</span>
        <ChevronDown size={16} />
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}

export function ProductsPage({
  products,
  search,
  activeCategory,
  sortMode,
  onSearch,
  onCategory,
  onSort,
  onNavigate,
  onAdd,
  wishlist = [],
  wishlistEnabled = false,
  onToggleWishlist,
  language,
}: {
  products: FruitProduct[];
  search: string;
  activeCategory: string;
  sortMode: SortMode;
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
  onSort: (value: SortMode) => void;
  onNavigate: (href: string) => void;
  onAdd: (product: FruitProduct) => void;
  wishlist?: string[];
  wishlistEnabled?: boolean;
  onToggleWishlist?: (product: FruitProduct) => void;
  language: Language;
}) {
  const [origin, setOrigin] = useState("Tất cả");
  const [priceRange, setPriceRange] = useState<PriceRange>("all");
  const [productFilters, setProductFilters] =
    useState<ProductFilters>(emptyProductFilters);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const origins = useMemo(
    () => [
      "Tất cả",
      ...Array.from(new Set(products.map((item) => item.origin))),
    ],
    [products],
  );
  const filterGroups = useMemo(
    () =>
      ([
        "productType",
        "brand",
        "packagingType",
        "size",
        "rating",
      ] as ProductFilterKey[]).map((key) => ({
        key,
        label: filterLabels[key][language],
        options: uniqueFilterOptions(products, key),
      })),
    [language, products],
  );
  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesOrigin = origin === "Tất cả" || product.origin === origin;
      const matchesPrice =
        priceRange === "all" ||
        (priceRange === "under-500" && product.price < 500000) ||
        (priceRange === "500-1000" &&
          product.price >= 500000 &&
          product.price <= 1000000) ||
        (priceRange === "over-1000" && product.price > 1000000);
      return (
        matchesOrigin &&
        matchesPrice &&
        filterMatches(product, productFilters)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "name-asc") return a.name.localeCompare(b.name);
      if (sortMode === "price-asc") return a.price - b.price;
      if (sortMode === "price-desc") return b.price - a.price;
      return Number(Boolean(b.badge)) - Number(Boolean(a.badge));
    });
  }, [origin, priceRange, productFilters, products, sortMode]);
  const pageCount = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageProducts = visibleProducts.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [activeCategory, origin, priceRange, productFilters, search, sortMode]);

  const clearFilters = () => {
    onSearch("");
    onCategory("Tất cả");
    setOrigin("Tất cả");
    setPriceRange("all");
    setProductFilters(emptyProductFilters);
    onSort("featured");
  };

  return (
    <section className="px-4 py-8 mx-auto max-w-7xl">
      <div className="text-sm breadcrumbs">
        <ul>
          <li>
            <LinkButton
              href={localizedPath(language, "home")}
              onNavigate={onNavigate}
            >
              {text(language, "home")}
            </LinkButton>
          </li>
          <li>{text(language, "products")}</li>
        </ul>
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="space-y-4">
          <div className=" card bg-base-100">
            <div className="card-body">
              <h2 className="card-title">{text(language, "filters")}</h2>
              <label className="flex items-center gap-2 input input-bordered">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => onSearch(event.target.value)}
                  placeholder={text(language, "searchProductsPlaceholder")}
                />
              </label>
              <FilterAccordion title={text(language, "origin")}>
                <div className="flex flex-wrap gap-2">
                  {origins.map((originOption) => (
                    <button
                      className={`btn btn-xs ${originOption === origin ? "btn-primary" : "btn-outline"}`}
                      key={originOption}
                      onClick={() => setOrigin(originOption)}
                    >
                      {originOption === "Tất cả"
                        ? language === "vi"
                          ? "Tất cả"
                          : "All"
                        : originOption}
                    </button>
                  ))}
                </div>
              </FilterAccordion>
              <FilterAccordion title={text(language, "price")}>
                <div className="space-y-2 text-sm">
                  {[
                    ["all", text(language, "allPrices")],
                    ["under-500", text(language, "priceUnder500")],
                    ["500-1000", text(language, "price500To1000")],
                    ["over-1000", text(language, "priceOver1000")],
                  ].map(([value, label]) => (
                    <label className="flex gap-2" key={value}>
                      <input
                        type="radio"
                        className="radio radio-sm"
                        name="priceRange"
                        checked={priceRange === value}
                        onChange={() => setPriceRange(value as PriceRange)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </FilterAccordion>
              {filterGroups.map((group) => (
                <FilterAccordion key={group.key} title={group.label}>
                  <div className="space-y-2 text-sm">
                    {group.options.map((option) => (
                      <label className="flex items-center gap-3" key={option}>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={productFilters[group.key].includes(option)}
                          onChange={() =>
                            setProductFilters((current) =>
                              toggleFilterValue(current, group.key, option),
                            )
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </FilterAccordion>
              ))}
              <button className="btn btn-outline btn-sm" onClick={clearFilters}>
                {text(language, "clearFilters")}
              </button>
            </div>
          </div>
        </aside>
        <div>
          <div className="flex flex-col justify-between gap-3 mb-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-4xl font-black uppercase">
                {text(language, "products")}
              </h1>
              <p className="text-base-content/70">
                {text(language, "productCount", {
                  shown: pageProducts.length,
                  total: visibleProducts.length,
                })}
              </p>
            </div>
            <select
              className="w-full select select-bordered sm:w-56"
              value={sortMode}
              onChange={(event) => onSort(event.target.value as SortMode)}
            >
              <option value="featured">
                {text(language, "featuredProducts")}
              </option>
              <option value="name-asc">{text(language, "sortNameAsc")}</option>
              <option value="price-asc">
                {text(language, "priceLowToHigh")}
              </option>
              <option value="price-desc">
                {text(language, "priceHighToLow")}
              </option>
            </select>
          </div>
          {pageProducts.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pageProducts.map((product) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  onNavigate={onNavigate}
                  onAdd={onAdd}
                  wishlisted={wishlist.includes(product.slug)}
                  onToggleWishlist={wishlistEnabled ? onToggleWishlist : undefined}
                  language={language}
                />
              ))}
            </div>
          ) : (
            <div className="alert">{text(language, "noMatchingProducts")}</div>
          )}
          {pageCount > 1 && (
            <div className="flex justify-center mt-6 join">
              <button
                className="btn join-item"
                disabled={safePage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                {text(language, "pagePrevious")}
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    className={`btn join-item ${safePage === pageNumber ? "btn-primary" : ""}`}
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ),
              )}
              <button
                className="btn join-item"
                disabled={safePage === pageCount}
                onClick={() =>
                  setPage((value) => Math.min(pageCount, value + 1))
                }
              >
                {text(language, "pageNext")}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
