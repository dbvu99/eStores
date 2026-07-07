import { type FruitProduct } from "@vinfuit/fruitData";
import { type Language } from "@vinfuit/lib/i18n";
import { HomePage } from "@vinfuit/pages/HomePage";
import { ZaloChatWidget } from "@vinfuit/components/ZaloChatWidget";

export function HomePageZalo({
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
  return (
    <>
      <HomePage
        products={products}
        onNavigate={onNavigate}
        onAdd={onAdd}
        activeCategory={activeCategory}
        onCategory={onCategory}
        wishlist={wishlist}
        wishlistEnabled={wishlistEnabled}
        onToggleWishlist={onToggleWishlist}
        language={language}
      />
      <ZaloChatWidget language={language} />
    </>
  );
}
