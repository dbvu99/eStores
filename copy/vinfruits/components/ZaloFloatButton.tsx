import { businessInfo } from "@vinfuit/lib/business-info";
import { type Language } from "@vinfuit/lib/i18n";

export function ZaloFloatButton({ language }: { language: Language }) {
  return (
    <a
      className="kf-zalo-float"
      href={businessInfo.zaloUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={
        language === "vi"
          ? "Chat với VinFruits trên Zalo"
          : "Chat with VinFruits on Zalo"
      }
      title={
        language === "vi"
          ? "Chat với VinFruits trên Zalo"
          : "Chat with VinFruits on Zalo"
      }
    >
      <span className="kf-zalo-float__icon" aria-hidden="true">
        Zalo
      </span>
      <span className="kf-zalo-float__label" aria-hidden="true">
        {language === "vi" ? "Chat Zalo" : "Zalo chat"}
      </span>
    </a>
  );
}
