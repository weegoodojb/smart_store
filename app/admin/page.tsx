"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Product, CategoryType } from "@/lib/types";
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getConfig, 
  updateConfig,
  getConfigValue,
  updateConfigValue
} from "@/lib/supabase";
import { 
  Lock, 
  KeyRound, 
  LogOut, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle, 
  ExternalLink, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  AlertCircle,
  Info,
  Rocket,
  ShoppingBag,
  Sparkles,
  LayoutGrid,
  Wand2,
  Loader2
} from "lucide-react";

const CATEGORY_OPTIONS: CategoryType[] = [
  "전체", 
  "🇻🇳 베트남 식자재/생필품", 
  "🎁 기념일/뗏(Tết) 선물", 
  "💄 K-뷰티/건강", 
  "家電 가전/디지털"
];

export default function AdminDashboardPage() {
  // Auth state
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // App Settings state
  const [showNaverProducts, setShowNaverProducts] = useState<boolean>(true);
  const [mobileGridCols, setMobileGridCols] = useState<number>(2);

  // Products CRUD State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);

  // Form Field States
  const [formState, setFormState] = useState({
    name_kr: "",
    name_vn: "",
    category: "🇻🇳 베트남 식자재/생필품" as CategoryType,
    coupang_price: 0,
    naver_price: 0,
    coupang_link: "",
    naver_link: "",
    naver_point_back: 0,
    image_url: "",
    lowest_price_30days: 0,
    price_history_trend: "",
    badge: "",
    is_rocket: true,
    features_kr_str: "",
    features_vn_str: "",
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin1234";

  // Load products list from Supabase/Fallback
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
      showToast("상품 목록을 불러오는 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth session & load config/products on mount
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("admin_authorized");
    if (sessionAuth === "true") {
      setIsAuthorized(true);
    }

    getConfig("show_naver_products", true).then((val) => {
      setShowNaverProducts(val);
    });

    getConfigValue<number>("mobile_grid_cols", 2).then((val) => {
      setMobileGridCols(Number(val) || 2);
    });

    loadProducts();
  }, [loadProducts]);

  // Auth Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      sessionStorage.setItem("admin_authorized", "true");
      setErrorMsg(null);
      showToast("관리자로 인증되었습니다.");
    } else {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem("admin_authorized");
    setPasswordInput("");
  };

  // Toggle Naver Config
  const toggleNaverSetting = async () => {
    const nextState = !showNaverProducts;
    setShowNaverProducts(nextState);
    await updateConfig("show_naver_products", nextState);
    showToast(nextState ? "🟢 네이버 상품 비교가 켜졌습니다." : "🚀 쿠팡 단독 모드로 전환되었습니다.");
  };

  // Change Mobile Grid Layout Setting (1열 / 2열 / 3열)
  const handleMobileGridChange = async (cols: number) => {
    setMobileGridCols(cols);
    await updateConfigValue<number>("mobile_grid_cols", cols);
    showToast(`📱 모바일 상품 진열이 ${cols}열 모드로 변경되었습니다.`);
  };

  // Quick Inline Registration State
  const [quickLinkInput, setQuickLinkInput] = useState<string>("");
  const [quickCategory, setQuickCategory] = useState<CategoryType>("🇻🇳 베트남 식자재/생필품");
  const [isQuickAdding, setIsQuickAdding] = useState<boolean>(false);

  // Fallback Manual Input States
  const [showManualFields, setShowManualFields] = useState<boolean>(false);
  const [manualNameKr, setManualNameKr] = useState<string>("");
  const [manualCoupangPrice, setManualCoupangPrice] = useState<string>("");
  const [manualImageUrl, setManualImageUrl] = useState<string>("");

  // Quick Inline Add Handler (NO Popup Modal Required!)
  const handleInlineQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLinkInput.trim()) {
      showToast("쿠팡 파트너스 단축 링크를 입력해 주세요.", "error");
      return;
    }

    setIsQuickAdding(true);
    try {
      // 1. Scrape metadata from OpenGraph
      const res = await fetch("/api/admin/auto-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupang_url: quickLinkInput.trim() }),
      });

      const json = await res.json();
      if (!json.success || !json.data || !json.data.image_url || !json.data.name_kr) {
        showToast("자동 스크랩 실패: 수동 입력 폼이 표시되었습니다. 상품명, 가격, 이미지를 입력해 주세요.", "error");
        if (json.data) {
          if (json.data.name_kr) setManualNameKr(json.data.name_kr);
          if (json.data.coupang_price) setManualCoupangPrice(String(json.data.coupang_price));
          if (json.data.image_url) setManualImageUrl(json.data.image_url);
        }
        setShowManualFields(true);
        setIsQuickAdding(false);
        return;
      }

      const { name_kr, image_url, coupang_price, is_rocket } = json.data;

      // 2. Build product payload & save to DB
      const payload: Omit<Product, "id"> = {
        name_kr,
        name_vn: name_kr, // Fallback to name_kr
        category: quickCategory,
        coupang_price,
        coupang_link: quickLinkInput.trim(),
        image_url,
        lowest_price_30days: coupang_price,
        is_rocket: typeof is_rocket === "boolean" ? is_rocket : true,
        features_kr: [],
        features_vn: [],
      };

      const created = await createProduct(payload);
      if (created) {
        showToast(`🚀 '${payload.name_kr}' 상품이 성공적으로 등록되었습니다!`);
        setQuickLinkInput("");
        setShowManualFields(false);
        setManualNameKr("");
        setManualCoupangPrice("");
        setManualImageUrl("");
        loadProducts();
      } else {
        showToast("상품 등록 중 오류가 발생했습니다.", "error");
      }
    } catch (err) {
      console.error("Inline quick add error:", err);
      showToast("스크랩 실패: 수동 입력 폼이 표시됩니다.", "error");
      setShowManualFields(true);
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Manual Save Handler
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNameKr.trim()) {
      showToast("상품명을 입력해 주세요.", "error");
      return;
    }
    if (!manualCoupangPrice || Number(manualCoupangPrice) <= 0) {
      showToast("쿠팡 판매가를 정확히 입력해 주세요.", "error");
      return;
    }
    if (!manualImageUrl.trim()) {
      showToast("상품 이미지 URL을 입력해 주세요.", "error");
      return;
    }

    const payload: Omit<Product, "id"> = {
      name_kr: manualNameKr.trim(),
      name_vn: manualNameKr.trim(),
      category: quickCategory,
      coupang_price: Number(manualCoupangPrice),
      coupang_link: quickLinkInput.trim() || "https://link.coupang.com",
      image_url: manualImageUrl.trim(),
      lowest_price_30days: Number(manualCoupangPrice),
      is_rocket: true,
      features_kr: [],
      features_vn: [],
    };

    const created = await createProduct(payload);
    if (created) {
      showToast(`🚀 '${payload.name_kr}' 상품이 수동으로 성공적으로 등록되었습니다!`);
      setQuickLinkInput("");
      setManualNameKr("");
      setManualCoupangPrice("");
      setManualImageUrl("");
      setShowManualFields(false);
      loadProducts();
    } else {
      showToast("상품 저장 중 오류가 발생했습니다.", "error");
    }
  };



  // Open Form Modal for Edit
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormState({
      name_kr: prod.name_kr ?? (prod as unknown as { name?: string }).name ?? "",
      name_vn: prod.name_vn ?? "",
      category: prod.category || "🇻🇳 베트남 식자재/생필품",
      coupang_price: prod.coupang_price ?? (prod as unknown as { price?: number }).price ?? 0,
      naver_price: prod.naver_price ?? 0,
      coupang_link: prod.coupang_link ?? (prod as unknown as { affiliate_link?: string }).affiliate_link ?? "",
      naver_link: prod.naver_link ?? "",
      naver_point_back: prod.naver_point_back ?? 0,
      image_url: prod.image_url ?? "",
      lowest_price_30days: prod.lowest_price_30days ?? 0,
      price_history_trend: prod.price_history_trend ?? "",
      badge: prod.badge ?? "",
      is_rocket: prod.is_rocket ?? true,
      features_kr_str: Array.isArray(prod.features_kr) ? prod.features_kr.join(", ") : "",
      features_vn_str: Array.isArray(prod.features_vn) ? prod.features_vn.join(", ") : "",
    });
  };

  // Submit Edit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const features_kr = formState.features_kr_str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const features_vn = formState.features_vn_str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Omit<Product, "id"> = {
      name_kr: formState.name_kr.trim() || editingProduct.name_kr,
      name_vn: formState.name_vn.trim() || formState.name_kr.trim() || editingProduct.name_kr,
      category: formState.category,
      coupang_price: Number(formState.coupang_price) || 0,
      naver_price: formState.naver_price ? Number(formState.naver_price) : undefined,
      coupang_link: formState.coupang_link.trim() || editingProduct.coupang_link,
      naver_link: formState.naver_link.trim() || undefined,
      naver_point_back: formState.naver_point_back ? Number(formState.naver_point_back) : undefined,
      image_url: formState.image_url.trim() || editingProduct.image_url,
      lowest_price_30days: formState.lowest_price_30days ? Number(formState.lowest_price_30days) : Number(formState.coupang_price),
      price_history_trend: formState.price_history_trend.trim() || undefined,
      badge: formState.badge.trim() || undefined,
      is_rocket: Boolean(formState.is_rocket),
      features_kr,
      features_vn,
    };

    const success = await updateProduct(editingProduct.id, payload);
    if (success) {
      showToast(`'${payload.name_kr}' 상품 정보가 수정되었습니다.`);
      setEditingProduct(null);
      loadProducts();
    } else {
      showToast("상품 수정 중 오류가 발생했습니다.", "error");
    }
  };

  // Delete Action
  const handleDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    const prod = deleteConfirmProduct;
    const success = await deleteProduct(prod.id);
    if (success) {
      showToast(`'${prod.name_kr ?? (prod as unknown as { name?: string }).name}' 상품이 삭제되었습니다.`);
      setDeleteConfirmProduct(null);
      loadProducts();
    } else {
      showToast("상품 삭제에 실패했습니다.", "error");
    }
  };

  // Login Screen
  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xl text-center">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-1">
            PickViet (픽비엣) 관리자 인증
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            어드민 대시보드 및 상품 관리를 위해 비밀번호를 입력해 주세요.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="비밀번호 입력 (기본값: admin1234)"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all placeholder:text-gray-400"
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 py-2 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl transition-colors shadow-md shadow-red-500/20"
            >
              인증 및 접속하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={
            "fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md text-white text-xs sm:text-sm flex items-center gap-2 transition-all " +
            (toastMessage.type === "error" ? "bg-red-600" : "bg-gray-900")
          }
        >
          <Info className="w-4 h-4 text-yellow-300" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>PickViet (픽비엣) 관리자 센터</span>
            <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100">CRUD Pro</span>
          </h1>
          <p className="text-xs text-gray-500">Supabase ss_products 실시간 상품 추가/수정/삭제 및 노출 제어 대시보드입니다.</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/demo"
            target="_blank"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-1"
          >
            <span>유저 랜딩</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleLogout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-2.5 rounded-xl transition-colors flex items-center gap-1"
            title="로그아웃"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Quick Product Add Bar (NO POPUP MODAL REQUIRED!) */}
      <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-md space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
            🚀
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-gray-900">쿠팡 파트너스 상품 원클릭 즉시 등록</h3>
            <p className="text-xs text-gray-500">쿠팡 단축 링크를 입력하고 [상품 등록하기]를 누르면 메타데이터(상품명, 이미지, 가격, 로켓배송)가 자동 수집되어 즉시 저장됩니다.</p>
          </div>
        </div>

        <form onSubmit={handleInlineQuickAdd} className="flex flex-col sm:flex-row items-center gap-2">
          {/* Input 1: Coupang Link */}
          <div className="flex-1 w-full">
            <input
              type="url"
              required
              placeholder="쿠팡 파트너스 단축 링크 입력 (예: https://link.coupang.com/a/...)"
              value={quickLinkInput}
              onChange={(e) => setQuickLinkInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-xs font-medium transition-all shadow-inner"
            />
          </div>

          {/* Input 2: Category Dropdown */}
          <div className="w-full sm:w-56">
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value as CategoryType)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-xs font-bold"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isQuickAdding}
            className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-1.5 flex-shrink-0 whitespace-nowrap"
          >
            {isQuickAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-yellow-300" />
                <span>정보 수집 및 저장 중...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>상품 등록하기</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Manual Input Mode */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowManualFields(!showManualFields)}
            className="text-[11px] font-bold text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3 h-3 text-red-500" />
            <span>{showManualFields ? "❌ 수동 입력창 닫기" : "✏️ 스크랩 없이 수동으로 직접 입력하기"}</span>
          </button>
        </div>

        {/* Fallback Inline Manual Input Form */}
        {showManualFields && (
          <form onSubmit={handleManualSave} className="pt-3 border-t border-red-100 bg-red-50/50 p-4 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                <Pencil className="w-3.5 h-3.5" />
                <span>수동 상품 정보 입력 폼</span>
              </span>
              <span className="text-[11px] text-gray-400">자동 스크랩이 실패했거나 수동 입력이 필요할 때 사용합니다.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">국문 상품명 (필수)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 하오하오 핑크 라면 77g, 30개"
                  value={manualNameKr}
                  onChange={(e) => setManualNameKr(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">쿠팡 판매가 (원, 필수)</label>
                <input
                  type="number"
                  required
                  placeholder="예: 9900"
                  value={manualCoupangPrice}
                  onChange={(e) => setManualCoupangPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">상품 이미지 URL (필수)</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={manualImageUrl}
                  onChange={(e) => setManualImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowManualFields(false)}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-lg shadow transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>수동 입력 상품 저장하기</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Admin Settings Panel (Naver On/Off Switch) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-gray-900">🟢 네이버 쇼핑 상품 비교 노출 설정</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              showNaverProducts ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
            }`}>
              {showNaverProducts ? "현재 ON (쿠팡 + 네이버 듀얼)" : "현재 OFF (쿠팡 단독 모드)"}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {showNaverProducts
              ? "유저 랜딩 페이지(/demo)에 쿠팡과 네이버 듀얼 가격 비교표가 노출됩니다."
              : "유저 랜딩 페이지(/demo)에서 네이버 영역이 감춰지고 [쿠팡 로켓배송] 단독 모드로 동작합니다."}
          </p>
        </div>

        <button
          onClick={toggleNaverSetting}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border shadow-sm flex-shrink-0 ${
            showNaverProducts
              ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
              : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
          }`}
        >
          {showNaverProducts ? (
            <>
              <ToggleRight className="w-5 h-5 text-yellow-300" />
              <span>네이버 비교 기능 [ ON ]</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4 text-gray-400" />
              <span>네이버 비교 기능 [ OFF ]</span>
            </>
          )}
        </button>
      </div>

      {/* Admin Mobile Grid Layout Panel (1열 / 2열 / 3열) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-red-600" />
            <span className="font-extrabold text-sm text-gray-900">📱 모바일 상품 진열 레이아웃 설정</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
              현재: {mobileGridCols}열 모드
            </span>
          </div>
          <p className="text-xs text-gray-500">
            유저 화면(/demo)의 모바일 상품 그리드 열(Column) 수를 동적으로 변경합니다. (ss_config: <code className="bg-gray-100 px-1 rounded text-gray-600">mobile_grid_cols</code>)
          </p>
        </div>

        {/* Segmented Buttons */}
        <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200 flex-shrink-0">
          <button
            onClick={() => handleMobileGridChange(1)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mobileGridCols === 1
                ? "bg-white text-red-600 shadow-sm font-extrabold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            1열 모드
          </button>
          <button
            onClick={() => handleMobileGridChange(2)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mobileGridCols === 2
                ? "bg-white text-red-600 shadow-sm font-extrabold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            2열 모드 (추천)
          </button>
          <button
            onClick={() => handleMobileGridChange(3)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mobileGridCols === 3
                ? "bg-white text-red-600 shadow-sm font-extrabold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            3열 모드 (밀집)
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400">등록된 상품 수</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{products.length}개</p>
          <span className="text-[11px] text-emerald-600 font-medium">Supabase ss_products 실시간 연동</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400">활성 제휴 모드</span>
          <p className={`text-xl font-extrabold mt-1 ${showNaverProducts ? "text-emerald-600" : "text-red-600"}`}>
            {showNaverProducts ? "쿠팡 & 네이버 듀얼" : "쿠팡 파트너스 단독"}
          </p>
          <span className="text-[11px] text-gray-400 font-medium">ss_config 연동 상태</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400">공정위 대가성 고지 문구</span>
          <p className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle className="w-5 h-5" /> 정상 준수
          </p>
          <span className="text-[11px] text-gray-400 font-medium">푸터 영역 자동 대응</span>
        </div>
      </div>

      {/* Products Table (CRUD Main View) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-800">상품 정보 목록 (ss_products)</h3>
            <p className="text-[11px] text-gray-400">상품의 등록, 수정, 삭제 및 파트너스 아웃링크를 관리할 수 있습니다.</p>
          </div>
          <button
            onClick={loadProducts}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            🔄 새로고침
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-400">
            상품 데이터를 불러오는 중입니다...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-500 font-semibold">등록된 상품이 없습니다.</p>
            <p className="text-[11px] text-red-600 font-bold">상단 인라인 입력창에 쿠팡 파트너스 링크를 입력하여 즉시 등록해 주세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                <tr>
                  <th className="p-3.5">이미지/상품명</th>
                  <th className="p-3.5">카테고리</th>
                  <th className="p-3.5">쿠팡 판매가</th>
                  <th className="p-3.5">네이버 최저가</th>
                  <th className="p-3.5">로켓배송</th>
                  <th className="p-3.5">제휴 링크</th>
                  <th className="p-3.5 text-center">관리 (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((prod) => {
                  const priceValue = (prod as unknown as { price?: number }).price ?? prod.coupang_price ?? 0;
                  const naverPriceValue = prod.naver_price;
                  const nameKr = prod.name_kr ?? (prod as unknown as { name?: string }).name ?? "상품명 없음";
                  const nameVn = prod.name_vn ?? "";
                  const coupangLink = prod.coupang_link ?? (prod as unknown as { affiliate_link?: string }).affiliate_link ?? "#";

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                            {prod.image_url ? (
                              <Image
                                src={prod.image_url}
                                alt={nameKr}
                                fill
                                unoptimized
                                className="object-cover"
                                sizes="44px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Image</div>
                            )}
                          </div>
                          <div className="max-w-[220px]">
                            <div className="font-bold text-gray-900 line-clamp-1">{nameKr}</div>
                            {nameVn && <div className="text-[11px] text-gray-400 line-clamp-1">🇻🇳 {nameVn}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded text-[11px]">
                          {prod.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-red-600 text-sm">
                        {priceValue.toLocaleString()}원
                      </td>
                      <td className="p-3.5 font-bold text-emerald-600 text-sm">
                        {naverPriceValue ? `${naverPriceValue.toLocaleString()}원` : "-"}
                      </td>
                      <td className="p-3.5">
                        {prod.is_rocket ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                            <Rocket className="w-3 h-3" /> 로켓
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">일반</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <a
                            href={coupangLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate block max-w-[140px] text-[11px]"
                            title={coupangLink}
                          >
                            🚀 {coupangLink}
                          </a>
                          {prod.naver_link && (
                            <a
                              href={prod.naver_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline truncate block max-w-[140px] text-[11px]"
                              title={prod.naver_link}
                            >
                              🟢 {prod.naver_link}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors flex items-center gap-1 text-[11px]"
                            title="수정"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>수정</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmProduct(prod)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-colors flex items-center gap-1 text-[11px]"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>삭제</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Edit Modal (Appears ONLY when editing existing product) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-red-600" />
                <span>상품 정보 수정 (Edit Product)</span>
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Row 1: Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    국문 상품명 (name_kr)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 비비고 베트남 쌀국수 세트"
                    value={formState.name_kr}
                    onChange={(e) => setFormState({ ...formState, name_kr: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    베트남어 상품명 (name_vn) <span className="text-gray-400 font-normal">(선택)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="미입력 시 국문 상품명이 대신 표시됩니다"
                    value={formState.name_vn}
                    onChange={(e) => setFormState({ ...formState, name_vn: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Category & Rocket Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    카테고리 선택
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value as CategoryType })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all font-semibold"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    로켓배송 여부 (is_rocket)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormState({ ...formState, is_rocket: !formState.is_rocket })}
                    className={`w-full p-2.5 rounded-xl font-extrabold flex items-center justify-center gap-2 border transition-all ${
                      formState.is_rocket
                        ? "bg-red-50 text-red-600 border-red-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    <Rocket className="w-4 h-4" />
                    <span>{formState.is_rocket ? "🚀 로켓배송 적용중" : "일반 배송"}</span>
                  </button>
                </div>
              </div>

              {/* Row 3: Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    쿠팡 판매가 (원)
                  </label>
                  <input
                    type="number"
                    placeholder="18900"
                    value={formState.coupang_price || ""}
                    onChange={(e) => setFormState({ ...formState, coupang_price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all font-bold text-red-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    네이버 최저가 (원)
                  </label>
                  <input
                    type="number"
                    placeholder="17900"
                    value={formState.naver_price || ""}
                    onChange={(e) => setFormState({ ...formState, naver_price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    NPay 적립금 (원)
                  </label>
                  <input
                    type="number"
                    placeholder="500"
                    value={formState.naver_point_back || ""}
                    onChange={(e) => setFormState({ ...formState, naver_point_back: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 4: Image URL & Links */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    상품 이미지 URL (image_url)
                  </label>
                  <input
                    type="url"
                    placeholder="https://thumbnail.coupangcdn.com/..."
                    value={formState.image_url}
                    onChange={(e) => setFormState({ ...formState, image_url: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    쿠팡 파트너스 단축 링크
                  </label>
                  <input
                    type="url"
                    placeholder="https://link.coupang.com/a/..."
                    value={formState.coupang_link}
                    onChange={(e) => setFormState({ ...formState, coupang_link: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    네이버 쇼핑 비교 링크 (선택)
                  </label>
                  <input
                    type="url"
                    placeholder="https://search.shopping.naver.com/..."
                    value={formState.naver_link}
                    onChange={(e) => setFormState({ ...formState, naver_link: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 5: Feature Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    한국어 특징 태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    placeholder="진한 육수, 칠리소스 포함, 5분 조리"
                    value={formState.features_kr_str}
                    onChange={(e) => setFormState({ ...formState, features_kr_str: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    베트남어 특징 태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    placeholder="Hương vị phở chuẩn vị, Kèm tương ớt, Nấu 5 phút"
                    value={formState.features_vn_str}
                    onChange={(e) => setFormState({ ...formState, features_vn_str: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Form Footer Action */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition-all shadow-md shadow-red-500/20"
                >
                  상품 수정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl border border-gray-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-gray-900">상품 삭제 확인</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                정말로 &apos;<strong className="text-gray-900">{deleteConfirmProduct.name_kr ?? (deleteConfirmProduct as unknown as { name?: string }).name}</strong>&apos; 상품을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="w-1/2 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteProduct}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs transition-colors shadow-md shadow-red-500/20"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
