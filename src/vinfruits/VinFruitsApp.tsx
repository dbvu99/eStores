import { useEffect, useMemo, useState } from "react";
import {
  availableStock,
  categoryFromSlug,
  productMatchesCategory,
  type FruitProduct,
} from "@vinfuit/fruitData";
import { CartDrawer } from "@vinfuit/components/Cart";
import { Footer } from "@vinfuit/components/Footer";
import { Header } from "@vinfuit/components/Header";
import { ZaloFloatButton } from "@vinfuit/components/ZaloFloatButton";
import { AccountPage, AboutPage, ContactPage } from "@vinfuit/pages/InfoPages";
import { AdminPage } from "@vinfuit/pages/AdminPage";
import { CheckoutCompletePage, CheckoutPage } from "@vinfuit/pages/CheckoutPage";
import { HomePage } from "@vinfuit/pages/HomePage";
import { HomePageZalo } from "@vinfuit/pages/HomePageZalo";
import { ProductPage } from "@vinfuit/pages/ProductPage";
import { ProductsPage } from "@vinfuit/pages/ProductsPage";
import { WishlistPage } from "@vinfuit/pages/WishlistPage";
import {
  cartStockQuantity,
  clampCartQuantity,
  localizedPath,
  parsePath,
  productCacheKey,
  readCart,
  routeToPath,
} from "@vinfuit/lib/cart";
import {
  cartKey,
  emptyCheckout,
  type CartItem,
  type RouteState,
  type SortMode,
} from "@vinfuit/lib/types";
import { kleverAppBasePath, kleverRequest } from "@vinfuit/lib/api";
import { evaluateVoucher, type VoucherResult } from "@vinfuit/lib/vouchers";
import { type Language } from "@vinfuit/lib/i18n";
import "@vinfuit/vinfruits.css";

type CustomerAccount = {
  id: string;
  name: string;
  phone: string;
  email: string;
  roles: string[];
};

export default function VinFruitsApp({
  initialRoute = { page: "home", slug: null, language: "vi" },
}: {
  initialRoute?: RouteState;
}) {
  const [route, setRoute] = useState(initialRoute);
  const { page, slug, adminPath } = route;
  const language: Language = route.language || "vi";
  const [cart, setCart] = useState<CartItem[]>([]);
  const [catalog, setCatalog] = useState<FruitProduct[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [account, setAccount] = useState<CustomerAccount | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(
    initialRoute.page === "products"
      ? categoryFromSlug(initialRoute.slug)
      : "Tất cả",
  );
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [checkout, setCheckout] = useState(emptyCheckout);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderBusy, setOrderBusy] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");

  useEffect(() => {
    setCart(readCart());
    const onPopState = () => {
      const nextRoute = parsePath();
      setRoute(nextRoute);
      if (nextRoute.page === "products") {
        setActiveCategory(categoryFromSlug(nextRoute.slug));
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    kleverRequest<{
      ok: true;
      products: FruitProduct[];
      source?: "database" | "fallback";
    }>("products", "")
      .then((payload) => {
        const nextProducts = Array.isArray(payload.products)
          ? payload.products
          : [];
        setCatalog(nextProducts);
        localStorage.setItem(productCacheKey, JSON.stringify(nextProducts));
        setCart((items) =>
          items
            .map((item) => {
              const product = nextProducts.find(
                (candidate) => candidate.slug === item.slug,
              );
              if (!product) return item;
              return {
                ...item,
                name: product.name,
                image: product.image,
                price: product.price,
                stockQuantity: availableStock(product),
              };
            })
            .filter((item) => item.stockQuantity !== 0)
            .map((item) => ({
              ...item,
              quantity: clampCartQuantity(item, Number(item.quantity || 1)),
            })),
        );
      })
      .catch(() => {
        setCatalog([]);
        localStorage.setItem(productCacheKey, "[]");
      });
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    kleverRequest<{ ok: true; user: CustomerAccount | null }>("auth", "/me")
      .then((payload) => setAccount(payload.user))
      .catch(() => setAccount(null));
  }, []);

  useEffect(() => {
    if (!account) {
      setWishlist([]);
      return;
    }

    kleverRequest<{ ok: true; wishlist: string[] }>("wishlist", "")
      .then((payload) => setWishlist(payload.wishlist))
      .catch(() => setWishlist([]));
  }, [account]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const delivery = subtotal > 499000 || subtotal === 0 ? 0 : 42000;
  const voucher = voucherCode
    ? evaluateVoucher(voucherCode, subtotal, delivery)
    : null;
  const discount = voucher?.valid ? voucher.discount : 0;
  const total = subtotal + delivery - discount;

  useEffect(() => {
    if (voucherCode && !voucher?.valid) setVoucherCode("");
  }, [subtotal, delivery]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalog.filter((product) => {
      const matchesCategory = productMatchesCategory(product, activeCategory);
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.origin.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, catalog, search]);

  const navigate = (href: string) => {
    window.history.pushState({}, "", href);
    const nextRoute = parsePath();
    setRoute(nextRoute);
    if (nextRoute.page === "products") {
      setActiveCategory(categoryFromSlug(nextRoute.slug));
    }
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeLanguage = (nextLanguage: Language) => {
    if (nextLanguage === language) return;
    window.location.assign(routeToPath(route, nextLanguage));
  };

  const addToCart = (product: FruitProduct, quantity = 1) => {
    const stock = availableStock(product);
    if (stock !== null && stock <= 0) return;
    setCart((items) => {
      const existing = items.find((item) => item.slug === product.slug);
      const requestedQuantity =
        stock === null ? quantity : Math.min(quantity, stock);
      if (existing) {
        return items.map((item) =>
          item.slug === product.slug
            ? {
                ...item,
                quantity:
                  stock === null
                    ? item.quantity + requestedQuantity
                    : Math.min(stock, item.quantity + requestedQuantity),
                stockQuantity: stock,
              }
            : item,
        );
      }
      return [
        ...items,
        {
          slug: product.slug,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity: requestedQuantity,
          stockQuantity: stock,
        },
      ];
    });
    setCartOpen(true);
  };

  const updateQuantity = (slug: string, direction: 1 | -1) => {
    setCart((items) =>
      items.map((item) =>
        item.slug === slug
          ? {
              ...item,
              quantity: clampCartQuantity(item, item.quantity + direction),
            }
          : item,
      ),
    );
  };

  const removeItem = (slugToRemove: string) => {
    setCart((items) => items.filter((item) => item.slug !== slugToRemove));
  };

  const toggleWishlist = async (productToToggle: FruitProduct) => {
    if (!account) {
      navigate(
        `${localizedPath(language, "account")}?next=${encodeURIComponent(
          localizedPath(language, "wishlist"),
        )}`,
      );
      return;
    }

    const wishlisted = wishlist.includes(productToToggle.slug);
    const payload = await kleverRequest<{ ok: true; wishlist: string[] }>(
      "wishlist",
      "",
      {
        method: wishlisted ? "DELETE" : "POST",
        body: JSON.stringify({ productSlug: productToToggle.slug }),
      },
    );
    setWishlist(payload.wishlist);
  };

  const submitOrder = async (checkoutOverride = checkout) => {
    if (!cart.length) {
      setOrderMessage("Giỏ hàng của bạn đang trống.");
      return;
    }
    const overLimitItem = cart.find((item) => {
      const stock = cartStockQuantity(item);
      return stock !== null && (stock <= 0 || item.quantity > stock);
    });
    if (overLimitItem) {
      setOrderMessage(
        `${overLimitItem.name} exceeds available inventory. Please update your cart.`,
      );
      return;
    }
    if (!checkoutOverride.name.trim() || !checkoutOverride.phone.trim()) {
      setOrderMessage("Vui lòng nhập tên và số điện thoại.");
      return;
    }

    if (!checkoutOverride.address.trim()) {
      setOrderMessage("Vui lòng nhập địa chỉ giao hàng.");
      return;
    }

    setOrderBusy(true);
    setOrderMessage("");
    setCheckout(checkoutOverride);

    try {
      const payload = await kleverRequest<{
        ok: true;
        order: { orderNumber: string };
      }>("orders", "/checkout", {
        method: "POST",
        body: JSON.stringify({
          form: checkoutOverride,
          cart,
          subtotal,
          delivery,
          voucherCode,
          total,
        }),
      });

      setCart([]);
      setCheckout(emptyCheckout);
      setVoucherCode("");
      setOrderMessage("");
      navigate(
        localizedPath(language, "checkout", `complete/${payload.order.orderNumber}`),
      );
    } catch (error) {
      setOrderMessage(
        error instanceof Error ? error.message : "Không thể đặt hàng.",
      );
    } finally {
      setOrderBusy(false);
    }
  };

  const submitPayOSStagingOrder = async (checkoutOverride = checkout) => {
    if (!cart.length) {
      setOrderMessage("Giỏ hàng của bạn đang trống.");
      return;
    }
    const overLimitItem = cart.find((item) => {
      const stock = cartStockQuantity(item);
      return stock !== null && (stock <= 0 || item.quantity > stock);
    });
    if (overLimitItem) {
      setOrderMessage(
        `${overLimitItem.name} exceeds available inventory. Please update your cart.`,
      );
      return;
    }
    if (!checkoutOverride.name.trim() || !checkoutOverride.phone.trim()) {
      setOrderMessage("Vui lòng nhập tên và số điện thoại.");
      return;
    }

    if (!checkoutOverride.address.trim()) {
      setOrderMessage("Vui lòng nhập địa chỉ giao hàng.");
      return;
    }

    setOrderBusy(true);
    setOrderMessage("");
    setCheckout(checkoutOverride);

    try {
      const runtimeBasePath = kleverAppBasePath() || `/${language}`;
      const payload = await kleverRequest<{
        ok: true;
        payment: { checkoutUrl: string; orderCode: number };
      }>("orders", "/payos-staging", {
        method: "POST",
        body: JSON.stringify({
          form: checkoutOverride,
          cart,
          subtotal,
          delivery,
          voucherCode,
          total,
          returnPath: `${runtimeBasePath}/${language === "vi" ? "thanh-toan" : "checkout"}/payos-staging`,
        }),
      });

      window.location.href = payload.payment.checkoutUrl;
    } catch (error) {
      setOrderMessage(
        error instanceof Error
          ? error.message
          : "Không thể tạo link thanh toán payOS.",
      );
    } finally {
      setOrderBusy(false);
    }
  };

  const applyVoucher = async (code: string) => {
    try {
      const payload = await kleverRequest<{
        ok: true;
        voucher: VoucherResult;
      }>("coupons", "/validate", {
        method: "POST",
        body: JSON.stringify({ code, subtotal, delivery }),
      });
      setVoucherCode(payload.voucher.code);
      return { valid: true, message: payload.voucher.message };
    } catch (error) {
      return {
        valid: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể áp dụng mã giảm giá.",
      };
    }
  };

  const product =
    catalog.find((candidate) => candidate.slug === slug) || catalog[0] || null;

  return (
    <div className="kf-app bg-base-100 text-base-content" data-theme="light">
      <Header
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={account ? wishlist.length : 0}
        wishlistEnabled={Boolean(account)}
        search={search}
        language={language}
        onSearch={setSearch}
        onLanguageChange={changeLanguage}
        onCategory={setActiveCategory}
        onNavigate={navigate}
        onCart={() => setCartOpen(true)}
      />
      <CartDrawer
        cart={cart}
        open={cartOpen}
        subtotal={subtotal}
        delivery={delivery}
        discount={discount}
        voucherCode={voucherCode}
        total={total}
        language={language}
        onClose={() => setCartOpen(false)}
        onNavigate={navigate}
        onRemove={removeItem}
        onUpdateQuantity={updateQuantity}
      />

      <main className="bg-base-200">
        {page === "home" && (
          <HomePage
            products={catalog}
            onNavigate={navigate}
            onAdd={addToCart}
            activeCategory={activeCategory}
            onCategory={setActiveCategory}
            wishlist={wishlist}
            wishlistEnabled={Boolean(account)}
            onToggleWishlist={toggleWishlist}
            language={language}
          />
        )}
        {page === "homeZalo" && (
          <HomePageZalo
            products={catalog}
            onNavigate={navigate}
            onAdd={addToCart}
            activeCategory={activeCategory}
            onCategory={setActiveCategory}
            wishlist={wishlist}
            wishlistEnabled={Boolean(account)}
            onToggleWishlist={toggleWishlist}
            language={language}
          />
        )}
        {page === "about" && <AboutPage language={language} />}
        {page === "contact" && <ContactPage language={language} />}
        {page === "account" && (
          <AccountPage
            onAccountChange={(nextAccount) => setAccount(nextAccount)}
            onNavigate={navigate}
          />
        )}
        {page === "admin" && (
          <AdminPage
            adminPath={adminPath || ""}
            language={language}
            onNavigate={navigate}
          />
        )}
        {page === "wishlist" && (
          <WishlistPage
            products={catalog}
            wishlist={wishlist}
            wishlistEnabled={Boolean(account)}
            onNavigate={navigate}
            onAdd={addToCart}
            onToggleWishlist={toggleWishlist}
            language={language}
          />
        )}
        {page === "products" && (
          <ProductsPage
            products={filteredProducts}
            search={search}
            activeCategory={activeCategory}
            sortMode={sortMode}
            onSearch={setSearch}
            onCategory={setActiveCategory}
            onSort={setSortMode}
            onNavigate={navigate}
            onAdd={addToCart}
            wishlist={wishlist}
            wishlistEnabled={Boolean(account)}
            onToggleWishlist={toggleWishlist}
            language={language}
          />
        )}
        {page === "product" && product && (
          <ProductPage
            product={product}
            onNavigate={navigate}
            onAdd={addToCart}
            wishlisted={wishlist.includes(product.slug)}
            wishlistEnabled={Boolean(account)}
            reviewEnabled={Boolean(account)}
            onToggleWishlist={toggleWishlist}
            language={language}
          />
        )}
        {page === "product" && !product && (
          <section className="px-4 py-12 mx-auto max-w-7xl">
            <div className="card bg-base-100">
              <div className="card-body">
                <h1 className="card-title">Product not found</h1>
                <button
                  className="btn btn-primary w-fit"
                  type="button"
                  onClick={() => navigate(localizedPath(language, "products"))}
                >
                  Back to products
                </button>
              </div>
            </div>
          </section>
        )}
        {page === "checkout" && (
          <CheckoutPage
            cart={cart}
            form={checkout}
            subtotal={subtotal}
            delivery={delivery}
            discount={discount}
            voucherCode={voucherCode}
            total={total}
            message={orderMessage}
            busy={orderBusy}
            language={language}
            onChange={(field, value) =>
              setCheckout((current) => ({ ...current, [field]: value }))
            }
            onSubmit={submitOrder}
            onApplyVoucher={applyVoucher}
            onRemoveVoucher={() => setVoucherCode("")}
            onNavigate={navigate}
          />
        )}
        {page === "payosStagingCheckout" && (
          <CheckoutPage
            cart={cart}
            form={checkout}
            subtotal={subtotal}
            delivery={delivery}
            discount={discount}
            voucherCode={voucherCode}
            total={total}
            message={orderMessage}
            busy={orderBusy}
            language={language}
            variant="payosStaging"
            onChange={(field, value) =>
              setCheckout((current) => ({ ...current, [field]: value }))
            }
            onSubmit={submitPayOSStagingOrder}
            onApplyVoucher={applyVoucher}
            onRemoveVoucher={() => setVoucherCode("")}
            onNavigate={navigate}
          />
        )}
        {page === "checkoutComplete" && (
          <CheckoutCompletePage
            orderNumber={slug}
            onNavigate={navigate}
            language={language}
          />
        )}
      </main>
      <ZaloFloatButton language={language} />
      <Footer onNavigate={navigate} language={language} />
    </div>
  );
}
