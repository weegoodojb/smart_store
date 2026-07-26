import { MOCK_PRODUCTS } from "./mockProducts";
import { Product } from "./types";

// Supabase Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Fetch products from Supabase ss_products table (or fallback to MOCK_PRODUCTS if Supabase is not connected)
 */
export async function getProducts(): Promise<Product[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return MOCK_PRODUCTS;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ss_products?select=*`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("Supabase fetch failed, falling back to mock data.");
      return MOCK_PRODUCTS;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return MOCK_PRODUCTS;
    }
    return data as Product[];
  } catch (err) {
    console.error("Supabase connection error:", err);
    return MOCK_PRODUCTS;
  }
}

/**
 * Fetch global config (e.g. show_naver_products) from ss_config table
 */
export async function getConfig(key: string, defaultValue: boolean = true): Promise<boolean> {
  if (typeof window !== "undefined") {
    const localVal = localStorage.getItem(key);
    if (localVal !== null) {
      return localVal === "true";
    }
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return defaultValue;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ss_config?key=eq.${key}&select=value`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return Boolean(data[0].value);
      }
    }
  } catch (err) {
    console.error("Supabase config fetch error:", err);
  }

  return defaultValue;
}

/**
 * Update global config in ss_config table and localStorage
 */
export async function updateConfig(key: string, value: boolean): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, String(value));
    window.dispatchEvent(new Event("storage"));
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return;
  }

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ss_config`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        key,
        value,
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
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return;
  }

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ss_clicks`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
