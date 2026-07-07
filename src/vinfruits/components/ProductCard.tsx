import { Gift, Heart } from "lucide-react";
import {
  formatVnd,
  isProductAvailable,
  stockLabel,
  type FruitProduct,
} from "@vinfuit/fruitData";
import { type Language } from "@vinfuit/lib/i18n";
import { localizedPath } from "@vinfuit/lib/cart";

const plainDescription = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function ProductCard({
  product,
  onNavigate,
  onAdd,
  language = "vi",
  wishlisted = false,
  onToggleWishlist,
}: {
  product: FruitProduct;
  onNavigate: (href: string) => void;
  onAdd: (product: FruitProduct) => void;
  language?: Language;
  wishlisted?: boolean;
  onToggleWishlist?: (product: FruitProduct) => void;
}) {
  const available = isProductAvailable(product);
  const productHref = localizedPath(language, "products", product.slug);

  return (
    <article
      className="transition border cursor-pointer border-primary/10 card bg-base-100 hover:shadow-md"
      role="link"
      tabIndex={0}
      onClick={() => onNavigate(productHref)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onNavigate(productHref);
        }
      }}
    >
      <figure className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full kf-product-image"
        />
        <div className="absolute flex gap-2 left-3 top-3">
          {product.badge && (
            <span className="badge badge-error">{product.badge}</span>
          )}
          {product.giftReady && (
            <span className="badge badge-primary">
              <Gift size={13} />
            </span>
          )}
        </div>
        {onToggleWishlist && (
          <button
            type="button"
            className={`absolute btn btn-circle btn-sm right-3 top-3 ${
              wishlisted ? "btn-primary" : "btn-base-100"
            }`}
            aria-label={
              wishlisted
                ? language === "vi"
                  ? "Xóa khỏi yêu thích"
                  : "Remove from wishlist"
                : language === "vi"
                  ? "Thêm vào yêu thích"
                  : "Add to wishlist"
            }
            aria-pressed={wishlisted}
            onClick={(event) => {
              event.stopPropagation();
              onToggleWishlist(product);
            }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
          </button>
        )}
      </figure>
      <div className="gap-3 card-body">
        <div className="flex items-center justify-between gap-2">
          <span className="badge badge-outline">{product.origin}</span>
          <span className={`badge ${available ? "badge-success" : ""}`}>
            {stockLabel(product)}
          </span>
        </div>
        <h3 className="text-base leading-snug card-title">{product.name}</h3>
        <p className="text-sm line-clamp-2 text-base-content/70">
          {plainDescription(product.description)}
        </p>
        <div className="mt-auto">
          <div className="flex flex-wrap items-baseline gap-2 mb-3">
            <strong>{formatVnd(product.price)}</strong>
            {product.compareAt && (
              <span className="text-sm line-through text-base-content/50">
                {formatVnd(product.compareAt)}
              </span>
            )}
          </div>
          <button
            className="w-full btn btn-primary btn-sm"
            disabled={!available}
            onClick={(event) => {
              event.stopPropagation();
              onAdd(product);
            }}
          >
            {language === "vi" ? "Thêm vào giỏ hàng" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
