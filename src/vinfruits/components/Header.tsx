import {
  Heart,
  Menu,
  PackageCheck,
  Phone,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  categoryPath,
  menuItems,
  type VinFruitsMenuItem,
} from "@vinfuit/fruitData";
import { localizedPath } from "@vinfuit/lib/cart";
import { businessInfo } from "@vinfuit/lib/business-info";
import { categoryLabel, text, type Language } from "@vinfuit/lib/i18n";
import { LinkButton } from "@vinfuit/components/LinkButton";
import Logo from "@vinfuit/components/Logo.js";

export function Header({
  cartCount,
  search,
  language,
  onSearch,
  onLanguageChange,
  onCategory,
  onNavigate,
  onCart,
  wishlistCount = 0,
  wishlistEnabled = false,
}: {
  cartCount: number;
  search: string;
  language: Language;
  onSearch: (value: string) => void;
  onLanguageChange: (language: Language) => void;
  onCategory: (category: string) => void;
  onNavigate: (href: string) => void;
  onCart: () => void;
  wishlistCount?: number;
  wishlistEnabled?: boolean;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const selectProductCategory = (category: string) => {
    setOpenMenu(null);
    onCategory(category);
    onNavigate(categoryPath(category, language));
  };

  const sentenceCase = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return normalized;
    return (
      normalized.charAt(0).toLocaleUpperCase(language) +
      normalized.slice(1).toLocaleLowerCase(language)
    );
  };

  const menuLabel = (label: string) =>
    sentenceCase(categoryLabel(label, language));

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onNavigate(localizedPath(language, "products"));
  };

  useEffect(() => {
    const closeProductsMenu = (event: PointerEvent | FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (headerRef.current?.contains(target)) return;
      setOpenMenu(null);
    };

    document.addEventListener("pointerdown", closeProductsMenu);
    document.addEventListener("focusin", closeProductsMenu);
    return () => {
      document.removeEventListener("pointerdown", closeProductsMenu);
      document.removeEventListener("focusin", closeProductsMenu);
    };
  }, []);

  const renderMenuLink = (item: VinFruitsMenuItem) => {
    if (item.productCategory) {
      return (
        <LinkButton
          href={categoryPath(item.label, language)}
          onNavigate={() => selectProductCategory(item.label)}
        >
          {menuLabel(item.label)}
        </LinkButton>
      );
    }

    if (item.href?.startsWith("http")) {
      return <a href={item.href}>{menuLabel(item.label)}</a>;
    }

    return (
      <LinkButton
        href={
          item.label === "Giới thiệu"
            ? localizedPath(language, "about")
            : item.href || localizedPath(language, "home")
        }
        onNavigate={onNavigate}
      >
        {menuLabel(item.label)}
      </LinkButton>
    );
  };

  const renderMenuItem = (item: VinFruitsMenuItem) => {
    if (item.subcategories?.length) {
      return (
        <li key={item.label}>
          <details open={openMenu === item.label}>
            <summary
              onClick={(event) => {
                event.preventDefault();
                setOpenMenu((current) =>
                  current === item.label ? null : item.label,
                );
              }}
            >
              <a
                href={categoryPath(item.label, language)}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectProductCategory(item.label);
                }}
              >
                {menuLabel(item.label)}
              </a>
            </summary>
            <ul className="z-40 p-2 shadow w-80 bg-base-100 rounded-box">
              <li>
                <LinkButton
                  href={categoryPath(item.label, language)}
                  onNavigate={() => selectProductCategory(item.label)}
                >
                  {sentenceCase(
                    `${language === "vi" ? "Tất cả" : "All"} ${categoryLabel(item.label, language)}`,
                  )}
                </LinkButton>
              </li>
              {item.subcategories.map((subcategory) => (
                <li key={subcategory}>
                  <LinkButton
                    href={categoryPath(subcategory, language)}
                    onNavigate={() => selectProductCategory(subcategory)}
                  >
                    {menuLabel(subcategory)}
                  </LinkButton>
                </li>
              ))}
            </ul>
          </details>
        </li>
      );
    }

    return <li key={item.label}>{renderMenuLink(item)}</li>;
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 border-b bg-base-100/95 border-base-200 backdrop-blur"
    >
      <div className="border-b border-base-200">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 mx-auto max-w-7xl lg:flex-nowrap lg:px-6">
          <a
            className="inline-flex items-center gap-2 text-sm font-semibold shrink-0 text-primary"
            href={businessInfo.hotlineHref}
          >
            <Phone size={17} />
            <span>{businessInfo.hotline}</span>
          </a>

          <form
            className="flex-1 order-3 w-full lg:order-none"
            onSubmit={submitSearch}
          >
            <label className="flex items-center w-full gap-2 input input-bordered">
              <Search size={18} />
              <input
                type="search"
                value={search}
                placeholder={text(language, "searchPlaceholder")}
                onChange={(event) => onSearch(event.target.value)}
              />
            </label>
          </form>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <label className="sr-only" htmlFor="vinfruits-language">
              {language === "vi" ? "Ngôn ngữ" : "Language"}
            </label>
            <select
              id="vinfruits-language"
              className="h-10 select select-bordered select-sm w-32"
              value={language}
              aria-label={language === "vi" ? "Ngôn ngữ" : "Language"}
              onChange={(event) =>
                onLanguageChange(event.target.value as Language)
              }
            >
              <option value="en">English</option>
              <option value="vi">Vietnamese</option>
            </select>
            <LinkButton
              href={localizedPath(language, "account")}
              onNavigate={onNavigate}
              className="px-2 btn btn-ghost btn-square"
              aria-label={text(language, "account")}
            >
              <UserRound size={20} />
            </LinkButton>
            {wishlistEnabled && (
              <LinkButton
                href={localizedPath(language, "wishlist")}
                onNavigate={onNavigate}
                className="gap-1 px-2 btn btn-ghost"
                aria-label={language === "vi" ? "Yêu thích" : "Wishlist"}
              >
                <Heart size={20} />
                <span className="px-1 badge badge-primary">
                  {wishlistCount}
                </span>
              </LinkButton>
            )}
            <button
              className="gap-1 px-2 cursor-pointer btn btn-ghost"
              onClick={onCart}
              aria-label={text(language, "cart")}
            >
              <ShoppingBag size={20} />
              <span className="px-1 badge badge-primary">{cartCount}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 mx-auto max-w-7xl lg:px-6">
        <div className="flex items-center gap-4">
          <div className="dropdown xl:hidden">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-square"
            >
              <Menu size={20} />
            </div>
            <ul className="z-40 w-56 p-2 mt-3 shadow menu dropdown-content rounded-box bg-base-100">
              {menuItems.map(renderMenuItem)}
            </ul>
          </div>
          <LinkButton
            href={localizedPath(language, "home")}
            onNavigate={onNavigate}
            className="max-w-56 gap-2 px-0 text-lg font-black tracking-normal btn btn-ghost sm:max-w-64"
          >
            <Logo />
          </LinkButton>
          <ul className="items-center justify-end flex-1 hidden gap-1 px-1 overflow-visible text-sm font-semibold menu menu-horizontal xl:flex">
            {menuItems.map(renderMenuItem)}
          </ul>
        </div>
      </div>
      <div className="bg-secondary text-secondary-content">
        <div className="flex items-center justify-center gap-2 px-4 py-2 mx-auto text-sm text-center max-w-7xl">
          <PackageCheck size={20} />
          <span>
            {language === "vi"
              ? "Đổi hoặc hoàn tiền trong 48 giờ. Giao nhanh cho đơn nội thành."
              : "Exchange or refund within 48 hours. Fast delivery for city orders."}
          </span>
        </div>
      </div>
    </header>
  );
}
