import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Heart, Minus, Plus, ShoppingBag, Star, Trash2 } from "lucide-react";
import {
  availableStock,
  formatVnd,
  isProductAvailable,
  stockLabel,
  type FruitProduct,
} from "@vinfuit/fruitData";
import { text, type Language } from "@vinfuit/lib/i18n";
import { localizedPath } from "@vinfuit/lib/cart";
import { LinkButton } from "@vinfuit/components/LinkButton";
import { kleverRequest } from "@vinfuit/lib/api";

type ProductReview = {
  id: string;
  productSlug: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  isOwnReview: boolean;
};

type ProductReviewSummary = {
  count: number;
  average: number;
};

type ProductReviewPayload = {
  ok: true;
  reviews: ProductReview[];
  summary: ProductReviewSummary;
  ownReview: ProductReview | null;
};

const emptyReviewSummary: ProductReviewSummary = { count: 0, average: 0 };

function productDescriptionHtml(value: string) {
  if (!/<[a-z][\s\S]*>/i.test(value)) return "";
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "");
}

function RatingStars({
  rating,
  size = 18,
}: {
  rating: number;
  size?: number;
}) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5 text-warning">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={size}
          fill={value <= rounded ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

export function ProductPage({
  product,
  onNavigate,
  onAdd,
  wishlisted = false,
  wishlistEnabled = false,
  reviewEnabled = false,
  onToggleWishlist,
  language,
}: {
  product: FruitProduct;
  onNavigate: (href: string) => void;
  onAdd: (product: FruitProduct, quantity?: number) => void;
  wishlisted?: boolean;
  wishlistEnabled?: boolean;
  reviewEnabled?: boolean;
  onToggleWishlist?: (product: FruitProduct) => void;
  language: Language;
}) {
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewSummary, setReviewSummary] =
    useState<ProductReviewSummary>(emptyReviewSummary);
  const [ownReview, setOwnReview] = useState<ProductReview | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [activeImage, setActiveImage] = useState(product.image);
  const stock = availableStock(product);
  const available = isProductAvailable(product);
  const maxQuantity = stock ?? Number.POSITIVE_INFINITY;
  const productImages =
    product.images && product.images.length ? product.images : [product.image];
  const richDescription = productDescriptionHtml(product.description);

  const loadReviews = async () => {
    setReviewMessage("");
    try {
      const payload = await kleverRequest<ProductReviewPayload>(
        "reviews",
        `/${product.slug}`,
      );
      setReviews(payload.reviews);
      setReviewSummary(payload.summary);
      setOwnReview(payload.ownReview);
      if (payload.ownReview) {
        setReviewRating(payload.ownReview.rating);
        setReviewTitle(payload.ownReview.title);
        setReviewBody(payload.ownReview.body);
      } else {
        setReviewRating(5);
        setReviewTitle("");
        setReviewBody("");
      }
    } catch (error) {
      setReviews([]);
      setReviewSummary(emptyReviewSummary);
      setOwnReview(null);
      setReviewMessage(
        error instanceof Error
          ? error.message
          : language === "vi"
            ? "Không thể tải đánh giá."
            : "Unable to load reviews.",
      );
    }
  };

  useEffect(() => {
    setQuantity(1);
    setActiveImage(product.image);
    loadReviews();
  }, [product.slug]);

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviewBusy(true);
    setReviewMessage("");

    try {
      const payload = await kleverRequest<ProductReviewPayload>(
        "reviews",
        `/${product.slug}`,
        {
          method: "POST",
          body: JSON.stringify({
            rating: reviewRating,
            title: reviewTitle,
            body: reviewBody,
          }),
        },
      );
      setReviews(payload.reviews);
      setReviewSummary(payload.summary);
      setOwnReview(payload.ownReview);
      setReviewMessage(
        language === "vi" ? "Đã lưu đánh giá." : "Review saved.",
      );
    } catch (error) {
      setReviewMessage(
        error instanceof Error
          ? error.message
          : language === "vi"
            ? "Không thể lưu đánh giá."
            : "Unable to save review.",
      );
    } finally {
      setReviewBusy(false);
    }
  };

  const deleteReview = async () => {
    setReviewBusy(true);
    setReviewMessage("");

    try {
      const payload = await kleverRequest<ProductReviewPayload>(
        "reviews",
        `/${product.slug}`,
        { method: "DELETE" },
      );
      setReviews(payload.reviews);
      setReviewSummary(payload.summary);
      setOwnReview(payload.ownReview);
      setReviewRating(5);
      setReviewTitle("");
      setReviewBody("");
      setReviewMessage(
        language === "vi" ? "Đã xóa đánh giá." : "Review removed.",
      );
    } catch (error) {
      setReviewMessage(
        error instanceof Error
          ? error.message
          : language === "vi"
            ? "Không thể xóa đánh giá."
            : "Unable to remove review.",
      );
    } finally {
      setReviewBusy(false);
    }
  };

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
          <li>
            <LinkButton
              href={localizedPath(language, "products")}
              onNavigate={onNavigate}
            >
              {text(language, "products")}
            </LinkButton>
          </li>
          <li>{product.name}</li>
        </ul>
      </div>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        <div className="card bg-base-200">
          <figure>
            <img
              src={activeImage}
              alt={product.name}
              className="max-h-[38rem] w-full object-cover"
            />
          </figure>
          {productImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-6">
              {productImages.map((image) => (
                <button
                  className={`overflow-hidden rounded-box border bg-base-100 ${
                    activeImage === image ? "border-primary ring-2 ring-primary" : ""
                  }`}
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(image)}
                >
                  <img
                    className="object-cover w-full aspect-square"
                    src={image}
                    alt={product.name}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {product.badge && (
              <span className="badge badge-error">{product.badge}</span>
            )}
            <span className="badge badge-outline">{product.origin}</span>
            {product.giftReady && (
              <span className="badge badge-primary">
                {language === "vi" ? "Quà tặng" : "Gift"}
              </span>
            )}
            <span className={`badge ${available ? "badge-success" : ""}`}>
              {stockLabel(product)}
            </span>
          </div>
          <h1 className="text-4xl font-black leading-tight uppercase sm:text-5xl">
            {product.name}
          </h1>
          {richDescription ? (
            <div
              className="prose mt-4 max-w-none text-base-content/70"
              dangerouslySetInnerHTML={{ __html: richDescription }}
            />
          ) : (
            <p className="mt-4 text-base-content/70">{product.description}</p>
          )}
          <div className="flex items-baseline gap-3 mt-5">
            <strong className="text-3xl">{formatVnd(product.price)}</strong>
            {product.compareAt && (
              <span className="text-lg line-through text-base-content/50">
                {formatVnd(product.compareAt)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-base-content/70">
            <RatingStars rating={reviewSummary.average} size={16} />
            <strong className="text-base-content">
              {reviewSummary.count
                ? reviewSummary.average.toFixed(1)
                : language === "vi"
                  ? "Chưa có đánh giá"
                  : "No ratings yet"}
            </strong>
            {reviewSummary.count > 0 && (
              <span>
                {reviewSummary.count}{" "}
                {language === "vi" ? "đánh giá" : "reviews"}
              </span>
            )}
          </div>
          <div className="divider" />
          <div className="space-y-3">
            <h2 className="text-xl font-bold">
              {language === "vi" ? "Chi tiết sản phẩm" : "Product details"}
            </h2>
            <ul className="pl-5 space-y-2 list-disc text-base-content/75">
              {product.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="join">
              <button
                className="btn join-item"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={!available}
              >
                <Minus size={16} />
              </button>
              <span className="btn join-item">{quantity}</span>
              <button
                className="btn join-item"
                onClick={() =>
                  setQuantity((value) => Math.min(maxQuantity, value + 1))
                }
                disabled={!available || quantity >= maxQuantity}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className="btn btn-primary"
              disabled={!available}
              onClick={() => onAdd(product, quantity)}
            >
              <ShoppingBag size={18} />
              {language === "vi" ? "Thêm vào giỏ hàng" : "Add to cart"}
            </button>
            {wishlistEnabled && onToggleWishlist && (
              <button
                className={`btn ${wishlisted ? "btn-primary" : "btn-outline"}`}
                type="button"
                aria-pressed={wishlisted}
                onClick={() => onToggleWishlist(product)}
              >
                <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
                {wishlisted
                  ? language === "vi"
                    ? "Đã yêu thích"
                    : "Saved"
                  : language === "vi"
                    ? "Yêu thích"
                    : "Wishlist"}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1fr]">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">
                  {language === "vi" ? "Đánh giá sản phẩm" : "Product reviews"}
                </h2>
                <p className="mt-1 text-sm text-base-content/65">
                  {reviewSummary.count
                    ? language === "vi"
                      ? `${reviewSummary.count} khách hàng đã đánh giá`
                      : `${reviewSummary.count} customer reviews`
                    : language === "vi"
                      ? "Chưa có đánh giá cho sản phẩm này."
                      : "No reviews for this product yet."}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black">
                  {reviewSummary.count ? reviewSummary.average.toFixed(1) : "-"}
                </div>
                <RatingStars rating={reviewSummary.average} size={15} />
              </div>
            </div>

            {reviewEnabled ? (
              <form className="mt-5 space-y-4" onSubmit={submitReview}>
                <div>
                  <span className="block mb-2 text-sm font-semibold">
                    {language === "vi" ? "Điểm đánh giá" : "Rating"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`btn btn-sm ${
                          reviewRating === value ? "btn-primary" : "btn-outline"
                        }`}
                        aria-label={`${value} star rating`}
                        onClick={() => setReviewRating(value)}
                      >
                        {value}
                        <Star
                          size={15}
                          fill={
                            reviewRating >= value ? "currentColor" : "none"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  className="w-full input input-bordered"
                  value={reviewTitle}
                  maxLength={120}
                  onChange={(event) => setReviewTitle(event.target.value)}
                  placeholder={
                    language === "vi"
                      ? "Tiêu đề ngắn gọn"
                      : "Short review title"
                  }
                />
                <textarea
                  className="w-full textarea textarea-bordered"
                  value={reviewBody}
                  maxLength={1200}
                  rows={5}
                  onChange={(event) => setReviewBody(event.target.value)}
                  placeholder={
                    language === "vi"
                      ? "Chia sẻ trải nghiệm của bạn"
                      : "Share your experience"
                  }
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={reviewBusy}
                  >
                    {reviewBusy
                      ? language === "vi"
                        ? "Đang lưu..."
                        : "Saving..."
                      : ownReview
                        ? language === "vi"
                          ? "Cập nhật đánh giá"
                          : "Update review"
                        : language === "vi"
                          ? "Gửi đánh giá"
                          : "Submit review"}
                  </button>
                  {ownReview && (
                    <button
                      className="btn btn-outline"
                      type="button"
                      disabled={reviewBusy}
                      onClick={deleteReview}
                    >
                      <Trash2 size={16} />
                      {language === "vi" ? "Xóa" : "Remove"}
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="p-4 mt-5 rounded-lg bg-base-200">
                <p className="text-sm text-base-content/70">
                  {language === "vi"
                    ? "Đăng nhập để viết đánh giá cho sản phẩm này."
                    : "Sign in to write a review for this product."}
                </p>
                <button
                  className="mt-3 btn btn-outline btn-sm"
                  type="button"
                  onClick={() =>
                    onNavigate(
                      `${localizedPath(language, "account")}?next=${encodeURIComponent(
                        localizedPath(language, "products", product.slug),
                      )}`,
                    )
                  }
                >
                  {language === "vi" ? "Đăng nhập" : "Sign in"}
                </button>
              </div>
            )}

            {reviewMessage && (
              <p className="text-sm text-base-content/70">{reviewMessage}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {reviews.length ? (
            reviews.map((review) => (
              <article
                key={review.id}
                className="p-5 border rounded-lg border-base-300 bg-base-100"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{review.customerName}</strong>
                      {review.isOwnReview && (
                        <span className="badge badge-primary">
                          {language === "vi" ? "Của bạn" : "Your review"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <RatingStars rating={review.rating} size={15} />
                    </div>
                  </div>
                  <time className="text-xs text-base-content/50">
                    {new Intl.DateTimeFormat(
                      language === "vi" ? "vi-VN" : "en-US",
                      { dateStyle: "medium" },
                    ).format(new Date(review.createdAt))}
                  </time>
                </div>
                {review.title && (
                  <h3 className="mt-3 font-bold">{review.title}</h3>
                )}
                {review.body && (
                  <p className="mt-2 text-sm leading-6 text-base-content/70">
                    {review.body}
                  </p>
                )}
              </article>
            ))
          ) : (
            <div className="p-6 text-center border rounded-lg border-dashed border-base-300 text-base-content/60">
              {language === "vi"
                ? "Hãy là người đầu tiên đánh giá sản phẩm này."
                : "Be the first to review this product."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
