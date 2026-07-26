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
    return getLocalProductsFallback();
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
      console.warn("Supabase fetch failed, falling back to mock data.");
      return getLocalProductsFallback();
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return getLocalProductsFallback();
    }
    return data as Product[];
  } catch (err) {
    console.error("Supabase connection error:", err);
    return getLocalProductsFallback();
  }
}

/**
 * Fallback local products storage when Supabase is disconnected
 */
function getLocalProductsFallback(): Product[] {
  if (typeof window === "undefined") return MOCK_PRODUCTS;
  const stored = localStorage.getItem("pickviet_custom_products");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return MOCK_PRODUCTS;
    }
  }
  return MOCK_PRODUCTS;
}

function saveLocalProductsFallback(products: Product[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("pickviet_custom_products", JSON.stringify(products));
    window.dispatchEvent(new Event("storage"));
  }
}

/**
 * Create a new product in ss_products
 */
export async function createProduct(productData: Omit<Product, "id"> & { id?: string }): Promise<Product | null> {
  const newId = productData.id || `prod-${Date.now()}`;
  const newProduct: Product = {
    ...productData,
    id: newId,
  };

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const current = getLocalProductsFallback();
    const updated = [newProduct, ...current];
    saveLocalProductsFallback(updated);
    return newProduct;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ss_products`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(newProduct),
    });

    if (res.ok) {
      const data = await res.json();
      return (Array.isArray(data) && data.length > 0 ? data[0] : newProduct) as Product;
    } else {
      console.error("Failed to create product in Supabase", await res.text());
      // fallback
      const current = getLocalProductsFallback();
      saveLocalProductsFallback([newProduct, ...current]);
      return newProduct;
    }
  } catch (err) {
    console.error("Error creating product:", err);
    const current = getLocalProductsFallback();
    saveLocalProductsFallback([newProduct, ...current]);
    return newProduct;
  }
}

/**
 * Update an existing product in ss_products
 */
export async function updateProduct(id: string, productData: Partial<Product>): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const current = getLocalProductsFallback();
    const updated = current.map((p) => (p.id === id ? { ...p, ...productData } : p));
    saveLocalProductsFallback(updated);
    return true;
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
      const current = getLocalProductsFallback();
      const updated = current.map((p) => (p.id === id ? { ...p, ...productData } : p));
      saveLocalProductsFallback(updated);
      return true;
    }
  } catch (err) {
    console.error("Error updating product:", err);
    const current = getLocalProductsFallback();
    const updated = current.map((p) => (p.id === id ? { ...p, ...productData } : p));
    saveLocalProductsFallback(updated);
    return true;
  }
}

/**
 * Delete a product from ss_products
 */
export async function deleteProduct(id: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const current = getLocalProductsFallback();
    const updated = current.filter((p) => p.id !== id);
    saveLocalProductsFallback(updated);
    return true;
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
      const current = getLocalProductsFallback();
      const updated = current.filter((p) => p.id !== id);
      saveLocalProductsFallback(updated);
      return true;
    }
  } catch (err) {
    console.error("Error deleting product:", err);
    const current = getLocalProductsFallback();
    const updated = current.filter((p) => p.id !== id);
    saveLocalProductsFallback(updated);
    return true;
  }
}

/**
 * Fetch global config (e.g. show_naver_products) from ss_config table
 */
export async function getConfig(key: string, defaultValue: boolean = true): Promise<boolean> {
  return getConfigValue<boolean>(key, defaultValue);
}

/**
 * Update global config in ss_config table and localStorage
 */
export async function updateConfig(key: string, value: boolean): Promise<void> {
  return updateConfigValue<boolean>(key, value);
}

/**
 * Generic Fetch global config value from ss_config or localStorage
 */
export async function getConfigValue<T>(key: string, defaultValue: T): Promise<T> {
  if (typeof window !== "undefined") {
    const localVal = localStorage.getItem(key);
    if (localVal !== null) {
      try {
        return JSON.parse(localVal) as T;
      } catch {
        return (localVal as unknown) as T;
      }
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
 * Generic Update global config value in ss_config table and localStorage
 */
export async function updateConfigValue<T>(key: string, value: T): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
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
