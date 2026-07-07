import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bold,
  Check,
  CheckCircle2,
  X,
  EyeOff,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  PackageCheck,
  Plus,
  Save,
  Search,
  Tags,
  Underline,
  Unlink,
  Upload,
  UsersRound,
} from "lucide-react";
import { formatVnd } from "@vinfuit/fruitData";
import { kleverRequest } from "@vinfuit/lib/api";
import { localizedPath } from "@vinfuit/lib/cart";
import { type Language } from "@vinfuit/lib/i18n";

type CustomerAccount = {
  id: string;
  name: string;
  phone: string;
  email: string;
  roles: string[];
};

type AdminOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_address: string;
  status: string;
  payment_status: string;
  total_vnd: number;
  created_at: string;
  items: Array<{
    name: string;
    quantity: number;
    total: number;
  }>;
};

type CustomerRecord = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  roles: string[];
};

type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  name_vi: string | null;
  name_en: string | null;
  source_path: string;
  sort_order: number;
  visible: boolean;
};

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  origin: string;
  description: string;
  price_vnd: number;
  compare_at_vnd: number | null;
  image_url: string | null;
  image_urls: string[];
  gift_ready: boolean;
  inventory_quantity: number | null;
  in_stock: boolean;
  visible: boolean;
  sort_order: number;
  category_slugs: string[];
};

type MediaAsset = {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  public_url: string;
  alt_text: string | null;
  created_at: string;
};

type AdminSection = "orders" | "customers" | "products" | "categories";

const emptyCategoryForm = {
  id: "",
  slug: "",
  name: "",
  nameVi: "",
  nameEn: "",
  sourcePath: "",
  sortOrder: 0,
  visible: true,
};

const emptyProductForm = {
  id: "",
  slug: "",
  name: "",
  category: "",
  categorySlugs: [] as string[],
  origin: "",
  description: "",
  priceVnd: 0,
  compareAtVnd: "" as number | "",
  imageUrl: "",
  imageUrls: [] as string[],
  giftReady: false,
  inStock: true,
  inventoryQuantity: "" as number | "",
  visible: true,
  sortOrder: 0,
};

const includesText = (value: unknown, query: string) =>
  String(value ?? "").toLowerCase().includes(query.trim().toLowerCase());

const stockLabel = (product: AdminProduct) =>
  product.inventory_quantity === null ? "Unlimited" : String(product.inventory_quantity);

const categoryLabel = (category: AdminCategory) =>
  category.name_vi || category.name || category.name_en || "";

const productSlugFromName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || "";
    }
  }, [value]);

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || "");
  };

  const setLink = () => {
    editorRef.current?.focus();
    const url = window.prompt("Enter link URL");
    if (!url) return;
    const normalizedUrl = /^(https?:|mailto:|tel:)/i.test(url)
      ? url
      : `https://${url}`;
    document.execCommand("createLink", false, normalizedUrl);
    onChange(editorRef.current?.innerHTML || "");
  };

  const headingLevels = ["h1", "h2", "h3", "h4", "h5", "h6"];

  return (
    <div className="overflow-hidden rounded-box border bg-base-100">
      <div className="flex flex-wrap items-center gap-1 border-b bg-base-200/60 p-2">
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          aria-label="Bold"
          onClick={() => runCommand("bold")}
        >
          <Bold size={17} />
        </button>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          aria-label="Italic"
          onClick={() => runCommand("italic")}
        >
          <Italic size={17} />
        </button>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          aria-label="Underline"
          onClick={() => runCommand("underline")}
        >
          <Underline size={17} />
        </button>
        <div className="divider divider-horizontal mx-1" />
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => runCommand("formatBlock", "p")}
        >
          Paragraph
        </button>
        {headingLevels.map((heading) => (
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            key={heading}
            onClick={() => runCommand("formatBlock", heading)}
          >
            {heading.toUpperCase()}
          </button>
        ))}
        <div className="divider divider-horizontal mx-1" />
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          aria-label="Bulleted list"
          onClick={() => runCommand("insertUnorderedList")}
        >
          <List size={17} />
        </button>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          aria-label="Numbered list"
          onClick={() => runCommand("insertOrderedList")}
        >
          <ListOrdered size={17} />
        </button>
        <div className="divider divider-horizontal mx-1" />
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          aria-label="Add link"
          onClick={setLink}
        >
          <Link size={17} />
        </button>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          aria-label="Remove link"
          onClick={() => runCommand("unlink")}
        >
          <Unlink size={17} />
        </button>
      </div>
      <div
        ref={editorRef}
        className="min-h-56 px-4 py-3 leading-7 outline-none prose prose-sm max-w-none"
        contentEditable
        role="textbox"
        aria-label="Description"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onBlur={(event) => onChange(event.currentTarget.innerHTML)}
        suppressContentEditableWarning
      />
    </div>
  );
}

function FilterBar({
  search,
  onSearch,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(14rem,1fr)_auto]">
      <label className="input input-bordered flex items-center gap-2">
        <Search size={18} />
        <input
          className="grow"
          placeholder="Search"
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </label>
      <div className="grid gap-3 sm:grid-flow-col">{children}</div>
    </div>
  );
}

export function AdminPage({
  adminPath = "",
  language = "vi",
  onNavigate,
}: {
  adminPath?: string;
  language?: Language;
  onNavigate: (href: string) => void;
}) {
  const adminPathSegments = adminPath.split("/").filter(Boolean);
  const requestedSection =
    adminPathSegments[0] === "customer"
      ? "customers"
      : adminPathSegments[0] === "order"
        ? "orders"
        : adminPathSegments[0];
  const activeSection: AdminSection =
    requestedSection === "customers" ||
    requestedSection === "products" ||
    requestedSection === "categories" ||
    requestedSection === "orders"
      ? requestedSection
      : "orders";
  const productEditorMode =
    activeSection === "products" && adminPathSegments[1] === "new"
      ? "new"
      : activeSection === "products" && Boolean(adminPathSegments[1])
        ? "edit"
        : null;
  const productEditorId =
    productEditorMode === "edit" ? adminPathSegments[1] : null;
  const [user, setUser] = useState<CustomerAccount | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [productEditorOpen, setProductEditorOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [orderSort, setOrderSort] = useState("newest");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerStatus, setCustomerStatus] = useState("all");
  const [customerSort, setCustomerSort] = useState("name-asc");
  const [productSearch, setProductSearch] = useState("");
  const [productVisibility, setProductVisibility] = useState("all");
  const [productStock, setProductStock] = useState("all");
  const [productCategory, setProductCategory] = useState("all");
  const [productSort, setProductSort] = useState("sort-order");
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryVisibility, setCategoryVisibility] = useState("all");
  const [categorySort, setCategorySort] = useState("sort-order");
  const [mediaSearch, setMediaSearch] = useState("");

  const isAdmin = Boolean(user?.roles.includes("admin"));

  useEffect(() => {
    if (productEditorMode === "new") {
      setProductForm(emptyProductForm);
      setSlugManuallyEdited(false);
      setMediaSearch("");
      setProductEditorOpen(true);
      return;
    }

    if (productEditorMode === "edit" && productEditorId) {
      const product = products.find(
        (candidate) =>
          candidate.id === productEditorId || candidate.slug === productEditorId,
      );
      if (!product) {
        if (products.length) setMessage("Product not found.");
        setProductEditorOpen(false);
        return;
      }

      setProductForm({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        categorySlugs: product.category_slugs || [],
        origin: product.origin,
        description: product.description,
        priceVnd: product.price_vnd,
        compareAtVnd: product.compare_at_vnd ?? "",
        imageUrl: product.image_url || "",
        imageUrls:
          product.image_urls?.length
            ? product.image_urls
            : product.image_url
              ? [product.image_url]
              : [],
        giftReady: product.gift_ready,
        inStock: product.in_stock,
        inventoryQuantity: product.inventory_quantity ?? "",
        visible: product.visible,
        sortOrder: product.sort_order,
      });
      setSlugManuallyEdited(true);
      setMediaSearch("");
      setProductEditorOpen(true);
      return;
    }

    setProductEditorOpen(false);
    setMediaPickerOpen(false);
  }, [productEditorMode, productEditorId, products]);

  const loadCurrentUser = async () => {
    setBusy(true);
    setMessage("");

    try {
      const payload = await kleverRequest<{
        ok: true;
        user: CustomerAccount | null;
      }>("auth", "/me");
      setUser(payload.user);
      if (payload.user?.roles.includes("admin")) {
        await loadAdminData();
      } else {
        setMessage("Admin access is required.");
      }
    } catch (error) {
      setUser(null);
      setMessage(
        error instanceof Error ? error.message : "Unable to check access.",
      );
    } finally {
      setBusy(false);
    }
  };

  const loadAdminData = async () => {
    setBusy(true);
    setMessage("");

    try {
      const [
        orderPayload,
        customerPayload,
        productPayload,
        categoryPayload,
        mediaPayload,
      ] =
        await Promise.all([
          kleverRequest<{ ok: true; orders: AdminOrder[] }>("admin", "/orders"),
          kleverRequest<{ ok: true; customers: CustomerRecord[] }>(
            "admin",
            "/customers",
          ),
          kleverRequest<{ ok: true; products: AdminProduct[] }>(
            "admin",
            "/products",
          ),
          kleverRequest<{ ok: true; categories: AdminCategory[] }>(
            "admin",
            "/categories",
          ),
          kleverRequest<{ ok: true; mediaAssets: MediaAsset[] }>(
            "admin",
            "/media",
          ),
        ]);

      setOrders(orderPayload.orders);
      setCustomers(customerPayload.customers);
      setProducts(productPayload.products);
      setCategories(categoryPayload.categories);
      setMediaAssets(mediaPayload.mediaAssets);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load admin data.",
      );
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const filteredOrders = useMemo(() => {
    return [...orders]
      .filter((order) => {
        const matchesSearch =
          includesText(order.order_number, orderSearch) ||
          includesText(order.customer_name, orderSearch) ||
          includesText(order.customer_email, orderSearch) ||
          includesText(order.customer_phone, orderSearch) ||
          includesText(order.delivery_address, orderSearch) ||
          order.items.some((item) => includesText(item.name, orderSearch));
        const matchesStatus = orderStatus === "all" || order.status === orderStatus;
        const matchesPayment =
          paymentStatus === "all" || order.payment_status === paymentStatus;
        return matchesSearch && matchesStatus && matchesPayment;
      })
      .sort((a, b) => {
        if (orderSort === "oldest") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (orderSort === "total-desc") return b.total_vnd - a.total_vnd;
        if (orderSort === "total-asc") return a.total_vnd - b.total_vnd;
        if (orderSort === "customer-asc") {
          return a.customer_name.localeCompare(b.customer_name);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [orders, orderSearch, orderStatus, paymentStatus, orderSort]);

  const filteredCustomers = useMemo(() => {
    return [...customers]
      .filter((customer) => {
        const matchesSearch =
          includesText(customer.full_name, customerSearch) ||
          includesText(customer.email, customerSearch) ||
          includesText(customer.phone, customerSearch) ||
          customer.roles.some((role) => includesText(role, customerSearch));
        const matchesStatus =
          customerStatus === "all" || customer.status === customerStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (customerSort === "email-asc") {
          return String(a.email || "").localeCompare(String(b.email || ""));
        }
        if (customerSort === "status-asc") return a.status.localeCompare(b.status);
        return a.full_name.localeCompare(b.full_name);
      });
  }, [customers, customerSearch, customerStatus, customerSort]);

  const filteredProducts = useMemo(() => {
    return [...products]
      .filter((product) => {
        const categoryText = (product.category_slugs || []).join(" ");
        const matchesSearch =
          includesText(product.name, productSearch) ||
          includesText(product.slug, productSearch) ||
          includesText(product.origin, productSearch) ||
          includesText(product.category, productSearch) ||
          includesText(categoryText, productSearch);
        const matchesVisibility =
          productVisibility === "all" ||
          (productVisibility === "visible" ? product.visible : !product.visible);
        const matchesStock =
          productStock === "all" ||
          (productStock === "in-stock" &&
            product.in_stock &&
            product.inventory_quantity !== 0) ||
          (productStock === "low-stock" &&
            product.in_stock &&
            product.inventory_quantity !== null &&
            product.inventory_quantity > 0 &&
            product.inventory_quantity <= 5) ||
          (productStock === "out-of-stock" &&
            (!product.in_stock || product.inventory_quantity === 0));
        const matchesCategory =
          productCategory === "all" ||
          product.category_slugs?.includes(productCategory) ||
          product.category === productCategory;
        return matchesSearch && matchesVisibility && matchesStock && matchesCategory;
      })
      .sort((a, b) => {
        if (productSort === "name-asc") return a.name.localeCompare(b.name);
        if (productSort === "price-desc") return b.price_vnd - a.price_vnd;
        if (productSort === "price-asc") return a.price_vnd - b.price_vnd;
        if (productSort === "stock-asc") {
          return (a.inventory_quantity ?? 999999) - (b.inventory_quantity ?? 999999);
        }
        return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
      });
  }, [
    products,
    productSearch,
    productVisibility,
    productStock,
    productCategory,
    productSort,
  ]);

  const filteredCategories = useMemo(() => {
    return [...categories]
      .filter((category) => {
        const matchesSearch =
          includesText(category.name, categorySearch) ||
          includesText(category.name_vi, categorySearch) ||
          includesText(category.name_en, categorySearch) ||
          includesText(category.slug, categorySearch) ||
          includesText(category.source_path, categorySearch);
        const matchesVisibility =
          categoryVisibility === "all" ||
          (categoryVisibility === "visible" ? category.visible : !category.visible);
        return matchesSearch && matchesVisibility;
      })
      .sort((a, b) => {
        if (categorySort === "name-asc") {
          return categoryLabel(a).localeCompare(categoryLabel(b));
        }
        if (categorySort === "slug-asc") return a.slug.localeCompare(b.slug);
        return a.sort_order - b.sort_order || categoryLabel(a).localeCompare(categoryLabel(b));
      });
  }, [categories, categorySearch, categoryVisibility, categorySort]);

  const filteredMediaAssets = useMemo(
    () =>
      mediaAssets.filter(
        (asset) =>
          includesText(asset.file_name, mediaSearch) ||
          includesText(asset.alt_text, mediaSearch),
      ),
    [mediaAssets, mediaSearch],
  );

  const productStats = useMemo(
    () => ({
      visible: products.filter((product) => product.visible).length,
      hidden: products.filter((product) => !product.visible).length,
      lowStock: products.filter(
        (product) =>
          product.in_stock &&
          product.inventory_quantity !== null &&
          product.inventory_quantity > 0 &&
          product.inventory_quantity <= 5,
      ).length,
      outOfStock: products.filter(
        (product) => !product.in_stock || product.inventory_quantity === 0,
      ).length,
    }),
    [products],
  );

  const updateOrder = async (
    orderId: string,
    status: string,
    paymentStatusValue?: string,
  ) => {
    setBusy(true);
    setMessage("");

    try {
      const payload = await kleverRequest<{ ok: true; orders: AdminOrder[] }>(
        "admin",
        "/orders",
        {
          method: "PATCH",
          body: JSON.stringify({ orderId, status, paymentStatus: paymentStatusValue }),
        },
      );
      setOrders(payload.orders);
      setMessage("Order updated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update order.",
      );
    } finally {
      setBusy(false);
    }
  };

  const openNewProduct = () => {
    onNavigate(localizedPath(language, "admin", "products/new"));
  };

  const editProduct = (product: AdminProduct) => {
    onNavigate(localizedPath(language, "admin", `products/${product.id}`));
  };

  const closeProductEditor = () => {
    setProductEditorOpen(false);
    setMediaPickerOpen(false);
    setProductForm(emptyProductForm);
    setSlugManuallyEdited(false);
    setMediaSearch("");
    onNavigate(localizedPath(language, "admin", "products"));
  };

  const saveProduct = async () => {
    setBusy(true);
    setMessage("");

    try {
      const payload = await kleverRequest<{
        ok: true;
        products: AdminProduct[];
      }>("admin", "/products", {
        method: "POST",
        body: JSON.stringify(productForm),
      });
      setProducts(payload.products);
      setProductForm(emptyProductForm);
      setProductModalOpen(false);
      setProductEditorOpen(false);
      onNavigate(localizedPath(language, "admin", "products"));
      setMessage("Product saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save product.",
      );
    } finally {
      setBusy(false);
    }
  };

  const uploadProductImage = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploadBusy(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", productForm.name || file.name);
      const payload = await kleverRequest<{
        ok: true;
        mediaAssets: MediaAsset[];
      }>("admin", "/media", {
        method: "POST",
        body: formData,
      });
      setMediaAssets(payload.mediaAssets);
      const uploaded = payload.mediaAssets[0];
      if (uploaded) {
        setProductForm((current) => ({
          ...current,
          imageUrl: uploaded.public_url,
          imageUrls: [
            uploaded.public_url,
            ...current.imageUrls.filter((url) => url !== uploaded.public_url),
          ],
        }));
      }
      setMessage("Image uploaded.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to upload image.",
      );
    } finally {
      setUploadBusy(false);
    }
  };

  const toggleProductImage = (imageUrl: string) => {
    setProductForm((current) => {
      const exists = current.imageUrls.includes(imageUrl);
      const imageUrls = exists
        ? current.imageUrls.filter((url) => url !== imageUrl)
        : [...current.imageUrls, imageUrl];
      return {
        ...current,
        imageUrls,
        imageUrl: exists
          ? current.imageUrl === imageUrl
            ? imageUrls[0] || ""
            : current.imageUrl
          : current.imageUrl || imageUrl,
      };
    });
  };

  const setPrimaryProductImage = (imageUrl: string) => {
    setProductForm((current) => ({
      ...current,
      imageUrl,
      imageUrls: [
        imageUrl,
        ...current.imageUrls.filter((url) => url !== imageUrl),
      ],
    }));
  };

  const removeProductImage = (imageUrl: string) => {
    setProductForm((current) => {
      const imageUrls = current.imageUrls.filter((url) => url !== imageUrl);
      return {
        ...current,
        imageUrls,
        imageUrl: current.imageUrl === imageUrl ? imageUrls[0] || "" : current.imageUrl,
      };
    });
  };

  const openNewCategory = () => {
    setCategoryForm(emptyCategoryForm);
    setCategoryModalOpen(true);
  };

  const editCategory = (category: AdminCategory) => {
    setCategoryForm({
      id: category.id,
      slug: category.slug,
      name: category.name,
      nameVi: category.name_vi || category.name,
      nameEn: category.name_en || "",
      sourcePath: category.source_path,
      sortOrder: category.sort_order,
      visible: category.visible,
    });
    setCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    setBusy(true);
    setMessage("");

    try {
      const payload = await kleverRequest<{
        ok: true;
        categories: AdminCategory[];
      }>("admin", "/categories", {
        method: "POST",
        body: JSON.stringify(categoryForm),
      });
      setCategories(payload.categories);
      setCategoryForm(emptyCategoryForm);
      setCategoryModalOpen(false);
      setMessage("Category saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save category.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <section className="px-4 py-12 mx-auto max-w-7xl">
        <div className="card bg-base-100">
          <div className="card-body">
            <h1 className="card-title">Admin dashboard</h1>
            <p>Sign in with an admin account to manage orders and products.</p>
            <button
              className="btn btn-primary w-fit"
              type="button"
              onClick={() =>
                onNavigate(
                  `${localizedPath(language, "account")}?next=${encodeURIComponent(
                    localizedPath(language, "admin", adminPath),
                  )}`,
                )
              }
            >
              Go to account
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="px-4 py-12 mx-auto max-w-7xl">
        <div className="card bg-base-100">
          <div className="card-body">
            <h1 className="card-title">Admin dashboard</h1>
            <p>Admin access is required for this dashboard.</p>
            {message && <div className="alert">{message}</div>}
            <button
              className="btn btn-primary w-fit"
              type="button"
              disabled={busy}
              onClick={loadCurrentUser}
            >
              {busy ? "Checking..." : "Check access again"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (productEditorOpen) {
    return (
      <section className="px-4 py-8 mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={closeProductEditor}
          >
            <ArrowLeft size={18} />
            Products
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-outline"
              type="button"
              onClick={closeProductEditor}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy}
              onClick={saveProduct}
            >
              <Save size={18} />
              {busy ? "Saving..." : "Save product"}
            </button>
          </div>
        </div>

        <div className="mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-6">
            <div className="card bg-base-100">
              <div className="card-body gap-5">
                <div>
                  <p className="text-sm font-bold uppercase text-primary">
                    Product editor
                  </p>
                  <h1 className="text-3xl font-black">
                    {productForm.id ? productForm.name || "Edit product" : "Add product"}
                  </h1>
                  <p className="text-sm text-base-content/60">
                    Update the product details customers see in the storefront.
                  </p>
                </div>
                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="label-text">Title</span>
                    <input
                      className="input input-bordered"
                      value={productForm.name}
                      onChange={(event) => {
                        const name = event.target.value;
                        setProductForm((current) => ({
                          ...current,
                          name,
                          slug: slugManuallyEdited
                            ? current.slug
                            : productSlugFromName(name),
                        }));
                      }}
                    />
                  </label>
                </div>
                <label className="grid gap-2">
                  <span className="label-text">Description</span>
                  <RichTextEditor
                    value={productForm.description}
                    onChange={(description) =>
                      setProductForm((current) => ({
                        ...current,
                        description,
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="card bg-base-100">
              <div className="card-body gap-4">
                <div>
                  <h2 className="card-title">Media</h2>
                  <p className="text-sm text-base-content/60">
                    The first image is used as the primary product image.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {productForm.imageUrls.map((imageUrl, index) => (
                    <div
                      className={`group relative overflow-hidden rounded-box border bg-base-100 ${
                        index === 0 ? "border-primary ring-2 ring-primary" : ""
                      }`}
                      key={imageUrl}
                    >
                      <button
                        className="block w-40"
                        type="button"
                        onClick={() => setPrimaryProductImage(imageUrl)}
                      >
                        <img
                          className="object-cover w-full aspect-square"
                          src={imageUrl}
                          alt=""
                        />
                        <span className="block truncate px-2 py-2 text-left text-xs">
                          {index === 0 ? "Primary image" : `Gallery image ${index + 1}`}
                        </span>
                      </button>
                      <button
                        className="btn btn-circle btn-xs absolute right-2 top-2"
                        type="button"
                        aria-label="Remove image"
                        onClick={() => removeProductImage(imageUrl)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="grid h-40 w-40 place-items-center rounded-box border border-dashed bg-base-200 text-base-content/70 hover:border-primary hover:text-primary"
                    type="button"
                    onClick={() => setMediaPickerOpen(true)}
                  >
                    <span className="grid justify-items-center gap-2">
                      <Plus size={28} />
                      <span className="text-sm font-semibold">Add media</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-base-100">
              <div className="card-body gap-4">
                <h2 className="card-title">Pricing</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="label-text">Price VND</span>
                    <input
                      className="input input-bordered"
                      type="number"
                      value={productForm.priceVnd}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          priceVnd: Number(event.target.value || 0),
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="label-text">Compare-at price VND</span>
                    <input
                      className="input input-bordered"
                      type="number"
                      value={productForm.compareAtVnd}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          compareAtVnd: event.target.value
                            ? Number(event.target.value)
                            : "",
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="card bg-base-100">
              <div className="card-body gap-4">
                <h2 className="card-title">Inventory</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="label-text">Inventory quantity</span>
                    <input
                      className="input input-bordered"
                      type="number"
                      value={productForm.inventoryQuantity}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          inventoryQuantity: event.target.value
                            ? Number(event.target.value)
                            : "",
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="label-text">Sort order</span>
                    <input
                      className="input input-bordered"
                      type="number"
                      value={productForm.sortOrder}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          sortOrder: Number(event.target.value || 0),
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <aside className="grid h-fit gap-6 lg:sticky lg:top-6">
            <div className="card bg-base-100">
              <div className="card-body gap-4">
                <h2 className="card-title">Status</h2>
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    className="h-4 w-4 rounded border-base-content/30 accent-primary"
                    type="checkbox"
                    checked={productForm.visible}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        visible: event.target.checked,
                      }))
                    }
                  />
                  <span className="font-medium">Visible in store</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    className="h-4 w-4 rounded border-base-content/30 accent-primary"
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        inStock: event.target.checked,
                      }))
                    }
                  />
                  <span className="font-medium">Available for purchase</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    className="h-4 w-4 rounded border-base-content/30 accent-primary"
                    type="checkbox"
                    checked={productForm.giftReady}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        giftReady: event.target.checked,
                      }))
                    }
                  />
                  <span className="font-medium">Gift ready</span>
                </label>
              </div>
            </div>

            <div className="card bg-base-100">
              <div className="card-body gap-4">
                <h2 className="card-title">Product organization</h2>
                <label className="grid gap-2">
                  <span className="label-text">Origin</span>
                  <input
                    className="input input-bordered"
                    value={productForm.origin}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        origin: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="grid gap-2">
                  <span className="label-text">Slug</span>
                  <input
                    className="input input-bordered"
                    value={productForm.slug}
                    onChange={(event) => {
                      setSlugManuallyEdited(true);
                      setProductForm((current) => ({
                        ...current,
                        slug: event.target.value,
                      }));
                    }}
                    onBlur={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        slug: productSlugFromName(event.target.value),
                      }))
                    }
                  />
                  <span className="text-xs text-base-content/60">
                    Generated from the title unless customized.
                  </span>
                </label>
                <div>
                  <h2 className="card-title">Categories</h2>
                  <p className="text-sm text-base-content/60">
                    Assign one or more storefront categories.
                  </p>
                </div>
                <div className="grid gap-3">
                  {categories.map((category) => (
                    <label
                      className="flex cursor-pointer items-center gap-3 text-sm"
                      key={category.id}
                    >
                      <input
                        className="h-4 w-4 shrink-0 rounded border-base-content/30 accent-primary"
                        type="checkbox"
                        checked={productForm.categorySlugs.includes(category.slug)}
                        onChange={(event) =>
                          setProductForm((current) => ({
                            ...current,
                            categorySlugs: event.target.checked
                              ? [...current.categorySlugs, category.slug]
                              : current.categorySlugs.filter(
                                  (slug) => slug !== category.slug,
                                ),
                            category:
                              event.target.checked && !current.category
                                ? category.name
                                : current.category,
                          }))
                        }
                      />
                      <span className="font-medium leading-tight">
                        {categoryLabel(category)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {message && <div className="mt-6 alert">{message}</div>}

        {mediaPickerOpen && (
          <div className="modal modal-open">
            <div className="modal-box max-w-6xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Select file</h2>
                  <p className="text-sm text-base-content/60">
                    Choose images from the library or upload new files.
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-circle"
                  type="button"
                  aria-label="Close media picker"
                  onClick={() => setMediaPickerOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_auto]">
                <label className="input input-bordered flex items-center gap-2">
                  <Search size={16} />
                  <input
                    className="grow"
                    placeholder="Search files"
                    value={mediaSearch}
                    onChange={(event) => setMediaSearch(event.target.value)}
                  />
                </label>
                <label className={`btn btn-outline ${uploadBusy ? "btn-disabled" : ""}`}>
                  <Upload size={18} />
                  {uploadBusy ? "Uploading..." : "Add media"}
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    disabled={uploadBusy}
                    onChange={(event) => {
                      void uploadProductImage(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="mt-5 rounded-box border border-dashed bg-base-200 p-8 text-center">
                <label className={`btn btn-primary ${uploadBusy ? "btn-disabled" : ""}`}>
                  <Upload size={18} />
                  {uploadBusy ? "Uploading..." : "Upload image"}
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    disabled={uploadBusy}
                    onChange={(event) => {
                      void uploadProductImage(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <p className="mt-3 text-sm text-base-content/60">
                  Uploads are added to the media library and selected for this product.
                </p>
              </div>

              <div className="mt-6 grid max-h-[32rem] gap-4 overflow-y-auto sm:grid-cols-3 lg:grid-cols-5">
                {filteredMediaAssets.map((asset) => {
                  const selected = productForm.imageUrls.includes(asset.public_url);
                  return (
                    <button
                      className={`relative overflow-hidden rounded-box border bg-base-100 p-2 text-left ${
                        selected ? "border-primary ring-2 ring-primary" : ""
                      }`}
                      key={asset.id}
                      type="button"
                      onClick={() => toggleProductImage(asset.public_url)}
                    >
                      <img
                        className="object-cover w-full rounded-box aspect-square"
                        src={asset.public_url}
                        alt={asset.alt_text || asset.file_name}
                      />
                      <span className="mt-2 block truncate text-sm">
                        {asset.file_name}
                      </span>
                      {selected && (
                        <span className="absolute left-3 top-3 rounded-full bg-primary p-1 text-primary-content">
                          <Check size={14} />
                        </span>
                      )}
                    </button>
                  );
                })}
                {!filteredMediaAssets.length && (
                  <div className="rounded-box border border-dashed bg-base-100 p-6 text-center text-sm text-base-content/60 sm:col-span-3 lg:col-span-5">
                    No images in the media library yet.
                  </div>
                )}
              </div>

              <div className="modal-action">
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => setMediaPickerOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setMediaPickerOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
            <button
              aria-label="Close media picker"
              className="modal-backdrop"
              type="button"
              onClick={() => setMediaPickerOpen(false)}
            />
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="px-4 py-12 mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-4 badge badge-primary">Admin</div>
          <h1 className="text-4xl font-black uppercase sm:text-6xl">
            Store dashboard
          </h1>
          <p className="mt-4 text-base-content/70">
            Manage fulfillment, customer records, products, and categories.
          </p>
        </div>
        <button
          className="btn btn-outline"
          type="button"
          onClick={loadAdminData}
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-3 mt-8 md:grid-cols-4">
        {[
          ["orders", "Orders", orders.length, PackageCheck],
          ["customers", "Customers", customers.length, UsersRound],
          ["products", "Products", products.length, CheckCircle2],
          ["categories", "Categories", categories.length, Tags],
        ].map(([key, label, count, Icon]) => (
          <button
            className={`btn h-auto justify-start gap-3 py-4 ${
              activeSection === key ? "btn-primary" : "btn-outline"
            }`}
            key={key as string}
            type="button"
            onClick={() =>
              onNavigate(localizedPath(language, "admin", String(key)))
            }
          >
            <Icon size={20} />
            <span>
              {label}
              <span className="ml-2 badge">{count}</span>
            </span>
          </button>
        ))}
      </div>

      {message && <div className="mt-6 alert">{message}</div>}

      {activeSection === "orders" && (
        <div className="mt-6 card bg-base-100">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="card-title">All orders</h2>
              <span className="text-sm text-base-content/60">
                {filteredOrders.length} of {orders.length}
              </span>
            </div>
            <FilterBar search={orderSearch} onSearch={setOrderSearch}>
              <select
                className="select select-bordered"
                value={orderStatus}
                onChange={(event) => setOrderStatus(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="confirmed">Confirmed</option>
                <option value="packing">Packing</option>
                <option value="delivering">Delivering</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                className="select select-bordered"
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value)}
              >
                <option value="all">All payments</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                className="select select-bordered"
                value={orderSort}
                onChange={(event) => setOrderSort(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="total-desc">Total high to low</option>
                <option value="total-asc">Total low to high</option>
                <option value="customer-asc">Customer A-Z</option>
              </select>
            </FilterBar>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Tổng cộng</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div className="font-semibold">{order.order_number}</div>
                        <div className="text-xs text-base-content/60">
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                        <div className="text-xs text-base-content/60">
                          {order.delivery_address}
                        </div>
                      </td>
                      <td>
                        <div>{order.customer_name}</div>
                        <div className="text-xs text-base-content/60">
                          {order.customer_email || order.customer_phone}
                        </div>
                      </td>
                      <td>
                        {order.items.map((item) => (
                          <div className="text-sm" key={`${order.id}-${item.name}`}>
                            {item.name} x {item.quantity}
                          </div>
                        ))}
                      </td>
                      <td>
                        <select
                          className="select select-bordered select-sm"
                          value={order.status}
                          disabled={busy}
                          onChange={(event) =>
                            updateOrder(order.id, event.target.value)
                          }
                        >
                          {[
                            "new",
                            "confirmed",
                            "packing",
                            "delivering",
                            "completed",
                            "cancelled",
                          ].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <div className="mt-2 badge badge-ghost">
                          {order.payment_status}
                        </div>
                      </td>
                      <td className="font-semibold">{formatVnd(order.total_vnd)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          type="button"
                          disabled={busy || order.status === "completed"}
                          onClick={() => updateOrder(order.id, "completed", "paid")}
                        >
                          Fulfill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSection === "customers" && (
        <div className="mt-6 card bg-base-100">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="card-title">Customer accounts</h2>
              <span className="text-sm text-base-content/60">
                {filteredCustomers.length} of {customers.length}
              </span>
            </div>
            <FilterBar search={customerSearch} onSearch={setCustomerSearch}>
              <select
                className="select select-bordered"
                value={customerStatus}
                onChange={(event) => setCustomerStatus(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              <select
                className="select select-bordered"
                value={customerSort}
                onChange={(event) => setCustomerSort(event.target.value)}
              >
                <option value="name-asc">Name A-Z</option>
                <option value="email-asc">Email A-Z</option>
                <option value="status-asc">Status A-Z</option>
              </select>
            </FilterBar>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.full_name}</td>
                      <td>
                        <div>{customer.email}</div>
                        <div className="text-xs text-base-content/60">
                          {customer.phone}
                        </div>
                      </td>
                      <td>{customer.status}</td>
                      <td>{customer.roles.join(", ") || "customer"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSection === "products" && (
        <div className="mt-6 card bg-base-100">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="card-title">Product list</h2>
                <p className="text-sm text-base-content/60">
                  {filteredProducts.length} of {products.length}
                </p>
              </div>
              <button className="btn btn-primary" type="button" onClick={openNewProduct}>
                <Plus size={18} />
                Add product
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ["Visible", productStats.visible, CheckCircle2],
                ["Hidden", productStats.hidden, EyeOff],
                ["Low stock", productStats.lowStock, AlertTriangle],
                ["Out of stock", productStats.outOfStock, PackageCheck],
              ].map(([label, count, Icon]) => (
                <button
                  className="btn h-auto justify-start gap-3 py-3 btn-outline"
                  key={label as string}
                  type="button"
                  onClick={() => {
                    if (label === "Visible") {
                      setProductVisibility("visible");
                      setProductStock("all");
                    }
                    if (label === "Hidden") {
                      setProductVisibility("hidden");
                      setProductStock("all");
                    }
                    if (label === "Low stock") {
                      setProductVisibility("all");
                      setProductStock("low-stock");
                    }
                    if (label === "Out of stock") {
                      setProductVisibility("all");
                      setProductStock("out-of-stock");
                    }
                  }}
                >
                  <Icon size={18} />
                  <span className="text-left">
                    <span className="block text-xs text-base-content/60">
                      {label}
                    </span>
                    <span className="text-lg font-bold">{count as number}</span>
                  </span>
                </button>
              ))}
            </div>
            <FilterBar search={productSearch} onSearch={setProductSearch}>
              <select
                className="select select-bordered"
                value={productCategory}
                onChange={(event) => setProductCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {categoryLabel(category)}
                  </option>
                ))}
              </select>
              <select
                className="select select-bordered"
                value={productVisibility}
                onChange={(event) => setProductVisibility(event.target.value)}
              >
                <option value="all">All visibility</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
              <select
                className="select select-bordered"
                value={productStock}
                onChange={(event) => setProductStock(event.target.value)}
              >
                <option value="all">All stock</option>
                <option value="in-stock">In stock</option>
                <option value="low-stock">Low stock</option>
                <option value="out-of-stock">Out of stock</option>
              </select>
              <select
                className="select select-bordered"
                value={productSort}
                onChange={(event) => setProductSort(event.target.value)}
              >
                <option value="sort-order">Manual order</option>
                <option value="name-asc">Name A-Z</option>
                <option value="price-desc">Price high to low</option>
                <option value="price-asc">Price low to high</option>
                <option value="stock-asc">Stock low to high</option>
              </select>
            </FilterBar>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Categories</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Visible</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="font-semibold">{product.name}</div>
                        <div className="text-xs text-base-content/60">{product.slug}</div>
                      </td>
                      <td className="text-sm">
                        {(product.category_slugs || []).join(", ") || product.category}
                      </td>
                      <td>{formatVnd(product.price_vnd)}</td>
                      <td>{stockLabel(product)}</td>
                      <td>{product.visible ? "Yes" : "No"}</td>
                      <td>
                        <button
                          className="btn btn-xs"
                          type="button"
                          onClick={() => editProduct(product)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSection === "categories" && (
        <div className="mt-6 card bg-base-100">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="card-title">Category list</h2>
                <p className="text-sm text-base-content/60">
                  {filteredCategories.length} of {categories.length}
                </p>
              </div>
              <button className="btn btn-primary" type="button" onClick={openNewCategory}>
                <Plus size={18} />
                Add category
              </button>
            </div>
            <FilterBar search={categorySearch} onSearch={setCategorySearch}>
              <select
                className="select select-bordered"
                value={categoryVisibility}
                onChange={(event) => setCategoryVisibility(event.target.value)}
              >
                <option value="all">All visibility</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
              <select
                className="select select-bordered"
                value={categorySort}
                onChange={(event) => setCategorySort(event.target.value)}
              >
                <option value="sort-order">Manual order</option>
                <option value="name-asc">Name A-Z</option>
                <option value="slug-asc">Slug A-Z</option>
              </select>
            </FilterBar>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vietnamese</th>
                    <th>English</th>
                    <th>Slug</th>
                    <th>Visible</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.name_vi || category.name}</td>
                      <td>{category.name_en || "Auto translate"}</td>
                      <td>{category.slug}</td>
                      <td>{category.visible ? "Yes" : "No"}</td>
                      <td>
                        <button
                          className="btn btn-xs"
                          type="button"
                          onClick={() => editCategory(category)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {false && productModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="text-xl font-bold">
              {productForm.id ? "Edit product" : "Add product"}
            </h3>
            <form
              className="grid gap-4 mt-5"
              onSubmit={(event) => {
                event.preventDefault();
                saveProduct();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="input input-bordered"
                  placeholder="Product name"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
                <input
                  className="input input-bordered"
                  placeholder="Slug"
                  value={productForm.slug}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </div>
              <input
                className="input input-bordered"
                placeholder="Origin"
                value={productForm.origin}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, origin: event.target.value }))
                }
              />
              <textarea
                className="textarea textarea-bordered"
                placeholder="Description"
                rows={3}
                value={productForm.description}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="input input-bordered"
                  placeholder="Price VND"
                  type="number"
                  value={productForm.priceVnd}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      priceVnd: Number(event.target.value || 0),
                    }))
                  }
                />
                <input
                  className="input input-bordered"
                  placeholder="Compare at VND"
                  type="number"
                  value={productForm.compareAtVnd}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      compareAtVnd: event.target.value ? Number(event.target.value) : "",
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
                <div className="overflow-hidden border rounded-box bg-base-200">
                  {productForm.imageUrl ? (
                    <img
                      className="object-cover w-full aspect-square"
                      src={productForm.imageUrl}
                      alt={productForm.name || "Selected product image"}
                    />
                  ) : (
                    <div className="grid aspect-square place-items-center text-base-content/50">
                      <ImageIcon size={40} />
                    </div>
                  )}
                  <div className="p-3 space-y-2 bg-base-100">
                    <p className="text-sm font-semibold">Selected product image</p>
                    <p className="text-xs text-base-content/60">
                      {productForm.imageUrls.length} image
                      {productForm.imageUrls.length === 1 ? "" : "s"} selected
                    </p>
                    <input
                      className="input input-bordered input-sm w-full"
                      placeholder="Paste image URL"
                      value={productForm.imageUrl}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          imageUrl: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Media library</p>
                      <p className="text-sm text-base-content/60">
                        Pick an existing image or upload a new one.
                      </p>
                    </div>
                    <label className={`btn btn-outline ${uploadBusy ? "btn-disabled" : ""}`}>
                      <Upload size={18} />
                      {uploadBusy ? "Uploading..." : "Upload image"}
                      <input
                        className="hidden"
                        type="file"
                        accept="image/*"
                        disabled={uploadBusy}
                        onChange={(event) => {
                          void uploadProductImage(event.target.files);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <label className="input input-bordered input-sm flex items-center gap-2">
                    <Search size={16} />
                    <input
                      className="grow"
                      placeholder="Search images"
                      value={mediaSearch}
                      onChange={(event) => setMediaSearch(event.target.value)}
                    />
                  </label>
                  <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto rounded-box border bg-base-200 p-3 sm:grid-cols-3">
                    {filteredMediaAssets.map((asset) => {
                      const selected = productForm.imageUrls.includes(asset.public_url);
                      const primary = productForm.imageUrl === asset.public_url;
                      return (
                        <div
                          className={`group relative overflow-hidden rounded-box border bg-base-100 text-left ${
                            primary
                              ? "border-primary ring-2 ring-primary"
                              : selected
                                ? "border-primary"
                                : ""
                          }`}
                          key={asset.id}
                        >
                          <img
                            className="object-cover w-full aspect-square"
                            src={asset.public_url}
                            alt={asset.alt_text || asset.file_name}
                          />
                          <span className="block truncate px-2 py-1 text-xs">
                            {asset.file_name}
                          </span>
                          <div className="grid grid-cols-2 gap-1 p-2 pt-0">
                            <button
                              className={`btn btn-xs ${selected ? "btn-primary" : "btn-outline"}`}
                              type="button"
                              onClick={() => toggleProductImage(asset.public_url)}
                            >
                              {selected ? "Selected" : "Select"}
                            </button>
                            <button
                              className="btn btn-xs btn-outline"
                              type="button"
                              disabled={!selected}
                              onClick={() => setPrimaryProductImage(asset.public_url)}
                            >
                              Primary
                            </button>
                          </div>
                          {primary && (
                            <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-content">
                              <Check size={14} />
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {!filteredMediaAssets.length && (
                      <div className="col-span-full rounded-box border border-dashed bg-base-100 p-6 text-center text-sm text-base-content/60">
                        No images in the media library yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="input input-bordered"
                  placeholder="Inventory quantity"
                  type="number"
                  value={productForm.inventoryQuantity}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      inventoryQuantity: event.target.value
                        ? Number(event.target.value)
                        : "",
                    }))
                  }
                />
                <input
                  className="input input-bordered"
                  placeholder="Sort order"
                  type="number"
                  value={productForm.sortOrder}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      sortOrder: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <span className="font-semibold">Categories</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {categories.map((category) => (
                    <label
                      className="label justify-start gap-2 cursor-pointer"
                      key={category.id}
                    >
                      <input
                        className="checkbox checkbox-primary"
                        type="checkbox"
                        checked={productForm.categorySlugs.includes(category.slug)}
                        onChange={(event) =>
                          setProductForm((current) => ({
                            ...current,
                            categorySlugs: event.target.checked
                              ? [...current.categorySlugs, category.slug]
                              : current.categorySlugs.filter(
                                  (slug) => slug !== category.slug,
                                ),
                          }))
                        }
                      />
                      <span className="label-text">{categoryLabel(category)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["visible", "Visible"],
                  ["inStock", "In stock"],
                  ["giftReady", "Gift ready"],
                ].map(([key, label]) => (
                  <label className="label justify-start gap-2 cursor-pointer" key={key}>
                    <input
                      className="checkbox checkbox-primary"
                      type="checkbox"
                      checked={Boolean(productForm[key as keyof typeof productForm])}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          [key]: event.target.checked,
                        }))
                      }
                    />
                    <span className="label-text">{label}</span>
                  </label>
                ))}
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  Save product
                </button>
              </div>
            </form>
          </div>
          <button
            aria-label="Close product form"
            className="modal-backdrop"
            type="button"
            onClick={() => setProductModalOpen(false)}
          />
        </div>
      )}

      {categoryModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="text-xl font-bold">
              {categoryForm.id ? "Edit category" : "Add category"}
            </h3>
            <form
              className="grid gap-4 mt-5"
              onSubmit={(event) => {
                event.preventDefault();
                saveCategory();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="input input-bordered"
                  placeholder="Vietnamese name"
                  value={categoryForm.nameVi}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      nameVi: event.target.value,
                      name: event.target.value || current.nameEn,
                    }))
                  }
                />
                <input
                  className="input input-bordered"
                  placeholder="English name (optional)"
                  value={categoryForm.nameEn}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      nameEn: event.target.value,
                      name: current.nameVi || event.target.value,
                    }))
                  }
                />
              </div>
              <input
                className="input input-bordered"
                placeholder="Slug"
                value={categoryForm.slug}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, slug: event.target.value }))
                }
              />
              <input
                className="input input-bordered"
                placeholder="Source path"
                value={categoryForm.sourcePath}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    sourcePath: event.target.value,
                  }))
                }
              />
              <input
                className="input input-bordered"
                placeholder="Sort order"
                type="number"
                value={categoryForm.sortOrder}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value || 0),
                  }))
                }
              />
              <label className="label justify-start gap-2 cursor-pointer">
                <input
                  className="checkbox checkbox-primary"
                  type="checkbox"
                  checked={categoryForm.visible}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      visible: event.target.checked,
                    }))
                  }
                />
                <span className="label-text">Visible</span>
              </label>
              <p className="text-sm text-base-content/60">
                If English is left blank, the storefront can fall back to the Vietnamese
                name or a translation layer.
              </p>
              <div className="modal-action">
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  Save category
                </button>
              </div>
            </form>
          </div>
          <button
            aria-label="Close category form"
            className="modal-backdrop"
            type="button"
            onClick={() => setCategoryModalOpen(false)}
          />
        </div>
      )}
    </section>
  );
}
