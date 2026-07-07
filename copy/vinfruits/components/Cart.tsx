import { Minus, Plus, Trash2 } from "lucide-react";
import { formatVnd } from "@vinfuit/fruitData";
import {
  cartStockLabel,
  cartStockQuantity,
  localizedPath,
} from "@vinfuit/lib/cart";
import { text, type Language } from "@vinfuit/lib/i18n";
import { type CartItem } from "@vinfuit/lib/types";

export function CartDrawer({
  cart,
  open,
  subtotal,
  delivery,
  discount = 0,
  voucherCode,
  total,
  language = "vi",
  onClose,
  onNavigate,
  onRemove,
  onUpdateQuantity,
}: {
  cart: CartItem[];
  open: boolean;
  subtotal: number;
  delivery: number;
  discount?: number;
  voucherCode?: string;
  total: number;
  language?: Language;
  onClose: () => void;
  onNavigate: (href: string) => void;
  onRemove: (slug: string) => void;
  onUpdateQuantity: (slug: string, direction: 1 | -1) => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "visible" : "pointer-events-none invisible"}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-neutral/50 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close cart"
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-base-100 p-4 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal={open}
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{text(language, "cart")}</h2>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={onClose}
          >
            {text(language, "close")}
          </button>
        </div>
        {cart.length === 0 ? (
          <div className="alert">{text(language, "emptyCart")}</div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => {
              const stock = cartStockQuantity(item);
              return (
                <div className="flex gap-3" key={item.slug}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="object-cover w-20 h-20 rounded-box"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-base-content/60">
                      {formatVnd(item.price)}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {cartStockLabel(item)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="join">
                        <button
                          className="btn btn-xs join-item"
                          onClick={() => onUpdateQuantity(item.slug, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="btn btn-xs join-item">
                          {item.quantity}
                        </span>
                        <button
                          className="btn btn-xs join-item"
                          onClick={() => onUpdateQuantity(item.slug, 1)}
                          disabled={
                            stock !== null && item.quantity >= Number(stock)
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => onRemove(item.slug)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <OrderTotals
              subtotal={subtotal}
              delivery={delivery}
              discount={discount}
              voucherCode={voucherCode}
              total={total}
              language={language}
            />
            <button
              className="w-full btn btn-primary"
              type="button"
              onClick={() => onNavigate(localizedPath(language, "checkout"))}
            >
              {text(language, "checkout")}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

export function OrderSummary({
  cart,
  subtotal,
  delivery,
  discount = 0,
  voucherCode,
  total,
  voucher,
  language = "vi",
  action,
}: {
  cart: CartItem[];
  subtotal: number;
  delivery: number;
  discount?: number;
  voucherCode?: string;
  total: number;
  voucher?: React.ReactNode;
  language?: Language;
  action: React.ReactNode;
}) {
  return (
    <aside className=" card bg-base-100">
      <div className="card-body">
        <h2 className="card-title">{text(language, "orderSummary")}</h2>
        <div className="space-y-3">
          {cart.map((item) => (
            <div className="flex justify-between gap-3 text-sm" key={item.slug}>
              <span>
                {item.name} x {item.quantity}
              </span>
              <strong>{formatVnd(item.price * item.quantity)}</strong>
            </div>
          ))}
        </div>
        <div className="divider" />
        {voucher}
        <OrderTotals
          subtotal={subtotal}
          delivery={delivery}
          discount={discount}
          voucherCode={voucherCode}
          total={total}
          language={language}
        />
        {action}
      </div>
    </aside>
  );
}

function OrderTotals({
  subtotal,
  delivery,
  discount = 0,
  voucherCode,
  total,
  language,
}: {
  subtotal: number;
  delivery: number;
  discount?: number;
  voucherCode?: string;
  total: number;
  language: Language;
}) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>{text(language, "subtotal")}</span>
        <strong>{formatVnd(subtotal)}</strong>
      </div>
      <div className="flex justify-between">
        <span>{text(language, "delivery")}</span>
        <strong>
          {delivery ? formatVnd(delivery) : text(language, "free")}
        </strong>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-success">
          <span>
            {text(language, "discountCode")}
            {voucherCode ? ` (${voucherCode})` : ""}
          </span>
          <strong>-{formatVnd(discount)}</strong>
        </div>
      )}
      <div className="flex justify-between text-lg">
        <span>{text(language, "total")}</span>
        <strong>{formatVnd(total)}</strong>
      </div>
    </div>
  );
}
