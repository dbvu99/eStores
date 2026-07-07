import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, MapPin, Ticket, X } from "lucide-react";
import { localizedPath } from "@vinfuit/lib/cart";
import { type CartItem, type CheckoutForm } from "@vinfuit/lib/types";
import { OrderSummary } from "@vinfuit/components/Cart";
import { kleverRequest } from "@vinfuit/lib/api";
import { text, type Language } from "@vinfuit/lib/i18n";

type CustomerAccount = {
  id: string;
  name: string;
  phone: string;
  email: string;
  roles: string[];
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

const emptyAddressForm = {
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

function formatAddress(address: CustomerAddress | typeof emptyAddressForm) {
  return [
    address.address_line_1,
    address.address_line_2,
    address.ward,
    address.district,
    address.city,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export function CheckoutPage({
  cart,
  form,
  subtotal,
  delivery,
  discount,
  voucherCode,
  total,
  message,
  busy,
  language,
  variant = "standard",
  onChange,
  onSubmit,
  onApplyVoucher,
  onRemoveVoucher,
  onNavigate,
}: {
  cart: CartItem[];
  form: CheckoutForm;
  subtotal: number;
  delivery: number;
  discount: number;
  voucherCode: string;
  total: number;
  message: string;
  busy: boolean;
  language: Language;
  variant?: "standard" | "payosStaging";
  onChange: (field: keyof CheckoutForm, value: string) => void;
  onSubmit: (checkoutOverride?: CheckoutForm) => void | Promise<void>;
  onApplyVoucher: (
    code: string,
  ) => Promise<{ valid: boolean; message: string }>;
  onRemoveVoucher: () => void;
  onNavigate: (href: string) => void;
}) {
  const [account, setAccount] = useState<CustomerAccount | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [newAddress, setNewAddress] = useState(emptyAddressForm);
  const [saveAddressMessage, setSaveAddressMessage] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [showAddressChoices, setShowAddressChoices] = useState(false);
  const [creatingNewAddress, setCreatingNewAddress] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const selectedAddress = useMemo(
    () => addresses.find((address) => formatAddress(address) === form.address),
    [addresses, form.address],
  );
  const hasSavedAddresses = Boolean(account && addresses.length > 0);
  const visibleAddresses = hasSavedAddresses
    ? showAddressChoices
      ? addresses
      : selectedAddress
        ? [selectedAddress]
        : addresses.slice(0, 1)
    : [];
  const showNewAddressForm =
    !account || addresses.length === 0 || creatingNewAddress;
  const payOSReturn = useMemo(() => {
    if (variant !== "payosStaging" || typeof window === "undefined") {
      return null;
    }
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const orderCode = params.get("orderCode");
    const cancelled = params.get("cancel") === "true";
    if (!status && !orderCode && !cancelled) return null;
    return { cancelled, orderCode, status };
  }, [variant]);

  useEffect(() => {
    kleverRequest<{ ok: true; user: CustomerAccount | null }>("auth", "/me")
      .then((payload) => {
        setAccount(payload.user);
        if (payload.user) {
          onChange("name", form.name || payload.user.name);
          onChange("phone", form.phone || payload.user.phone);
          onChange("email", form.email || payload.user.email);
          return kleverRequest<{ ok: true; addresses: CustomerAddress[] }>(
            "auth",
            "/addresses",
          );
        }
        return null;
      })
      .then((payload) => {
        if (!payload) return;
        setAddresses(payload.addresses);
        const defaultAddress =
          payload.addresses.find((address) => address.is_default) ||
          payload.addresses[0];
        if (defaultAddress && !form.address) {
          onChange("name", form.name || defaultAddress.recipient_name);
          onChange("phone", form.phone || defaultAddress.phone);
          onChange("address", formatAddress(defaultAddress));
        }
      })
      .catch(() => setAccount(null));
  }, []);

  const selectAddress = (address: CustomerAddress) => {
    setSaveAddressMessage("");
    setCreatingNewAddress(false);
    setShowAddressChoices(false);
    onChange("name", address.recipient_name);
    onChange("phone", address.phone);
    if (account?.email) onChange("email", account.email);
    onChange("address", formatAddress(address));
  };

  const updateNewAddress = (
    field: keyof typeof emptyAddressForm,
    value: string | boolean,
  ) => {
    setNewAddress((current) => ({ ...current, [field]: value }));
  };

  const buildCheckoutFromNewAddress = (): CheckoutForm => ({
    ...form,
    name: newAddress.recipient_name || form.name,
    phone: newAddress.phone || form.phone,
    address: formatAddress(newAddress),
  });

  const saveNewAddress = async (): Promise<CustomerAddress | null> => {
    setSavingAddress(true);
    setSaveAddressMessage("");

    try {
      const checkoutForm = buildCheckoutFromNewAddress();
      const payload = await kleverRequest<{
        ok: true;
        addresses: CustomerAddress[];
      }>("auth", "/addresses", {
        method: "POST",
        body: JSON.stringify({
          ...newAddress,
          recipient_name: checkoutForm.name,
          phone: checkoutForm.phone,
          is_default: true,
        }),
      });
      setAddresses(payload.addresses);
      const savedAddress =
        payload.addresses.find(
          (address) => formatAddress(address) === formatAddress(newAddress),
        ) || payload.addresses[0];
      if (savedAddress) selectAddress(savedAddress);
      setNewAddress(emptyAddressForm);
      setSaveAddressMessage("Delivery address saved.");
      return savedAddress || null;
    } catch (error) {
      setSaveAddressMessage(
        error instanceof Error ? error.message : "Unable to save address.",
      );
      return null;
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!showNewAddressForm) {
      await onSubmit();
      return;
    }

    const checkoutForm = buildCheckoutFromNewAddress();

    if (account) {
      const savedAddress = await saveNewAddress();
      if (!savedAddress) return;
      await onSubmit({
        ...checkoutForm,
        address: formatAddress(savedAddress),
      });
      return;
    }

    await onSubmit(checkoutForm);
  };

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) {
      setVoucherMessage("Vui lòng nhập mã giảm giá.");
      return;
    }
    setApplyingVoucher(true);
    const result = await onApplyVoucher(voucherInput);
    setVoucherMessage(result.message);
    if (result.valid) setVoucherInput("");
    setApplyingVoucher(false);
  };

  return (
    <section className="px-4 py-8 mx-auto max-w-7xl">
      <button
        className="mb-4 btn btn-ghost"
        onClick={() => onNavigate(localizedPath(language, "products"))}
      >
        <ChevronLeft size={18} />
        {text(language, "continueShopping")}
      </button>
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className=" card bg-base-100">
          <div className="card-body">
            <h1 className="text-3xl card-title">
              {variant === "payosStaging"
                ? language === "vi"
                  ? "Thanh toán payOS staging"
                  : "payOS staging checkout"
                : text(language, "checkout")}
            </h1>
            {variant === "payosStaging" && (
              <div className="mt-4 alert alert-warning">
                {language === "vi"
                  ? "payOS không có sandbox riêng. Trang staging này sẽ tạo link trên API production, hãy thử với giá trị nhỏ."
                  : "payOS does not provide a separate sandbox. This staging page creates a production API link, so test with a small amount."}
              </div>
            )}
            {payOSReturn && (
              <div
                className={`mt-4 alert ${
                  payOSReturn.cancelled
                    ? "alert-error"
                    : payOSReturn.status === "PAID"
                      ? "alert-success"
                      : "alert-info"
                }`}
              >
                {payOSReturn.cancelled
                  ? language === "vi"
                    ? "Thanh toán payOS đã bị hủy."
                    : "The payOS payment was cancelled."
                  : language === "vi"
                    ? `payOS trả về trạng thái ${payOSReturn.status || "đang xử lý"} cho đơn ${payOSReturn.orderCode || ""}.`
                    : `payOS returned ${payOSReturn.status || "processing"} for order ${payOSReturn.orderCode || ""}.`}
              </div>
            )}

            <h2 className="mt-4 text-xl font-semibold">
              {language === "vi" ? "Thông tin liên hệ" : "Contact information"}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <input
                className="input input-bordered"
                placeholder="Name"
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
              />
              <input
                className="input input-bordered"
                placeholder="Phone"
                value={form.phone}
                onChange={(event) => onChange("phone", event.target.value)}
              />
              <input
                className="input input-bordered sm:col-span-2"
                placeholder="Email"
                value={form.email}
                onChange={(event) => onChange("email", event.target.value)}
              />
            </div>

            <div className="grid gap-4 mt-8">
              {hasSavedAddresses && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">Delivery address</h2>
                  <button
                    className="btn btn-sm btn-outline"
                    type="button"
                    onClick={() => setShowAddressChoices((current) => !current)}
                  >
                    {showAddressChoices
                      ? language === "vi"
                        ? "Xong"
                        : "Done"
                      : language === "vi"
                        ? "Đổi địa chỉ"
                        : "Change address"}
                  </button>
                </div>
              )}
              {hasSavedAddresses && (
                <div className="grid gap-3 md:grid-cols-2">
                  {visibleAddresses.map((address) => (
                    <button
                      className={`border rounded-box p-4 text-left ${
                        selectedAddress?.id === address.id
                          ? "border-primary bg-primary/10"
                          : "border-base-300"
                      }`}
                      key={address.id}
                      type="button"
                      onClick={() => selectAddress(address)}
                    >
                      <div className="flex gap-3">
                        <MapPin size={20} />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{address.label}</p>
                            {address.is_default && (
                              <span className="badge badge-primary">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm">
                            {address.recipient_name} · {address.phone}
                          </p>
                          <p className="text-sm text-base-content/70">
                            {formatAddress(address)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {hasSavedAddresses && showAddressChoices && (
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => {
                    setCreatingNewAddress(true);
                    setSaveAddressMessage("");
                  }}
                >
                  {language === "vi" ? "Dùng địa chỉ mới" : "Use a new address"}
                </button>
              )}
            </div>

            {showNewAddressForm && (
              <div className="grid gap-4 p-4 mt-6 border rounded-box border-base-300">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">
                    {hasSavedAddresses
                      ? "New delivery address"
                      : "Shipping address"}
                  </h2>
                  {hasSavedAddresses && (
                    <button
                      className="btn btn-sm btn-ghost"
                      type="button"
                      onClick={() => {
                        setCreatingNewAddress(false);
                        setSaveAddressMessage("");
                      }}
                    >
                      {language === "vi" ? "Hủy" : "Cancel"}
                    </button>
                  )}
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  {account && (
                    <label className="flex flex-col gap-2">
                      <span className="label-text">Label</span>
                      <input
                        className="input input-bordered"
                        value={newAddress.label}
                        onChange={(event) =>
                          updateNewAddress("label", event.target.value)
                        }
                      />
                    </label>
                  )}
                  <label className="flex flex-col gap-2">
                    <span className="label-text">Recipient</span>
                    <input
                      className="input input-bordered"
                      value={newAddress.recipient_name}
                      onChange={(event) =>
                        updateNewAddress("recipient_name", event.target.value)
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="label-text">Phone</span>
                    <input
                      className="input input-bordered"
                      value={newAddress.phone}
                      onChange={(event) =>
                        updateNewAddress("phone", event.target.value)
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="label-text">City</span>
                    <input
                      className="input input-bordered"
                      value={newAddress.city}
                      onChange={(event) =>
                        updateNewAddress("city", event.target.value)
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="label-text">Address</span>
                    <input
                      className="input input-bordered"
                      value={newAddress.address_line_1}
                      onChange={(event) =>
                        updateNewAddress("address_line_1", event.target.value)
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="label-text">Apartment, suite, notes</span>
                    <input
                      className="input input-bordered"
                      value={newAddress.address_line_2}
                      onChange={(event) =>
                        updateNewAddress("address_line_2", event.target.value)
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="label-text">Ward</span>
                    <input
                      className="input input-bordered"
                      value={newAddress.ward}
                      onChange={(event) =>
                        updateNewAddress("ward", event.target.value)
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="label-text">District</span>
                    <input
                      className="input input-bordered"
                      value={newAddress.district}
                      onChange={(event) =>
                        updateNewAddress("district", event.target.value)
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="label-text">Country</span>
                    <input
                      className="input input-bordered"
                      value={newAddress.country}
                      onChange={(event) =>
                        updateNewAddress("country", event.target.value)
                      }
                    />
                  </label>
                </div>
                {saveAddressMessage && (
                  <div className="alert">{saveAddressMessage}</div>
                )}
              </div>
            )}

            <div className="grid gap-4 mt-8">
              <h2 className="text-xl font-semibold">
                {language === "vi" ? "Ghi chú đơn hàng" : "Order notes"}
              </h2>
              <textarea
                className="textarea textarea-bordered"
                rows={5}
                placeholder="Gift note or delivery notes"
                value={form.notes}
                onChange={(event) => onChange("notes", event.target.value)}
              />
            </div>
            {message && <div className="mt-4 alert">{message}</div>}
          </div>
        </div>
        <OrderSummary
          cart={cart}
          subtotal={subtotal}
          delivery={delivery}
          discount={discount}
          voucherCode={voucherCode}
          total={total}
          language={language}
          voucher={
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="voucher-code">
                {text(language, "voucher")}
              </label>
              {voucherCode ? (
                <div className="flex items-center justify-between gap-3 p-3 border border-success rounded-box bg-success/10">
                  <span className="flex items-center gap-2 font-semibold">
                    <Ticket size={18} /> {voucherCode}
                  </span>
                  <button
                    className="btn btn-ghost btn-xs"
                    type="button"
                    aria-label={
                      language === "vi" ? "Xóa mã giảm giá" : "Remove voucher"
                    }
                    onClick={() => {
                      onRemoveVoucher();
                      setVoucherMessage("");
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="voucher-code"
                    className="flex-1 min-w-0 input input-bordered"
                    placeholder={language === "vi" ? "Nhập mã" : "Enter code"}
                    value={voucherInput}
                    onChange={(event) => setVoucherInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleApplyVoucher();
                      }
                    }}
                  />
                  <button
                    className="btn btn-outline"
                    type="button"
                    disabled={applyingVoucher}
                    onClick={handleApplyVoucher}
                  >
                    {applyingVoucher ? "..." : text(language, "apply")}
                  </button>
                </div>
              )}
              {voucherMessage && (
                <p
                  className={`text-xs ${voucherCode ? "text-success" : "text-error"}`}
                >
                  {voucherMessage}
                </p>
              )}
            </div>
          }
          action={
            <button
              className="w-full btn btn-primary"
              onClick={handlePlaceOrder}
              disabled={busy || savingAddress || applyingVoucher}
            >
              {busy || savingAddress
                ? language === "vi"
                  ? variant === "payosStaging"
                    ? "Đang tạo link payOS..."
                    : "Đang đặt hàng..."
                  : variant === "payosStaging"
                    ? "Creating payOS link..."
                    : "Placing order..."
                : language === "vi"
                  ? variant === "payosStaging"
                    ? "Thanh toán với payOS"
                    : "Đặt hàng"
                  : variant === "payosStaging"
                    ? "Pay with payOS"
                    : "Place order"}
            </button>
          }
        />
      </div>
    </section>
  );
}

export function CheckoutCompletePage({
  orderNumber,
  onNavigate,
  language,
}: {
  orderNumber: string | null;
  onNavigate: (href: string) => void;
  language: Language;
}) {
  return (
    <section className="px-4 py-8 mx-auto max-w-4xl">
      <button
        className="mb-4 btn btn-ghost"
        onClick={() => onNavigate(localizedPath(language, "products"))}
      >
        <ChevronLeft size={18} />
        {text(language, "continueShopping")}
      </button>
      <div className="card bg-base-100">
        <div className="items-start gap-5 card-body">
          <h1 className="text-3xl card-title">
            {language === "vi" ? "Thanh toán hoàn tất" : "Checkout complete"}
          </h1>
          <div className="w-full alert alert-success">
            <span>
              {language === "vi"
                ? `Đơn hàng ${orderNumber || "đã nhận"} đang chờ cửa hàng xác nhận.`
                : `Order ${orderNumber || "received"} is ready for store confirmation.`}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="btn btn-primary"
              onClick={() => onNavigate(localizedPath(language, "products"))}
            >
              {text(language, "continueShopping")}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => onNavigate(localizedPath(language, "account"))}
            >
              {language === "vi" ? "Xem tài khoản" : "View account"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
