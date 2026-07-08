import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type OnTheBallScript = {
  attrs: Record<string, string | boolean>;
  content?: string;
  src?: string;
};

export type OnTheBallPage = {
  bodyClass?: string;
  bodyHtml: string;
  htmlClass?: string;
  headHtml: string;
  scripts: OnTheBallScript[];
  title: string;
};

const siteRoot = resolve(process.cwd(), "public/www.ontheball-academy.com");
const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const generatedIconPattern =
  /<link[^>]+href="https:\/\/www\.ontheball-academy\.com\/(?:icon|apple-icon)\?[^"]*"[^>]*>/gi;

const routeMap: Record<string, string> = {
  "index.html": "/",
  "about.html": "/about",
  "activities.html": "/activities",
  "contact.html": "/contact",
};

function normalizeBasePath(pathname?: string) {
  if (pathname?.startsWith("/ontheball-academy")) {
    return "/ontheball-academy";
  }

  return "";
}

function mapInternalRoute(asset: string, basePath: string) {
  const mappedPath = routeMap[asset];
  if (!mappedPath) return asset;

  if (mappedPath === "/") {
    return basePath || "/";
  }

  return `${basePath}${mappedPath}`;
}

function transformHtml(html: string, basePath: string) {
  return html
    .replace(
      /\b(href|src)="(index\.html|about\.html|activities\.html|contact\.html)"/g,
      (_, attr: string, asset: string) =>
        `${attr}="${mapInternalRoute(asset, basePath)}"`,
    )
    .replace(
      /\b(href|src)="((?:_next\/|favicon\.ico|icon\.png%3F|apple-icon\.png%3F)[^"]*)"/g,
      (_, attr: string, asset: string) =>
        `${attr}="/www.ontheball-academy.com/${asset}"`,
    )
    .replaceAll(
      "/www.ontheball-academy.com/icon.png%3Fe8439868dd36121d",
      "/www.ontheball-academy.com/icon.png",
    )
    .replaceAll(
      "/www.ontheball-academy.com/apple-icon.png%3Fe8439868dd36121d",
      "/www.ontheball-academy.com/apple-icon.png",
    )
    .replaceAll("https://www.ontheball-academy.com/%23b", "#b");
}

function decodeImageUrl(value: string) {
  return decodeURIComponent(decodeURIComponent(value));
}

function transformNextImageMarkup(html: string) {
  return html
    .replace(/\s+srcSet="_next\/image[^"]*"/gi, "")
    .replace(
      /src="_next\/image(?:%3F|\?)url=([^"&]+)[^"]*"/gi,
      (_, encodedUrl: string) => `src="${decodeImageUrl(encodedUrl)}"`,
    );
}

export function getOnTheBallPage(fileName: string, pathname?: string) {
  const rawHtml = readFileSync(resolve(siteRoot, fileName), "utf-8");
  const basePath = normalizeBasePath(pathname);
  const transformedHtml = transformNextImageMarkup(
    transformHtml(rawHtml, basePath),
  );

  const title =
    transformedHtml.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ||
    "On The Ball Academy";
  const htmlClass =
    transformedHtml.match(/<html[^>]*class="([^"]*)"/i)?.[1] || undefined;
  const bodyClass =
    transformedHtml.match(/<body[^>]*class="([^"]*)"/i)?.[1] || undefined;
  const headInner =
    transformedHtml.match(/<head>([\s\S]*?)<\/head>/i)?.[1] || "";
  const bodyInner =
    transformedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || "";

  return {
    bodyClass,
    bodyHtml: bodyInner.replace(scriptPattern, "").trim(),
    htmlClass,
    headHtml: headInner
      .replace(scriptPattern, "")
      .replace(generatedIconPattern, "")
      .trim(),
    scripts: [],
    title,
  } satisfies OnTheBallPage;
}
