const DEFAULT_GOCANVAS_API_BASE_URL = "https://www.gocanvas.com/apiv2";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getGoCanvasConfig() {
  const token =
    import.meta.env.GOCANVAS_API_TOKEN || import.meta.env.GOCANVAS_TOKEN || "";
  const baseUrl = trimTrailingSlash(
    import.meta.env.GOCANVAS_API_BASE_URL || DEFAULT_GOCANVAS_API_BASE_URL,
  );

  return { token, baseUrl };
}

export function getGoCanvasHeaders(extraHeaders?: HeadersInit): Headers {
  const { token } = getGoCanvasConfig();
  const headers = new Headers(extraHeaders || {});

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

export async function goCanvasRequest(path: string, init?: RequestInit) {
  const { token, baseUrl } = getGoCanvasConfig();
  if (!token) {
    return {
      ok: false,
      status: 500,
      data: { error: "Missing GOCANVAS_API_TOKEN in environment." },
    };
  }

  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: getGoCanvasHeaders(init?.headers),
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => "");

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      data: {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected GoCanvas request error.",
      },
    };
  }
}
