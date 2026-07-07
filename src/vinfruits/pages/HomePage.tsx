import { useState } from "react";
import { Gift, HeartHandshake, Truck } from "lucide-react";
import { coupons, type FruitProduct } from "@vinfuit/fruitData";
import { localizedPath } from "@vinfuit/lib/cart";
import { CategoryTabs } from "@vinfuit/components/CategoryTabs";
import { LinkButton } from "@vinfuit/components/LinkButton";
import { ProductCard } from "@vinfuit/components/ProductCard";
import { SectionShell } from "@vinfuit/components/SectionShell";
import { text, type Language } from "@vinfuit/lib/i18n";

export function HomePage({
  products,
  onNavigate,
  onAdd,
  activeCategory,
  onCategory,
  wishlist = [],
  wishlistEnabled = false,
  onToggleWishlist,
  language,
}: {
  products: FruitProduct[];
  onNavigate: (href: string) => void;
  onAdd: (product: FruitProduct) => void;
  activeCategory: string;
  onCategory: (category: string) => void;
  wishlist?: string[];
  wishlistEnabled?: boolean;
  onToggleWishlist?: (product: FruitProduct) => void;
  language: Language;
}) {
  const featured = products.slice(0, 8);
  const gifts = products.filter((item) => item.giftReady).slice(0, 4);
  const [copiedCode, setCopiedCode] = useState("");
  const [copyError, setCopyError] = useState("");

  const copyWithFallback = (code: string) => {
    const input = document.createElement("textarea");
    input.value = code;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw new Error("Copy command failed");
  };

  const copyCoupon = async (code: string) => {
    setCopyError("");

    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(code);
        } catch {
          copyWithFallback(code);
        }
      } else {
        copyWithFallback(code);
      }

      setCopiedCode(code);
      window.setTimeout(
        () => setCopiedCode((current) => (current === code ? "" : current)),
        2000,
      );
    } catch {
      setCopiedCode("");
      setCopyError(code);
    }
  };

  return (
    <>
      <section className="hero kf-hero bg-base-100">
        <div className="hero-content grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-4 badge badge-primary">
              {text(language, "dailyImport")}
            </div>
            <h1 className="text-4xl font-black leading-tight uppercase sm:text-6xl">
              {text(language, "heroTitle")}
            </h1>
            <p className="max-w-xl mt-4 text-base-content/70">
              {text(language, "heroBody")}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <LinkButton
                href={localizedPath(language, "products")}
                onNavigate={onNavigate}
                className="btn btn-primary"
              >
                {text(language, "heroCtaProducts")}
              </LinkButton>
              <LinkButton
                href={localizedPath(language, "about")}
                onNavigate={onNavigate}
                className="btn btn-outline"
              >
                {text(language, "heroCtaAbout")}
              </LinkButton>
            </div>
          </div>
          <img
            src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1600&q=80"
            alt="Giỏ quà trái cây"
            className="w-full shadow-xl kf-banner-image rounded-box"
          />
        </div>
      </section>

      <SectionShell
        title={language === "vi" ? "Ưu đãi dành cho bạn" : "Offers for you"}
        eyebrow={text(language, "voucher")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {coupons.map((coupon) => (
            <div className=" card bg-base-100" key={coupon.code}>
              <div className="card-body">
                <h3 className="card-title">{coupon.title}</h3>
                <p>{coupon.text}</p>
                <div className="mt-2 join">
                  <span className="btn join-item btn-outline">
                    {coupon.code}
                  </span>
                  <button
                    className="btn join-item btn-primary"
                    type="button"
                    aria-label={`Sao chép mã ${coupon.code}`}
                    onClick={() => void copyCoupon(coupon.code)}
                  >
                    {copiedCode === coupon.code
                      ? text(language, "copied")
                      : copyError === coupon.code
                        ? text(language, "tryAgain")
                        : text(language, "copy")}
                  </button>
                </div>
                <span className="sr-only" aria-live="polite">
                  {copiedCode === coupon.code
                    ? text(language, "voucherCopied", { code: coupon.code })
                    : copyError === coupon.code
                      ? text(language, "voucherCopyFailed", {
                          code: coupon.code,
                        })
                      : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        title={text(language, "seasonalFruit")}
        action={
          <LinkButton
            href={localizedPath(language, "products")}
            onNavigate={onNavigate}
            className="btn btn-sm btn-outline"
          >
            {text(language, "viewAll")}
          </LinkButton>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
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
      </SectionShell>

      <SectionShell
        title={text(language, "importedCherries")}
        eyebrow={text(language, "importedCherriesEyebrow")}
      >
        <CategoryTabs
          active={activeCategory}
          onCategory={onCategory}
          language={language}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {gifts.map((product) => (
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
      </SectionShell>

      <section className="bg-base-200">
        <div className="grid gap-4 px-4 py-12 mx-auto max-w-7xl md:grid-cols-3">
          {[
            [
              Truck,
              text(language, "deliveryFast"),
              text(language, "deliveryFastText"),
            ],
            [
              Gift,
              text(language, "giftService"),
              text(language, "giftServiceText"),
            ],
            [
              HeartHandshake,
              text(language, "shopCare"),
              text(language, "shopCareText"),
            ],
          ].map(([Icon, title, text]) => {
            const ServiceIcon = Icon as typeof Truck;
            return (
              <div className="card bg-base-100" key={String(title)}>
                <div className="card-body">
                  <ServiceIcon size={28} />
                  <h3 className="card-title">{String(title)}</h3>
                  <p>{String(text)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
