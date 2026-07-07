import { businessInfo } from "@vinfuit/lib/business-info";
import { localizedPath } from "@vinfuit/lib/cart";
import { text, type Language } from "@vinfuit/lib/i18n";
import { LinkButton } from "@vinfuit/components/LinkButton";
import Logo from "@vinfuit/components/Logo.js";

export function Footer({
  onNavigate,
  language,
}: {
  onNavigate: (href: string) => void;
  language: Language;
}) {
  return (
    <footer className="p-10 footer footer-horizontal footer-center bg-base-200 text-base-content">
      <aside>
        <Logo />
        <p className="font-bold">{businessInfo.displayName}</p>
        <p>{businessInfo.address}</p>
        <p>
          <a className="link" href={businessInfo.hotlineHref}>
            {businessInfo.hotline}
          </a>{" "}
          ·{" "}
          <a className="link" href={businessInfo.emailHref}>
            {businessInfo.email}
          </a>
        </p>
        <p>
          {language === "vi"
            ? businessInfo.businessHours
            : businessInfo.businessHoursEnglish}
        </p>
        <p>
          <a className="link" href={businessInfo.zaloUrl}>
            Zalo OA
          </a>{" "}
          ·{" "}
          <a className="link" href={businessInfo.facebookUrl}>
            Facebook
          </a>
        </p>
      </aside>
      <nav className="grid grid-flow-col gap-4">
        <LinkButton
          href={localizedPath(language, "home")}
          onNavigate={onNavigate}
          className="link"
        >
          {text(language, "home")}
        </LinkButton>
        <LinkButton
          href={localizedPath(language, "products")}
          onNavigate={onNavigate}
          className="link"
        >
          {text(language, "products")}
        </LinkButton>
        <LinkButton
          href={localizedPath(language, "about")}
          onNavigate={onNavigate}
          className="link"
        >
          {language === "vi" ? "Giới thiệu" : "About"}
        </LinkButton>
        <LinkButton
          href={localizedPath(language, "contact")}
          onNavigate={onNavigate}
          className="link"
        >
          {text(language, "contact")}
        </LinkButton>
      </nav>
    </footer>
  );
}
