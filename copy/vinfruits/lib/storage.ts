import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

const env = (import.meta as any).env || {};

export const VINFRUITS_STORAGE_BUCKET =
  env.VINFRUITS_SUPABASE_STORAGE_BUCKET || "vinfruits";

const supabaseUrl =
  env.VINFRUITS_SUPABASE_URL ||
  env.SUPABASE_URL_DUC ||
  env.SUPABASE_URL_ICP ||
  env.PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  env.VINFRUITS_SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY_DUC ||
  env.SUPABASE_SERVICE_ROLE_KEY_ICP ||
  env.SUPABASE_SERVICE_ROLE_KEY;

let bucketReadyPromise: Promise<void> | null = null;

function getVinFruitsStorageClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase Storage env vars. Set VINFRUITS_SUPABASE_URL and VINFRUITS_SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function ensureVinFruitsBucket() {
  const supabase = getVinFruitsStorageClient();
  const { error } = await supabase.storage.createBucket(VINFRUITS_STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/*"],
  });

  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Unable to prepare VinFruits media bucket: ${error.message}`);
  }

  if (error) {
    await supabase.storage.updateBucket(VINFRUITS_STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/*"],
    });
  }
}

export async function ensureVinFruitsStorageBucket() {
  bucketReadyPromise ||= ensureVinFruitsBucket().catch((error) => {
    bucketReadyPromise = null;
    throw error;
  });

  return bucketReadyPromise;
}

function slugifyFileBase(fileName: string) {
  const [name] = fileName.split(/\.[^.]+$/);
  return (
    name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "product-image"
  );
}

function extensionFor(fileName: string, contentType: string) {
  const existing = fileName.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (existing) return existing;
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  if (contentType === "image/svg+xml") return "svg";
  return "jpg";
}

export function isVinFruitsStorageUrl(url: string) {
  return (
    url.includes(`/storage/v1/object/public/${VINFRUITS_STORAGE_BUCKET}/`) ||
    url.includes(`/storage/v1/object/sign/${VINFRUITS_STORAGE_BUCKET}/`)
  );
}

export async function uploadVinFruitsImageToStorage(input: {
  fileName: string;
  contentType: string;
  bytes: Buffer;
  folder?: string;
}) {
  await ensureVinFruitsStorageBucket();

  const supabase = getVinFruitsStorageClient();
  const extension = extensionFor(input.fileName, input.contentType);
  const fileBase = slugifyFileBase(input.fileName);
  const digest = createHash("sha1")
    .update(input.bytes)
    .digest("hex")
    .slice(0, 12);
  const nonce = randomBytes(4).toString("hex");
  const folder = input.folder || "products";
  const path = `${folder}/${fileBase}-${digest}-${nonce}.${extension}`;

  const { data, error } = await supabase.storage
    .from(VINFRUITS_STORAGE_BUCKET)
    .upload(path, input.bytes, {
      contentType: input.contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error || !data) {
    throw new Error(`Unable to upload image to Supabase Storage: ${error?.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(VINFRUITS_STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return {
    bucket: VINFRUITS_STORAGE_BUCKET,
    path: data.path,
    publicUrl: publicUrlData.publicUrl,
  };
}
