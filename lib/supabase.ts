import { Product } from "./types";

// Fallback Supabase Credentials
const DEFAULT_SUPABASE_URL = "https://dhurxwwfzyyfufswyltn.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_5syLiQrKtutpuej94j7vjw_7L1OdrW6";

export function getSupabaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().startsWith("http")) {
    return envUrl.trim();
  }
  return DEFAULT_SUPABASE_URL;
}

export function getSupabaseKey(): string {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (envKey && typeof envKey === "string" && envKey.trim().length > 10) {
    return envKey.trim();
  }
  return DEFAULT_SUPABASE_ANON_KEY;
}

export interface SupabaseOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Fetch products directly from Supabase ss_products table
 */
export async function getProducts(): Promise<Product[]> {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  try {
    const res = await fetch(`${url}/rest/v1/ss_products?select=*&order=created_at.desc`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("Supabase fetch failed with status:", res.status);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }
    return data as Product[];
  } catch (err) {
    console.error("Supabase connection error:", err);
    return [];
  }
}

/**
 * Create a new product directly in Supabase ss_products table
 */
export async function createProductWithStatus(
  productData: Omit<Product, "id"> & { id?: string }
): Promise<SupabaseOperationResult<Product>> {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  const { id, ...rest } = productData;
  const bodyPayload = (id && id.includes("-") && id.length === 36) ? { id, ...rest } : rest;

  try {
    const res = await fetch(`${url}/rest/v1/ss_products`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(bodyPayload),
    });

    const resText = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(resText);
    } catch {
      // ignore JSON parse error
    }

    if (res.ok) {
      const inserted = Array.isArray(json) && json.length > 0 ? json[0] : json;
      return { success: true, data: inserted as Product };
    } else {
      const errCode = json?.code || "";
      const errMsg = json?.message || resText || "Supabase DB 저장 실패";
      console.error(`[Supabase INSERT Error ${res.status}] Code: ${errCode}`, errMsg);

      if (errCode === "42501" || errMsg.includes("row-level security")) {
        return {
          success: false,
          code: "42501",
          error: "Supabase RLS(행 수준 보안) 정책 차단: Supabase SQL Editor에서 ss_products 테이블 INSERT 허용 쿼리를 실행해 주세요.",
        };
      }

      return { success: false, code: errCode, error: errMsg };
    }
  } catch (err: any) {
    console.error("Error inserting product into Supabase:", err);
    return { success: false, error: err?.message || "네트워크 통신 오류가 발생했습니다." };
  }
}

/**
 * Backward-compatible wrapper for createProduct
 */
export async function createProduct(
  productData: Omit<Product, "id"> & { id?: string }
): Promise<Product | null> {
  const result = await createProductWithStatus(productData);
  return result.success && result.data ? result.data : null;
}

/**
 * Update an existing product directly in Supabase ss_products table
 */
export async function updateProduct(id: string, productData: Partial<Product>): Promise<boolean> {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  try {
    const res = await fetch(`${url}/rest/v1/ss_products?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    if (res.ok) {
      return true;
    } else {
      const errText = await res.text();
      console.error("Failed to update product in Supabase:", errText);
      return false;
    }
  } catch (err) {
    console.error("Error updating product in Supabase:", err);
    return false;
  }
}

/**
 * Delete a product directly from Supabase ss_products table
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  try {
    const res = await fetch(`${url}/rest/v1/ss_products?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (res.ok) {
      return true;
    } else {
      const errText = await res.text();
      console.error("Failed to delete product in Supabase:", errText);
      return false;
    }
  } catch (err) {
    console.error("Error deleting product in Supabase:", err);
    return false;
  }
}

/**
 * Fetch global config from Supabase ss_config table
 */
export async function getConfig(key: string, defaultValue: boolean = true): Promise<boolean> {
  return getConfigValue<boolean>(key, defaultValue);
}

/**
 * Update global config in Supabase ss_config table
 */
export async function updateConfig(key: string, value: boolean): Promise<void> {
  return updateConfigValue<boolean>(key, value);
}

/**
 * Generic Fetch global config value from Supabase ss_config table
 */
export async function getConfigValue<T>(key: string, defaultValue: T): Promise<T> {
  const url = getSupabaseUrl();
  const keyStr = getSupabaseKey();

  try {
    const res = await fetch(`${url}/rest/v1/ss_config?key=eq.${key}&select=value`, {
      headers: {
        apikey: keyStr,
        Authorization: `Bearer ${keyStr}`,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const val = data[0].value;
        return (typeof val === "string" && typeof defaultValue === "number" ? Number(val) : val) as T;
      }
    }
  } catch (err) {
    console.error("Supabase config fetch error:", err);
  }

  return defaultValue;
}

/**
 * Generic Update global config value in Supabase ss_config table
 */
export async function updateConfigValue<T>(key: string, value: T): Promise<void> {
  const url = getSupabaseUrl();
  const keyStr = getSupabaseKey();

  try {
    await fetch(`${url}/rest/v1/ss_config`, {
      method: "POST",
      headers: {
        apikey: keyStr,
        Authorization: `Bearer ${keyStr}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        key,
        value: typeof value === "number" || typeof value === "boolean" ? value : JSON.stringify(value),
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("Supabase config update error:", err);
  }
}

/**
 * Log user outlink clicks to ss_clicks table
 */
export async function logClick(productId: string, platform: "coupang" | "naver"): Promise<void> {
  const url = getSupabaseUrl();
  const keyStr = getSupabaseKey();

  try {
    await fetch(`${url}/rest/v1/ss_clicks`, {
      method: "POST",
      headers: {
        apikey: keyStr,
        Authorization: `Bearer ${keyStr}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        platform,
        created_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("Supabase click log error:", err);
  }
}
