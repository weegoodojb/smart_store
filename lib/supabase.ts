import { Product } from "./types";

// Supabase Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Fetch products directly from Supabase ss_products table (No LocalStorage fallback)
 */
export async function getProducts(): Promise<Product[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase credentials missing.");
    return [];
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ss_products?select=*&order=created_at.desc`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
 * Create a new product directly in Supabase ss_products table (No LocalStorage fallback)
 */
export async function createProduct(productData: Omit<Product, "id"> & { id?: string }): Promise<Product | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase credentials missing.");
    return null;
  }

  // Omit custom non-UUID id if empty or auto-generated so Supabase UUID column works
  const { id, ...rest } = productData;
  const bodyPayload = (id && id.includes("-") && id.length === 36) ? { id, ...rest } : rest;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ss_products`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(bodyPayload),
    });

    if (res.ok) {
      const data = await res.json();
      return (Array.isArray(data) && data.length > 0 ? data[0] : null) as Product | null;
    } else {
      const errText = await res.text();
      console.error("Failed to insert product into Supabase ss_products:", errText);
      return null;
    }
  } catch (err) {
    console.error("Error inserting product into Supabase:", err);
    return null;
  }
}

/**
 * Update an existing product directly in Supabase ss_products table (No LocalStorage fallback)
 */
export async function updateProduct(id: string, productData: Partial<Product>): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase credentials missing.");
    return false;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ss_products?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
 * Delete a product directly from Supabase ss_products table (No LocalStorage fallback)
 */
export async function deleteProduct(id: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase credentials missing.");
    return false;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ss_products?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
 * Generic Fetch global config value from Supabase ss_config table (No LocalStorage fallback)
 */
export async function getConfigValue<T>(key: string, defaultValue: T): Promise<T> {
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
 * Generic Update global config value in Supabase ss_config table (No LocalStorage fallback)
 */
export async function updateConfigValue<T>(key: string, value: T): Promise<void> {
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
