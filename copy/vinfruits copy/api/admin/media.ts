import {
  getCustomerBySessionToken,
  getMediaAssetsForAdmin,
  getSessionTokenFromCookies,
  saveMediaAssetForAdmin,
} from "@vinfuit/lib/account-auth";
import { uploadVinFruitsImageToStorage } from "@vinfuit/lib/storage";
import type { APIRoute } from "astro";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function requireAdmin(cookies: Parameters<APIRoute>[0]["cookies"]) {
  const customer = await getCustomerBySessionToken(
    getSessionTokenFromCookies(cookies),
  );
  if (!customer?.roles.includes("admin")) {
    throw new Error("Admin access is required.");
  }
  return customer;
}

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const customer = await requireAdmin(cookies);
    const mediaAssets = await getMediaAssetsForAdmin(customer);
    return new Response(JSON.stringify({ ok: true, mediaAssets }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin access is required.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const customer = await requireAdmin(cookies);
    const formData = await request.formData();
    const file = formData.get("file");
    const altText =
      typeof formData.get("altText") === "string"
        ? String(formData.get("altText"))
        : "";

    if (!file || typeof (file as File).arrayBuffer !== "function") {
      throw new Error("Choose an image to upload.");
    }

    const imageFile = file as File;
    if (!imageFile.type.startsWith("image/")) {
      throw new Error("Only image uploads are supported.");
    }
    if (imageFile.size > MAX_IMAGE_BYTES) {
      throw new Error("Image must be 5 MB or smaller.");
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const uploaded = await uploadVinFruitsImageToStorage({
      fileName: imageFile.name || "product-image",
      contentType: imageFile.type,
      bytes: buffer,
      folder: "products",
    });

    await saveMediaAssetForAdmin(customer, {
      fileName: imageFile.name || "product-image",
      contentType: imageFile.type,
      sizeBytes: imageFile.size,
      publicUrl: uploaded.publicUrl,
      altText,
    });

    const mediaAssets = await getMediaAssetsForAdmin(customer);
    return new Response(JSON.stringify({ ok: true, mediaAssets }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload image.";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
