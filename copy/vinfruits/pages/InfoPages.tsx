import { useEffect, useMemo, useState } from "react";
import { MapPin, PackageCheck, Truck, UserRound } from "lucide-react";
import { formatVnd } from "@vinfuit/fruitData";
import { kleverRequest } from "@vinfuit/lib/api";
import { businessInfo } from "@vinfuit/lib/business-info";
import { localizedPath } from "@vinfuit/lib/cart";
import { type Language } from "@vinfuit/lib/i18n";

type CustomerAccount = {
  id: string;
  name: string;
  phone: string;
  email: string;
  roles: string[];
};

type OrderHistoryItem = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
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

type InventoryRecord = {
  slug: string;
  name: string;
  inventory_quantity: number | null;
  in_stock: boolean;
  visible: boolean;
};

type CustomerAddress = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  ward: string | null;
  district: string | null;
  city: string;
  country: string;
  is_default: boolean;
};

const emptyCreateForm = {
  name: "",
  phone: "",
  email: "",
  password: "",
};

const emptySignInForm = {
  login: "",
  password: "",
};

const emptyResetRequestForm = {
  email: "",
};

const emptyResetForm = {
  token: "",
  password: "",
};

const emptyProfileForm = {
  name: "",
  email: "",
  phone: "",
};

const emptyPasswordForm = {
  currentPassword: "",
  password: "",
};

const emptyAddressForm = {
  id: "",
  label: "Home",
  recipient_name: "",
  phone: "",
  address_line_1: "",
  address_line_2: "",
  ward: "",
  district: "",
  city: "",
  country: "Vietnam",
  is_default: false,
};

export function AboutPage({ language = "vi" }: { language?: Language }) {
  const timeline = [
    {
      year: "2017",
      title: "VinFruits ra đời",
      body: "Bắt đầu với niềm tin rằng trái cây nhập khẩu chất lượng cao cần được tuyển chọn kỹ, bảo quản đúng chuẩn và phục vụ bằng sự tử tế.",
    },
    {
      year: "Hôm nay",
      title: "Quà tặng từ sự tử tế",
      body: "Mỗi giỏ quà được tư vấn theo người nhận, dịp tặng và ngân sách để món quà vừa đẹp mắt, vừa thiết thực cho sức khỏe.",
    },
    {
      year: "Mỗi ngày",
      title: "Only the finest fruits",
      body: "VinFruits duy trì lựa chọn trái cây thượng hạng, giao nhanh nội thành và cam kết chăm sóc sau bán hàng để khách hàng luôn an tâm.",
    },
  ];

  const values = [
    {
      icon: PackageCheck,
      title: "Tuyển chọn thượng hạng",
      body: "Ưu tiên những loại trái cây nhập khẩu cao cấp, hình thức đẹp, vị ngon ổn định và phù hợp để dùng hằng ngày hoặc làm quà tặng.",
    },
    {
      icon: UserRound,
      title: "Tư vấn tinh tế",
      body: "Đội ngũ VinFruits hỗ trợ chọn mẫu giỏ, phối màu, lời chúc và ngân sách để món quà thể hiện đúng sự trân trọng của người gửi.",
    },
    {
      icon: Truck,
      title: "Giao nhanh an tâm",
      body: "Quy trình đóng gói và giao nhận được chăm chút để trái cây đến tay người nhận chỉn chu, tươi ngon và đúng thời điểm.",
    },
  ];

  return (
    <section className="px-4 py-12 mx-auto max-w-7xl">
      <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-2xl">
          <div className="mb-4 badge badge-primary">
            Only the finest fruits · est 2017
          </div>
          <h1 className="text-4xl font-black leading-tight sm:text-6xl">
            VinFruits - Quà tặng từ sự tử tế
          </h1>
          <p className="mt-5 text-lg leading-8 text-base-content/70">
            Mang đến sức khỏe cho mọi nhà qua những loại trái cây nhập khẩu
            thượng hạng - tuyển chọn, tinh tế và an tâm.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <a className="btn btn-primary" href={businessInfo.hotlineHref}>
              Gọi {businessInfo.hotline}
            </a>
            <a
              className="btn btn-outline"
              href={localizedPath(language, "products")}
            >
              Xem giỏ quà
            </a>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1400&q=80"
          alt="Giỏ trái cây VinFruits"
          className="w-full shadow-xl kf-banner-image rounded-box"
        />
      </div>

      <div className="grid gap-4 mt-10 md:grid-cols-3">
        {[
          ["2017", "Hành trình bắt đầu"],
          ["48h", "Đổi hoặc hoàn tiền"],
          ["2h", "Giao nhanh nội thành"],
        ].map(([value, label]) => (
          <div className="border stats bg-base-100" key={value}>
            <div className="stat">
              <div className="stat-value">{value}</div>
              <div className="stat-desc">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 mt-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-semibold uppercase tracking-wide text-secondary">
            Về VinFruits
          </p>
          <h2 className="mt-2 text-3xl font-black">
            Trái cây cao cấp cho những món quà chỉn chu
          </h2>
        </div>
        <div className="space-y-5 text-base leading-8 text-base-content/75">
          <p>
            VinFruits chọn trái cây nhập khẩu thượng hạng và chuẩn bị từng giỏ
            quà với tinh thần tử tế. Mỗi sản phẩm không chỉ cần tươi ngon mà còn
            phải phù hợp với người nhận, dịp tặng và cảm xúc mà khách hàng muốn
            gửi gắm.
          </p>
          <p>
            Từ giỏ trái cây thăm bệnh, cảm ơn, sinh nhật, khai trương đến quà
            tặng đối tác, VinFruits chú trọng sự hài hòa giữa chất lượng trái
            cây, cách phối giỏ, đóng gói và trải nghiệm giao nhận.
          </p>
        </div>
      </div>

      <div className="grid gap-4 mt-12 md:grid-cols-3">
        {values.map(({ icon: Icon, title, body }) => (
          <div className="card bg-base-100" key={title}>
            <div className="gap-4 card-body">
              <div className="grid w-12 h-12 rounded-full place-items-center bg-primary/10 text-primary">
                <Icon size={24} />
              </div>
              <h3 className="card-title">{title}</h3>
              <p className="leading-7 text-base-content/70">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 mt-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="font-semibold uppercase tracking-wide text-secondary">
            Câu chuyện
          </p>
          <h2 className="mt-2 text-3xl font-black">
            Từ lựa chọn trái cây đến trải nghiệm nhận quà
          </h2>
        </div>
        <div className="space-y-4">
          {timeline.map((item) => (
            <div className="border card bg-base-100" key={item.title}>
              <div className="grid gap-4 card-body sm:grid-cols-[7rem_1fr]">
                <div className="text-2xl font-black text-secondary">
                  {item.year}
                </div>
                <div>
                  <h3 className="text-xl font-black">{item.title}</h3>
                  <p className="mt-2 leading-7 text-base-content/70">
                    {item.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 card bg-primary text-primary-content">
        <div className="items-start gap-6 card-body md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-black text-primary-content">
              Để VinFruits tư vấn giỏ quà cho bạn
            </h2>
            <p className="mt-3 text-primary-content/80">
              Chọn đúng trái cây, đúng dịp tặng và đúng ngân sách cho người bạn
              trân trọng.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <a className="btn btn-secondary" href={businessInfo.hotlineHref}>
              Gọi {businessInfo.hotline}
            </a>
            <a
              className="btn bg-white text-primary hover:bg-base-200"
              href={localizedPath(language, "products")}
            >
              Xem giỏ quà
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AccountPage({
  onAccountChange,
  onNavigate,
}: {
  onAccountChange?: (account: CustomerAccount | null) => void;
  onNavigate?: (href: string) => void;
}) {
  const [tab, setTab] = useState<"sign-in" | "create" | "reset">("sign-in");
  const [accountSection, setAccountSection] = useState<
    "orders" | "profile" | "addresses" | "admin"
  >("orders");
  const [activeAccount, setActiveAccount] = useState<CustomerAccount | null>(
    null,
  );
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [signInForm, setSignInForm] = useState(emptySignInForm);
  const [resetRequestForm, setResetRequestForm] = useState(
    emptyResetRequestForm,
  );
  const [resetForm, setResetForm] = useState(emptyResetForm);
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [historyMessage, setHistoryMessage] = useState("");
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [accountMessage, setAccountMessage] = useState("");
  const [addressMessage, setAddressMessage] = useState("");
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [nextPath, setNextPath] = useState("");

  const isAdmin = Boolean(activeAccount?.roles.includes("admin"));

  const syncAccountForm = (user: CustomerAccount | null) => {
    setProfileForm(
      user
        ? {
            name: user.name,
            email: user.email,
            phone: user.phone,
          }
        : emptyProfileForm,
    );
  };

  const syncSignedInAccount = async (fallbackUser?: CustomerAccount) => {
    const payload = await kleverRequest<{ ok: true; user: CustomerAccount | null }>(
      "auth",
      "/me",
    ).catch(() => ({ ok: true as const, user: fallbackUser || null }));
    const user = payload.user || fallbackUser || null;

    setActiveAccount(user);
    onAccountChange?.(user);
    syncAccountForm(user);
    loadAddresses(user);
    loadOrderHistory(user);

    return user;
  };

  const resolveNextPath = () => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "";
    return next.startsWith("/") && !next.startsWith("//") ? next : "";
  };

  const continueAfterAuth = (user: CustomerAccount | null) => {
    if (!user || !nextPath) return false;
    onNavigate?.(nextPath);
    return true;
  };

  const loadAddresses = async (user: CustomerAccount | null) => {
    if (!user) {
      setAddresses([]);
      setAddressForm(emptyAddressForm);
      setAddressModalOpen(false);
      return;
    }

    try {
      const payload = await kleverRequest<{
        ok: true;
        addresses: CustomerAddress[];
      }>("auth", "/addresses");
      setAddresses(payload.addresses);
      setAddressMessage("");
    } catch (error) {
      setAddressMessage(
        error instanceof Error ? error.message : "Không thể tải địa chỉ.",
      );
    }
  };

  const loadOrderHistory = async (user: CustomerAccount | null) => {
    if (!user) {
      setOrders([]);
      setCustomers([]);
      setInventory([]);
      return;
    }

    try {
      const history = await kleverRequest<{
        ok: true;
        orders: OrderHistoryItem[];
      }>("orders", "/history");
      setOrders(history.orders);
      setHistoryMessage("");

      if (user.roles.includes("admin")) {
        const [customerPayload, inventoryPayload] = await Promise.all([
          kleverRequest<{ ok: true; customers: CustomerRecord[] }>(
            "admin",
            "/customers",
          ),
          kleverRequest<{ ok: true; inventory: InventoryRecord[] }>(
            "admin",
            "/inventory",
          ),
        ]);
        setCustomers(customerPayload.customers);
        setInventory(inventoryPayload.inventory);
      }
    } catch (error) {
      setHistoryMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải lịch sử đơn hàng.",
      );
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("resetToken");
    if (resetToken) {
      setTab("reset");
      setResetForm((current) => ({ ...current, token: resetToken }));
    }
    const requestedNextPath = resolveNextPath();
    setNextPath(requestedNextPath);

    kleverRequest<{ ok: true; user: CustomerAccount | null }>("auth", "/me")
      .then((payload) => {
        setActiveAccount(payload.user);
        onAccountChange?.(payload.user);
        syncAccountForm(payload.user);
        loadAddresses(payload.user);
        loadOrderHistory(payload.user);
      })
      .catch(() => {
        setActiveAccount(null);
        onAccountChange?.(null);
        syncAccountForm(null);
      });
  }, []);

  const currentPanelTitle = useMemo(() => {
    if (tab === "create") return "Tạo tài khoản";
    if (tab === "reset") return "Đặt lại mật khẩu";
    return "Đăng nhập";
  }, [tab]);

  const createAccount = async () => {
    setBusy(true);
    setMessage("");
    setResetUrl("");

    try {
      const payload = await kleverRequest<{ ok: true; user: CustomerAccount }>(
        "auth",
        "/register",
        {
          method: "POST",
          body: JSON.stringify(createForm),
        },
      );
      const user = await syncSignedInAccount(payload.user);
      setCreateForm(emptyCreateForm);
      setSignInForm(emptySignInForm);
      setTab("sign-in");
      setAccountSection("orders");
      if (!continueAfterAuth(user)) {
        setMessage("Tài khoản đã được tạo. Bạn đã đăng nhập.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đăng ký.");
    } finally {
      setBusy(false);
    }
  };

  const signIn = async () => {
    setBusy(true);
    setMessage("");
    setResetUrl("");

    try {
      const payload = await kleverRequest<{ ok: true; user: CustomerAccount }>(
        "auth",
        "/login",
        {
          method: "POST",
          body: JSON.stringify(signInForm),
        },
      );
      const user = await syncSignedInAccount(payload.user);
      setSignInForm(emptySignInForm);
      setAccountSection("orders");
      if (!continueAfterAuth(user)) {
        setMessage("Đã đăng nhập.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không thể đăng nhập.",
      );
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    setMessage("");
    setResetUrl("");

    try {
      await kleverRequest("auth", "/logout", { method: "POST", body: "{}" });
      setActiveAccount(null);
      onAccountChange?.(null);
      syncAccountForm(null);
      setOrders([]);
      setCustomers([]);
      setInventory([]);
      setAddresses([]);
      setAddressForm(emptyAddressForm);
      setAddressModalOpen(false);
      setPasswordForm(emptyPasswordForm);
      setAccountMessage("");
      setAddressMessage("");
      setAccountSection("orders");
      setMessage("Đã đăng xuất.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không thể đăng xuất.",
      );
    } finally {
      setBusy(false);
    }
  };

  const requestPasswordReset = async () => {
    setBusy(true);
    setMessage("");
    setResetUrl("");

    try {
      const payload = await kleverRequest<{
        ok: true;
        message: string;
        resetUrl?: string;
      }>("auth", "/request-reset", {
        method: "POST",
        body: JSON.stringify(resetRequestForm),
      });
      setMessage(payload.message);
      setResetUrl(payload.resetUrl || "");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể yêu cầu đặt lại mật khẩu.",
      );
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setBusy(true);
    setMessage("");
    setResetUrl("");

    try {
      await kleverRequest("auth", "/reset-password", {
        method: "POST",
        body: JSON.stringify(resetForm),
      });
      setResetForm(emptyResetForm);
      setResetRequestForm(emptyResetRequestForm);
      setTab("sign-in");
      setMessage(
        "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không thể đặt lại mật khẩu.",
      );
    } finally {
      setBusy(false);
    }
  };

  const updateProfile = async () => {
    setBusy(true);
    setAccountMessage("");

    try {
      const payload = await kleverRequest<{ ok: true; user: CustomerAccount }>(
        "auth",
        "/profile",
        {
          method: "PATCH",
          body: JSON.stringify(profileForm),
        },
      );
      setActiveAccount(payload.user);
      syncAccountForm(payload.user);
      setAccountMessage("Thông tin tài khoản đã được cập nhật.");
    } catch (error) {
      setAccountMessage(
        error instanceof Error ? error.message : "Không thể cập nhật hồ sơ.",
      );
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async () => {
    setBusy(true);
    setAccountMessage("");

    try {
      await kleverRequest("auth", "/password", {
        method: "PATCH",
        body: JSON.stringify(passwordForm),
      });
      setPasswordForm(emptyPasswordForm);
      setAccountMessage("Mật khẩu đã được cập nhật.");
    } catch (error) {
      setAccountMessage(
        error instanceof Error ? error.message : "Không thể cập nhật mật khẩu.",
      );
    } finally {
      setBusy(false);
    }
  };

  const saveAddress = async () => {
    setBusy(true);
    setAddressMessage("");

    try {
      const payload = await kleverRequest<{
        ok: true;
        addresses: CustomerAddress[];
      }>("auth", "/addresses", {
        method: "POST",
        body: JSON.stringify(addressForm),
      });
      setAddresses(payload.addresses);
      setAddressForm(emptyAddressForm);
      setAddressModalOpen(false);
      setAddressMessage("Địa chỉ giao hàng đã được lưu.");
    } catch (error) {
      setAddressMessage(
        error instanceof Error ? error.message : "Không thể lưu địa chỉ.",
      );
    } finally {
      setBusy(false);
    }
  };

  const editAddress = (address: CustomerAddress) => {
    setAddressForm({
      id: address.id,
      label: address.label,
      recipient_name: address.recipient_name,
      phone: address.phone,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || "",
      ward: address.ward || "",
      district: address.district || "",
      city: address.city,
      country: address.country,
      is_default: address.is_default,
    });
    setAddressMessage("");
    setAddressModalOpen(true);
  };

  const createAddress = () => {
    setAddressForm(emptyAddressForm);
    setAddressMessage("");
    setAddressModalOpen(true);
  };

  const makeDefaultAddress = async (addressId: string) => {
    setBusy(true);
    setAddressMessage("");

    try {
      const payload = await kleverRequest<{
        ok: true;
        addresses: CustomerAddress[];
      }>("auth", "/addresses", {
        method: "POST",
        body: JSON.stringify({ action: "set-default", id: addressId }),
      });
      setAddresses(payload.addresses);
      setAddressMessage("Địa chỉ giao hàng mặc định đã được cập nhật.");
    } catch (error) {
      setAddressMessage(
        error instanceof Error ? error.message : "Không thể cập nhật địa chỉ.",
      );
    } finally {
      setBusy(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    setBusy(true);
    setAddressMessage("");

    try {
      const payload = await kleverRequest<{
        ok: true;
        addresses: CustomerAddress[];
      }>("auth", "/addresses", {
        method: "DELETE",
        body: JSON.stringify({ id: addressId }),
      });
      setAddresses(payload.addresses);
      if (addressForm.id === addressId) setAddressForm(emptyAddressForm);
      if (addressForm.id === addressId) setAddressModalOpen(false);
      setAddressMessage("Địa chỉ giao hàng đã được xóa.");
    } catch (error) {
      setAddressMessage(
        error instanceof Error ? error.message : "Không thể xóa địa chỉ.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="px-4 py-12 mx-auto max-w-7xl">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="mb-4 badge badge-primary">Tài khoản B2C</div>
          <h1 className="text-4xl font-black uppercase sm:text-6xl">
            {activeAccount
              ? "Bảng điều khiển tài khoản"
              : "Đăng nhập để thanh toán nhanh hơn"}
          </h1>
          <p className="mt-5 text-base-content/70">
            {activeAccount
              ? "Xem thông tin khách hàng, lịch sử đơn hàng và quyền truy cập tài khoản tại một nơi."
              : "Sản phẩm vẫn hiển thị cho mọi khách truy cập. Tài khoản dùng để lưu thông tin khách hàng, địa chỉ giao hàng, lịch sử đơn hàng và các tính năng tích điểm hoặc quà tặng doanh nghiệp trong tương lai."}
          </p>
          <div className="grid gap-3 mt-6 sm:grid-cols-2">
            <div className="alert">
              <UserRound size={20} />
              <span>Duyệt danh mục công khai</span>
            </div>
            <div className="alert">
              <PackageCheck size={20} />
              <span>Lịch sử đơn hàng riêng tư</span>
            </div>
          </div>
        </div>
        <div className=" card bg-base-100">
          <div className="card-body">
            {activeAccount && (
              <div className="alert mb-4">
                <UserRound size={20} />
                <div>
                  <p className="font-semibold">{activeAccount.name}</p>
                  <p className="text-sm">
                    {activeAccount.email} · {activeAccount.phone}
                  </p>
                </div>
                {nextPath && (
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={() => onNavigate?.(nextPath)}
                  >
                    Tiếp tục
                  </button>
                )}
                <button className="btn btn-sm" type="button" onClick={signOut}>
                  Đăng xuất
                </button>
              </div>
            )}

            {!activeAccount && (
              <>
                <div role="tablist" className="tabs tabs-box mb-4">
                  <button
                    type="button"
                    role="tab"
                    className={`tab ${tab === "sign-in" ? "tab-active" : ""}`}
                    onClick={() => {
                      setTab("sign-in");
                      setMessage("");
                    }}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className={`tab ${tab === "create" ? "tab-active" : ""}`}
                    onClick={() => {
                      setTab("create");
                      setMessage("");
                    }}
                  >
                    Tạo tài khoản
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className={`tab ${tab === "reset" ? "tab-active" : ""}`}
                    onClick={() => {
                      setTab("reset");
                      setMessage("");
                      setResetUrl("");
                    }}
                  >
                    Đặt lại mật khẩu
                  </button>
                </div>
                <h2 className="card-title mb-4">{currentPanelTitle}</h2>

                {tab === "sign-in" ? (
                  <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      signIn();
                    }}
                  >
                    <input
                      className="input input-bordered"
                      placeholder="Email hoặc số điện thoại"
                      value={signInForm.login}
                      onChange={(event) =>
                        setSignInForm((current) => ({
                          ...current,
                          login: event.target.value,
                        }))
                      }
                    />
                    <input
                      className="input input-bordered"
                      placeholder="Mật khẩu"
                      type="password"
                      value={signInForm.password}
                      onChange={(event) =>
                        setSignInForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                    />
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={busy}
                    >
                      Đăng nhập
                    </button>
                  </form>
                ) : tab === "create" ? (
                  <form
                    className="grid gap-4 sm:grid-cols-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      createAccount();
                    }}
                  >
                    <input
                      className="input input-bordered"
                      placeholder="Họ tên"
                      value={createForm.name}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                    <input
                      className="input input-bordered"
                      placeholder="Số điện thoại"
                      value={createForm.phone}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                    <input
                      className="input input-bordered sm:col-span-2"
                      placeholder="Email"
                      value={createForm.email}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                    />
                    <input
                      className="input input-bordered sm:col-span-2"
                      placeholder="Mật khẩu"
                      type="password"
                      value={createForm.password}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                    />
                    <button
                      className="btn btn-primary sm:col-span-2"
                      type="submit"
                      disabled={busy}
                    >
                      Tạo tài khoản
                    </button>
                  </form>
                ) : (
                  <div className="grid gap-4">
                    <form
                      className="grid gap-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        requestPasswordReset();
                      }}
                    >
                      <input
                        className="input input-bordered"
                        placeholder="Email tài khoản"
                        value={resetRequestForm.email}
                        onChange={(event) =>
                          setResetRequestForm({ email: event.target.value })
                        }
                      />
                      <button
                        className="btn btn-outline"
                        type="submit"
                        disabled={busy}
                      >
                        Gửi liên kết đặt lại
                      </button>
                    </form>

                    {resetUrl && (
                      <div className="alert">
                        <span className="break-all">{resetUrl}</span>
                      </div>
                    )}

                    <form
                      className="grid gap-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        resetPassword();
                      }}
                    >
                      <input
                        className="input input-bordered"
                        placeholder="Mã đặt lại"
                        value={resetForm.token}
                        onChange={(event) =>
                          setResetForm((current) => ({
                            ...current,
                            token: event.target.value,
                          }))
                        }
                      />
                      <input
                        className="input input-bordered"
                        placeholder="Mật khẩu mới"
                        type="password"
                        value={resetForm.password}
                        onChange={(event) =>
                          setResetForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                      />
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={busy}
                      >
                        Cập nhật mật khẩu
                      </button>
                    </form>
                  </div>
                )}

                {message && <div className="alert mt-4">{message}</div>}

                <p className="text-sm text-base-content/60">
                  Tài khoản được lưu trong bảng khách hàng của gian hàng này.
                  Liên kết đặt lại mật khẩu tạm thời hiển thị tại đây cho đến
                  khi hệ thống gửi email được kết nối cho khách hàng.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {activeAccount && (
        <div className="grid gap-6 mt-8">
          <div className="card bg-base-100">
            <div className="card-body">
              <div role="tablist" className="tabs tabs-box">
                {[
                  ["orders", "Lịch sử đơn hàng", orders.length],
                  ["profile", "Thông tin tài khoản", null],
                  ["addresses", "Địa chỉ giao hàng", addresses.length],
                  ...(isAdmin ? [["admin", "Tổng quan quản trị", null]] : []),
                ].map(([section, label, count]) => (
                  <button
                    className={`tab ${
                      accountSection === section ? "tab-active" : ""
                    }`}
                    key={section as string}
                    role="tab"
                    type="button"
                    onClick={() =>
                      setAccountSection(section as typeof accountSection)
                    }
                  >
                    {label}
                    {typeof count === "number" && (
                      <span className="ml-2 badge badge-sm">{count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {accountSection === "profile" && (
            <div className=" card bg-base-100">
              <div className="card-body">
                <h2 className="card-title">Thông tin tài khoản</h2>
                <form
                  className="grid gap-5 sm:grid-cols-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    updateProfile();
                  }}
                >
                  <label className="flex flex-col gap-2">
                    <span className="label-text">Họ tên</span>
                    <input
                      className="input input-bordered"
                      value={profileForm.name}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="label-text">Số điện thoại</span>
                    <input
                      className="input input-bordered"
                      value={profileForm.phone}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2 sm:col-span-2">
                    <span className="label-text">Email</span>
                    <input
                      className="input input-bordered"
                      value={profileForm.email}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button
                    className="btn btn-primary sm:col-span-2"
                    type="submit"
                    disabled={busy}
                  >
                    Lưu thông tin tài khoản
                  </button>
                </form>

                <div className="divider" />

                <form
                  className="grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    updatePassword();
                  }}
                >
                  <h3 className="font-semibold">Mật khẩu</h3>
                  <input
                    className="input input-bordered"
                    placeholder="Mật khẩu hiện tại"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        currentPassword: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="input input-bordered"
                    placeholder="Mật khẩu mới"
                    type="password"
                    value={passwordForm.password}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                  />
                  <button
                    className="btn btn-outline"
                    type="submit"
                    disabled={busy}
                  >
                    Cập nhật mật khẩu
                  </button>
                </form>
                {accountMessage && (
                  <div className="alert mt-4">{accountMessage}</div>
                )}
              </div>
            </div>
          )}

          {accountSection === "addresses" && (
            <div className=" card bg-base-100">
              <div className="card-body">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="card-title">Địa chỉ giao hàng</h2>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={createAddress}
                  >
                    Thêm địa chỉ
                  </button>
                </div>

                {addressMessage && (
                  <div className="alert mt-4">{addressMessage}</div>
                )}

                <div className="grid gap-3 mt-4">
                  {addresses.length ? (
                    addresses.map((address) => (
                      <div className="border rounded-box p-4" key={address.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex gap-3">
                            <MapPin size={20} />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold">{address.label}</p>
                                {address.is_default && (
                                  <span className="badge badge-primary">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-sm">
                                {address.recipient_name} · {address.phone}
                              </p>
                              <p className="text-sm text-base-content/70">
                                {[
                                  address.address_line_1,
                                  address.address_line_2,
                                  address.ward,
                                  address.district,
                                  address.city,
                                  address.country,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {!address.is_default && (
                              <button
                                className="btn btn-xs btn-outline"
                                type="button"
                                onClick={() => makeDefaultAddress(address.id)}
                              >
                                Đặt làm mặc định
                              </button>
                            )}
                            <button
                              className="btn btn-xs"
                              type="button"
                              onClick={() => editAddress(address)}
                            >
                              Sửa
                            </button>
                            <button
                              className="btn btn-xs btn-ghost"
                              type="button"
                              onClick={() => deleteAddress(address.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="alert">
                      Chưa có địa chỉ giao hàng nào được lưu.
                    </div>
                  )}
                </div>

                <div
                  className={`modal ${addressModalOpen ? "modal-open" : ""}`}
                >
                  <div className="modal-box max-w-4xl">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold">
                        {addressForm.id
                          ? "Sửa địa chỉ giao hàng"
                          : "Thêm địa chỉ giao hàng"}
                      </h3>
                      <button
                        className="btn btn-sm btn-ghost"
                        type="button"
                        onClick={() => {
                          setAddressModalOpen(false);
                          setAddressForm(emptyAddressForm);
                        }}
                      >
                        Đóng
                      </button>
                    </div>
                    <form
                      className="grid gap-5 mt-5 md:grid-cols-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveAddress();
                      }}
                    >
                      <label className="flex flex-col gap-2">
                        <span className="label-text">Nhãn</span>
                        <input
                          className="input input-bordered"
                          value={addressForm.label}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              label: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="label-text">Người nhận</span>
                        <input
                          className="input input-bordered"
                          value={addressForm.recipient_name}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              recipient_name: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="label-text">Số điện thoại</span>
                        <input
                          className="input input-bordered"
                          value={addressForm.phone}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              phone: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="label-text">Thành phố</span>
                        <input
                          className="input input-bordered"
                          value={addressForm.city}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              city: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2 md:col-span-2">
                        <span className="label-text">Địa chỉ</span>
                        <input
                          className="input input-bordered"
                          value={addressForm.address_line_1}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              address_line_1: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2 md:col-span-2">
                        <span className="label-text">
                          Căn hộ, phòng, ghi chú
                        </span>
                        <input
                          className="input input-bordered"
                          value={addressForm.address_line_2}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              address_line_2: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="label-text">Phường/Xã</span>
                        <input
                          className="input input-bordered"
                          value={addressForm.ward}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              ward: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="label-text">Quận/Huyện</span>
                        <input
                          className="input input-bordered"
                          value={addressForm.district}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              district: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="label-text">Quốc gia</span>
                        <input
                          className="input input-bordered"
                          value={addressForm.country}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              country: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="label cursor-pointer justify-start gap-3">
                        <input
                          className="checkbox checkbox-primary"
                          type="checkbox"
                          checked={addressForm.is_default}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              is_default: event.target.checked,
                            }))
                          }
                        />
                        <span className="label-text">Địa chỉ mặc định</span>
                      </label>
                      {addressMessage && addressModalOpen && (
                        <div className="alert md:col-span-2">
                          {addressMessage}
                        </div>
                      )}
                      <div className="flex flex-wrap justify-end gap-3 md:col-span-2">
                        <button
                          className="btn btn-outline"
                          type="button"
                          onClick={() => {
                            setAddressModalOpen(false);
                            setAddressForm(emptyAddressForm);
                          }}
                        >
                          Hủy
                        </button>
                        <button
                          className="btn btn-primary"
                          type="submit"
                          disabled={busy}
                        >
                          {addressForm.id ? "Lưu địa chỉ" : "Thêm địa chỉ"}
                        </button>
                      </div>
                    </form>
                  </div>
                  <button
                    className="modal-backdrop"
                    type="button"
                    onClick={() => {
                      setAddressModalOpen(false);
                      setAddressForm(emptyAddressForm);
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {accountSection === "orders" && (
            <div className=" card bg-base-100">
              <div className="card-body">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="card-title">
                    {isAdmin
                      ? "Tất cả lịch sử đơn hàng"
                      : "Lịch sử đơn hàng của bạn"}
                  </h2>
                  <button
                    className="btn btn-sm btn-outline"
                    type="button"
                    onClick={() => loadOrderHistory(activeAccount)}
                  >
                    Làm mới
                  </button>
                </div>
                {historyMessage && (
                  <div className="alert">{historyMessage}</div>
                )}
                {orders.length ? (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Đơn hàng</th>
                          <th>Khách hàng</th>
                          <th>Trạng thái</th>
                          <th>Sản phẩm</th>
                          <th>Tổng cộng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <div className="font-semibold">
                                {order.order_number}
                              </div>
                              <div className="text-xs text-base-content/60">
                                {new Date(order.created_at).toLocaleString()}
                              </div>
                            </td>
                            <td>
                              <div>{order.customer_name}</div>
                              <div className="text-xs text-base-content/60">
                                {order.customer_email || order.customer_phone}
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-outline">
                                {order.status}
                              </span>
                              <span className="badge badge-ghost ml-2">
                                {order.payment_status}
                              </span>
                            </td>
                            <td>
                              {order.items.map((item) => (
                                <div className="text-sm" key={item.name}>
                                  {item.name} x {item.quantity}
                                </div>
                              ))}
                            </td>
                            <td className="font-semibold">
                              {formatVnd(order.total_vnd)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert">Chưa có đơn hàng nào.</div>
                )}
              </div>
            </div>
          )}

          {isAdmin && accountSection === "admin" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <div className=" card bg-base-100">
                <div className="card-body">
                  <h2 className="card-title">Hồ sơ khách hàng</h2>
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Họ tên</th>
                          <th>Liên hệ</th>
                          <th>Vai trò</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id}>
                            <td>{customer.full_name}</td>
                            <td>
                              <div>{customer.email}</div>
                              <div className="text-xs text-base-content/60">
                                {customer.phone}
                              </div>
                            </td>
                            <td>{customer.roles.join(", ") || "khách hàng"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className=" card bg-base-100">
                <div className="card-body">
                  <h2 className="card-title">Tồn kho</h2>
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th>Tồn kho</th>
                          <th>Hiển thị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((item) => (
                          <tr key={item.slug}>
                            <td>
                              <div>{item.name}</div>
                              <div className="text-xs text-base-content/60">
                                {item.slug}
                              </div>
                            </td>
                            <td>
                              {item.inventory_quantity === null
                                ? "Không giới hạn"
                                : item.inventory_quantity}
                            </td>
                            <td>{item.visible ? "Có" : "Không"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function ContactPage({ language }: { language: Language }) {
  const hours =
    language === "vi"
      ? businessInfo.businessHours
      : businessInfo.businessHoursEnglish;

  return (
    <section className="px-4 py-12 mx-auto max-w-7xl">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <div className="mb-4 badge badge-primary">
            {language === "vi" ? "Liên hệ" : "Contact"}
          </div>
          <h1 className="text-4xl font-black uppercase sm:text-6xl">
            {businessInfo.displayName}
          </h1>
          <div className="mt-6 space-y-4">
            <div className="flex gap-3">
              <MapPin size={22} />
              <p>{businessInfo.address}</p>
            </div>
            <div className="flex gap-3">
              <Truck size={22} />
              <p>{hours}</p>
            </div>
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <a className="btn btn-outline" href={businessInfo.hotlineHref}>
                Hotline: {businessInfo.hotline}
              </a>
              <a className="btn btn-outline" href={businessInfo.emailHref}>
                {businessInfo.email}
              </a>
              <a
                className="btn btn-outline"
                href={businessInfo.zaloUrl}
                target="_blank"
                rel="noreferrer"
              >
                Zalo OA
              </a>
              <a
                className="btn btn-outline"
                href={businessInfo.facebookUrl}
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
        <form className=" card bg-base-100">
          <div className="card-body">
            <h2 className="card-title">
              {language === "vi" ? "Gửi tin nhắn" : "Send a message"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="input input-bordered"
                placeholder={language === "vi" ? "Họ tên" : "Name"}
              />
              <input
                className="input input-bordered"
                placeholder={language === "vi" ? "Số điện thoại" : "Phone"}
              />
              <input
                className="input input-bordered sm:col-span-2"
                placeholder="Email"
              />
              <textarea
                className="textarea textarea-bordered sm:col-span-2"
                rows={5}
                placeholder={
                  language === "vi"
                    ? "Chúng tôi có thể hỗ trợ gì?"
                    : "How can we help?"
                }
              />
            </div>
            <div className="justify-end card-actions">
              <button className="btn btn-primary" type="button">
                {language === "vi" ? "Gửi" : "Send"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
