export type VoucherResult = {
  valid: boolean;
  code: string;
  discount: number;
  message: string;
};

type VoucherDefinition = {
  minimumSubtotal: number;
  discount: (subtotal: number, delivery: number) => number;
  successMessage: string;
};

const voucherDefinitions: Record<string, VoucherDefinition> = {
  "FREESHIP-04": {
    minimumSubtotal: 499000,
    discount: (_subtotal, delivery) => delivery,
    successMessage: "Miễn phí giao hàng",
  },
  KM100K: {
    minimumSubtotal: 1999000,
    discount: () => 100000,
    successMessage: "Giảm 100.000 ₫",
  },
  KM40K: {
    minimumSubtotal: 899000,
    discount: () => 40000,
    successMessage: "Giảm 40.000 ₫",
  },
};

export function normalizeVoucherCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function evaluateVoucher(
  rawCode: unknown,
  subtotalValue: number,
  deliveryValue: number,
): VoucherResult {
  const code = normalizeVoucherCode(rawCode);
  const subtotal = Math.max(0, Math.round(Number(subtotalValue) || 0));
  const delivery = Math.max(0, Math.round(Number(deliveryValue) || 0));
  const voucher = voucherDefinitions[code];

  if (!code || !voucher) {
    return {
      valid: false,
      code,
      discount: 0,
      message: "Mã giảm giá không hợp lệ.",
    };
  }

  if (subtotal < voucher.minimumSubtotal) {
    return {
      valid: false,
      code,
      discount: 0,
      message: `Đơn hàng phải đạt tối thiểu ${new Intl.NumberFormat("vi-VN").format(voucher.minimumSubtotal)} ₫ để dùng mã này.`,
    };
  }

  const discount = Math.min(
    subtotal + delivery,
    Math.max(0, Math.round(voucher.discount(subtotal, delivery))),
  );
  if (!discount) {
    return {
      valid: false,
      code,
      discount: 0,
      message: "Đơn hàng này đã được miễn phí giao hàng.",
    };
  }

  return {
    valid: true,
    code,
    discount,
    message: voucher.successMessage,
  };
}
