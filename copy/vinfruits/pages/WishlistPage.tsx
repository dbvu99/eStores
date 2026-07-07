import { Heart } from "lucide-react";
import { type FruitProduct } from "@vinfuit/fruitData";
import { LinkButton } from "@vinfuit/components/LinkButton";
import { ProductCard } from "@vinfuit/components/ProductCard";
import { localizedPath } from "@vinfuit/lib/cart";
import { text, type Language } from "@vinfuit/lib/i18n";

export function WishlistPage({
  products,
  wishlist,
  wishlistEnabled = false,
  onNavigate,
  onAdd,
  onToggleWishlist,
  language,
}: {
  products: FruitProduct[];
  wishlist: string[];
  wishlistEnabled?: boolean;
  onNavigate: (href: string) => void;
  onAdd: (product: FruitProduct) => void;
  onToggleWishlist: (product: FruitProduct) => void;
  language: Language;
}) {
  const wishlistProducts = products.filter((product) =>
    wishlist.includes(product.slug),
  );

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
          <li>{language === "vi" ? "Yêu thích" : "Wishlist"}</li>
        </ul>
      </div>

      <div className="flex flex-col justify-between gap-3 mt-4 mb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-black uppercase">
            {language === "vi" ? "Yêu thích" : "Wishlist"}
          </h1>
          <p className="text-base-content/70">
            {language === "vi"
              ? `${wishlistProducts.length} sản phẩm đã lưu`
              : `${wishlistProducts.length} saved products`}
          </p>
        </div>
      </div>

      {!wishlistEnabled ? (
        <div className="items-center gap-4 alert bg-base-100">
          <Heart size={22} />
          <div>
            <h2 className="font-bold">
              {language === "vi"
                ? "Đăng nhập để dùng yêu thích"
                : "Sign in to use your wishlist"}
            </h2>
            <p className="text-sm">
              {language === "vi"
                ? "Danh sách yêu thích được lưu vào tài khoản của bạn."
                : "Wishlist items are saved to your account."}
            </p>
          </div>
          <LinkButton
            href={`${localizedPath(language, "account")}?next=${encodeURIComponent(
              localizedPath(language, "wishlist"),
            )}`}
            onNavigate={onNavigate}
            className="ml-auto btn btn-primary btn-sm"
          >
            {text(language, "account")}
          </LinkButton>
        </div>
      ) : wishlistProducts.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistProducts.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              onNavigate={onNavigate}
              onAdd={onAdd}
              language={language}
              wishlisted
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      ) : (
        <div className="items-center gap-4 alert bg-base-100">
          <Heart size={22} />
          <div>
            <h2 className="font-bold">
              {language === "vi"
                ? "Chưa có sản phẩm yêu thích"
                : "No saved products yet"}
            </h2>
            <p className="text-sm">
              {language === "vi"
                ? "Lưu sản phẩm bằng biểu tượng trái tim trên sản phẩm."
                : "Save products with the heart icon on each product."}
            </p>
          </div>
          <LinkButton
            href={localizedPath(language, "products")}
            onNavigate={onNavigate}
            className="ml-auto btn btn-primary btn-sm"
          >
            {text(language, "products")}
          </LinkButton>
        </div>
      )}
    </section>
  );
}
