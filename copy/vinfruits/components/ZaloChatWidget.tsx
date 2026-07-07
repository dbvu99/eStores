import { useEffect } from "react";
import { businessInfo } from "@vinfuit/lib/business-info";
import { type Language } from "@vinfuit/lib/i18n";

const zaloSdkUrl = "https://sp.zalo.me/plugins/sdk.js";
const zaloOfficialAccountId =
  import.meta.env.PUBLIC_ZALO_OA_ID || businessInfo.zaloOfficialAccountId;

declare global {
  interface Window {
    ZaloSocialSDK?: {
      reload?: () => void;
    };
  }
}

export function ZaloChatWidget({ language }: { language: Language }) {
  useEffect(() => {
    if (!zaloOfficialAccountId) return;

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${zaloSdkUrl}"]`,
    );

    if (existingScript) {
      window.ZaloSocialSDK?.reload?.();
      return;
    }

    const script = document.createElement("script");
    script.src = zaloSdkUrl;
    script.async = true;
    script.onload = () => window.ZaloSocialSDK?.reload?.();
    document.body.appendChild(script);
  }, []);

  if (!zaloOfficialAccountId) {
    return (
      <div className="fixed z-40 max-w-xs p-4 border shadow-xl bottom-5 right-5 rounded-box border-warning/40 bg-warning text-warning-content">
        <p className="font-semibold">
          {language === "vi"
            ? "Zalo chat chưa được cấu hình"
            : "Zalo chat is not configured"}
        </p>
        <p className="mt-1 text-sm">
          {language === "vi"
            ? "Thêm PUBLIC_ZALO_OA_ID để bật widget trên trang này."
            : "Add PUBLIC_ZALO_OA_ID to enable the widget on this page."}
        </p>
      </div>
    );
  }

  return (
    <div
      className="zalo-chat-widget"
      data-oaid={zaloOfficialAccountId}
      data-welcome-message={
        language === "vi"
          ? "VinFruits có thể hỗ trợ gì cho bạn?"
          : "How can VinFruits help you?"
      }
      data-autopopup="0"
      data-width="350"
      data-height="420"
    />
  );
}
