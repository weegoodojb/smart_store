"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  Search, 
  Check, 
  Plus, 
  X, 
  ExternalLink, 
  Scale, 
  Star, 
  Sparkles, 
  ShieldCheck, 
  ShoppingBag,
  ChevronRight,
  Info,
  TrendingDown,
  Rocket,
  Gift
} from "lucide-react";
import { Product, CategoryType } from "@/lib/types";
import { getProducts, getConfig, getConfigValue, logClick } from "@/lib/supabase";

const CATEGORIES: CategoryType[] = [
  "전체", 
  "🇻🇳 베트남 식자재/생필품", 
  "🎁 기념일/뗏(Tết) 선물", 
  "💄 K-뷰티/건강", 
  "家電 가전/디지털"
];

export default function DemoClient() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("전체");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Real-time Supabase Products state
  const [products, setProducts] = useState<Product[]>([]);

  // Multilingual state (KR / VN)
  const [lang, setLang] = useState<"KR" | "VN">("KR");

  // Naver comparison On/Off state
  const [showNaverProducts, setShowNaverProducts] = useState<boolean>(true);
  
  // Mobile Grid Cols state (1, 2, or 3)
  const [mobileGridCols, setMobileGridCols] = useState<number>(2);

  // Load real-time products from Supabase
  const loadLiveProducts = useCallback(async () => {
    const data = await getProducts();
    setProducts(data);
  }, []);

  // Sync with Supabase config / localStorage on mount and listen to storage events
  useEffect(() => {
    loadLiveProducts();

    getConfig("show_naver_products", true).then((val) => {
      setShowNaverProducts(val);
    });

    getConfigValue<number>("mobile_grid_cols", 2).then((val) => {
      setMobileGridCols(Number(val) || 2);
    });

    const handleStorageChange = () => {
      loadLiveProducts();
      getConfig("show_naver_products", true).then((val) => {
        setShowNaverProducts(val);
      });
      getConfigValue<number>("mobile_grid_cols", 2).then((val) => {
        setMobileGridCols(Number(val) || 2);
      });
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadLiveProducts]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filter products from live Supabase DB
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = selectedCategory === "전체" || product.category === selectedCategory;
      const searchTarget = ((product.name_kr || "") + (product.name_vn || "") + (product.features_kr || []).join(" ")).toLowerCase();
      const matchSearch = searchTarget.includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Toggle compare selection (max 3)
  const toggleCompare = (product: Product) => {
    const isAlreadySelected = compareItems.some((item) => item.id === product.id);

    if (isAlreadySelected) {
      setCompareItems(compareItems.filter((item) => item.id !== product.id));
      showToast(lang === "KR" ? `'${product.name_kr.slice(0, 10)}...' 비교함에서 제외` : `Đã xóa '${product.name_vn.slice(0, 10)}...'`);
    } else {
      if (compareItems.length >= 3) {
        showToast(lang === "KR" ? "비교함에는 최대 3개 상품까지 담을 수 있습니다." : "Chỉ có thể chọn tối đa 3 sản phẩm để so sánh.");
        return;
      }
      setCompareItems([...compareItems, product]);
      showToast(lang === "KR" ? `'${product.name_kr.slice(0, 10)}...' 비교함에 담김` : `Đã thêm '${product.name_vn.slice(0, 10)}...'`);
    }
  };

  const removeFromCompare = (id: string) => {
    setCompareItems(compareItems.filter((item) => item.id !== id));
  };

  const handleOutlinkClick = (productId: string, platform: "coupang" | "naver") => {
    logClick(productId, platform);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-28 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header (Clean User UI with NO Switch Buttons) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md transition-colors ${
              showNaverProducts
                ? "bg-gradient-to-tr from-red-600 via-rose-500 to-emerald-500 shadow-red-500/20"
                : "bg-gradient-to-tr from-red-600 to-rose-500 shadow-red-500/20"
            }`}>
              PV
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg text-gray-900 tracking-tight flex items-center gap-1">
                PickViet <span className="text-red-600 font-bold text-xs bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                  {showNaverProducts ? "픽비엣 듀얼 🇻🇳" : "픽비엣 단독 🇻🇳"}
                </span>
              </span>
              <p className="text-[10px] text-gray-500 font-medium">
                {showNaverProducts
                  ? (lang === "KR" ? "한국 거주 베트남인을 위한 스마트 최저가 비교" : "So sánh giá Coupang & Naver cho người Việt tại Hàn Quốc")
                  : (lang === "KR" ? "쿠팡 파트너스 단독 최저가 추천" : "Khuyến nghị giá rẻ nhất Coupang")}
              </p>
            </div>
          </div>

          {/* Right Header Toolbar: Only Language Switcher */}
          <div className="flex items-center gap-2">
            {/* Language Switcher (KR / VN) */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
              <button
                onClick={() => setLang("KR")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  lang === "KR"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <span>🇰🇷</span>
                <span className="hidden sm:inline">한국어</span>
              </button>
              <button
                onClick={() => setLang("VN")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  lang === "VN"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <span>🇻🇳</span>
                <span>Tiếng Việt</span>
              </button>
            </div>

            <a 
              href="/admin" 
              className="text-xs text-gray-500 hover:text-gray-900 font-medium px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block"
            >
              Admin
            </a>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={
                showNaverProducts
                  ? (lang === "KR" ? "상품명, 뗏(Tết) 선물, 쿠팡 vs 네이버 최저가 검색..." : "Tìm kiếm sản phẩm, quà Tết, Coupang vs Naver...")
                  : (lang === "KR" ? "상품명, 뗏(Tết) 선물, 쿠팡 로켓 최저가 검색..." : "Tìm kiếm sản phẩm, quà Tết, Coupang Rocket...")
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-red-500 transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-4">
        {/* Banner with Mode Sensitivity */}
        <div className={`rounded-2xl p-5 sm:p-6 text-white mb-6 shadow-lg transition-all duration-300 relative overflow-hidden ${
          showNaverProducts
            ? "bg-gradient-to-r from-red-600 via-rose-600 to-emerald-600 shadow-red-500/10"
            : "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 shadow-red-500/10"
        }`}>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>
                {showNaverProducts
                  ? (lang === "KR" ? "🚀 쿠팡 로켓배송 vs 🟢 네이버 페이 적립 최저가 비교" : "So sánh Coupang Rocket vs Naver Pay")
                  : (lang === "KR" ? "🚀 쿠팡 파트너스 와우/로켓배송 단독 최저가 가이드" : "Khuyến nghị giá rẻ nhất Coupang Rocket")}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">
              {showNaverProducts
                ? (lang === "KR" ? "쿠팡 & 네이버 듀얼 제휴 최저가 스마트 가이드" : "So sánh giá thông minh Coupang & Naver")
                : (lang === "KR" ? "쿠팡 로켓 최저가 & 베트남 타겟 맞춤 가이드" : "Hướng dẫn giá rẻ nhất Coupang Rocket")}
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-lg leading-relaxed">
              {showNaverProducts
                ? (lang === "KR" ? "쿠팡 빠른 배송과 네이버 NPay 적립을 한눈에 비교하고 주문하세요!" : "So sánh Coupang Rocket và điểm Naver Pay để chọn mua tiết kiệm nhất!")
                : (lang === "KR" ? "쿠팡 로켓배송 혜택과 최근 30일 최저가를 확인하고 알뜰하게 구매하세요!" : "Xem ưu đãi Coupang Rocket và giá rẻ nhất 30 ngày qua!")}
            </p>
          </div>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Counter */}
        <div className="flex items-center justify-between mb-4 text-xs">
          <p className="font-medium text-gray-500">
            {lang === "KR" ? "상품" : "Sản phẩm"}{" "}
            <span className="text-gray-900 font-bold">{filteredProducts.length}</span>개
          </p>
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-md font-medium border border-red-100">
            <Scale className="w-3.5 h-3.5" />
            <span>
              {showNaverProducts
                ? (lang === "KR" ? "최대 3개 듀얼 비교" : "So sánh tối đa 3 sản phẩm")
                : (lang === "KR" ? "최대 3개 스펙/가격 비교" : "So sánh tối đa 3 sản phẩm")}
            </span>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 mb-1">
              {lang === "KR" ? "검색 결과가 없습니다" : "Không tìm thấy sản phẩm"}
            </h3>
            <p className="text-xs text-gray-500">
              {lang === "KR" ? "다른 키워드나 카테고리를 선택해 보세요." : "Vui lòng thử từ khóa hoặc danh mục khác."}
            </p>
          </div>
        ) : (
          <div className={`grid ${
            mobileGridCols === 1
              ? "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : mobileGridCols === 3
              ? "grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          }`}>
            {filteredProducts.map((product) => {
              const isSelected = compareItems.some((item) => item.id === product.id);

              // Naver Info Conditional Check (requires both naver_link and positive naver_price)
              const hasNaverInfo = Boolean(product.naver_link && product.naver_price && product.naver_price > 0);
              const isNaverActive = showNaverProducts && hasNaverInfo;

              const isNaverCheaper = isNaverActive ? (product.naver_price! < product.coupang_price) : false;
              const isCoupangCheaper = !isNaverActive || (product.naver_price ? product.coupang_price <= product.naver_price : true);
              const isCompact = mobileGridCols === 3;

              // Vietnamese Title Fallback to Korean Title if empty
              const nameVnDisplay = product.name_vn && product.name_vn.trim() ? product.name_vn : product.name_kr;

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between hover:shadow-md ${
                    isSelected ? "border-red-500 ring-2 ring-red-500/20" : "border-gray-200"
                  }`}
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="relative aspect-square bg-gray-100 w-full overflow-hidden group">
                      <Image
                        src={product.image_url}
                        alt={product.name_kr}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      
                      <div className={`absolute flex flex-col gap-1 ${
                        isCompact ? "top-1.5 left-1.5" : "top-3 left-3"
                      }`}>
                        {product.badge && (
                          <span className={`bg-red-600 text-white font-bold rounded-full shadow-sm ${
                            isCompact ? "text-[9px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-1"
                          }`}>
                            {product.badge}
                          </span>
                        )}
                        {isNaverActive && (
                          <span className={`font-extrabold rounded-md shadow-sm ${
                            isCompact ? "text-[8px] px-1 py-0.5" : "text-[10px] px-2 py-0.5"
                          } ${
                            isNaverCheaper ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                          }`}>
                            {isNaverCheaper ? "🏆 네이버!" : "🏆 쿠팡!"}
                          </span>
                        )}
                      </div>

                      {/* Compare Checkbox Button */}
                      <button
                        onClick={() => toggleCompare(product)}
                        className={`absolute rounded-full flex items-center justify-center transition-all ${
                          isCompact ? "top-1.5 right-1.5 w-6 h-6" : "top-3 right-3 w-8 h-8"
                        } ${
                          isSelected
                            ? "bg-red-600 text-white shadow-lg scale-110"
                            : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white shadow-sm"
                        }`}
                        title={isSelected ? "비교함에서 제거" : "비교함에 추가"}
                      >
                        {isSelected ? <Check className={`${isCompact ? "w-3 h-3" : "w-4 h-4"} stroke-[3]`} /> : <Plus className={isCompact ? "w-3 h-3" : "w-4 h-4"} />}
                      </button>
                    </div>

                    {/* Card Body */}
                    <div className={isCompact ? "p-2 sm:p-4" : "p-4"}>
                      {/* Price History Trend Badge */}
                      {product.price_history_trend && !isCompact && (
                        <div className="mb-2.5 bg-amber-50 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-200/70 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span className="truncate">{product.price_history_trend}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className={`font-medium bg-gray-100 rounded text-gray-600 ${
                          isCompact ? "text-[9px] px-1 py-0.5" : "text-xs px-2 py-0.5"
                        }`}>
                          {product.category}
                        </span>
                        {product.rating && !isCompact && (
                          <span className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {product.rating}
                          </span>
                        )}
                      </div>

                      {/* Titles */}
                      <h3 className={`font-bold text-gray-900 leading-snug ${
                        isCompact ? "text-xs line-clamp-1" : "text-sm line-clamp-2"
                      }`}>
                        {product.name_kr}
                      </h3>
                      <p className={`text-gray-500 font-normal line-clamp-1 ${
                        isCompact ? "text-[10px] mt-0" : "text-xs mt-0.5"
                      }`}>
                        🇻🇳 {nameVnDisplay}
                      </p>

                      {/* Price Display */}
                      {!isNaverActive ? (
                        <div className={`bg-gray-50 rounded-xl border border-gray-100 ${
                          isCompact ? "my-1.5 p-1.5" : "my-2.5 p-2.5"
                        }`}>
                          {product.original_price && !isCompact && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 line-through">
                              <span>{product.original_price.toLocaleString()}원</span>
                            </div>
                          )}
                          <div className="flex items-baseline justify-between gap-1">
                            <div className="flex items-baseline gap-1">
                              {product.discount_rate && !isCompact && (
                                <span className="text-base font-extrabold text-red-600">
                                  {product.discount_rate}%
                                </span>
                              )}
                              <span className={`font-black text-gray-900 ${
                                isCompact ? "text-xs" : "text-lg"
                              }`}>
                                {product.coupang_price.toLocaleString()}<span className="text-[10px] font-normal">원</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`text-emerald-700 font-semibold bg-emerald-50 rounded inline-block border border-emerald-100 ${
                          isCompact ? "mt-1 text-[9px] px-1 py-0.5" : "mt-2 text-[11px] px-2 py-0.5"
                        }`}>
                          30일최저: {product.lowest_price_30days.toLocaleString()}원
                        </div>
                      )}

                      {/* Features Badges */}
                      {!isCompact && (product.features_kr?.length || 0) > 0 && (
                        <div className="space-y-1 pt-3 border-t border-gray-100 mt-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            {lang === "KR" ? "특징" : "Đặc điểm"}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {product.features_kr.slice(0, 3).map((feat, idx) => {
                              const featVn = product.features_vn?.[idx];
                              return (
                                <span
                                  key={idx}
                                  className="text-[11px] bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-200/80"
                                >
                                  ✓ {feat} {featVn ? <span className="text-gray-500 text-[10px]">({featVn})</span> : null}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className={isCompact ? "p-2 pt-0 space-y-1" : "p-4 pt-0 space-y-2"}>
                    <button
                      onClick={() => toggleCompare(product)}
                      className={`w-full font-bold transition-all flex items-center justify-center gap-1 ${
                        isCompact ? "py-1 px-1.5 text-[10px] rounded-lg mb-1" : "py-2 px-3 text-xs rounded-xl mb-2"
                      } ${
                        isSelected
                          ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
                          <span>{lang === "KR" ? "담김" : "Đã chọn"}</span>
                        </>
                      ) : (
                        <>
                          <Plus className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
                          <span>{lang === "KR" ? "비교담기" : "So sánh"}</span>
                        </>
                      )}
                    </button>

                    {/* Coupang Button */}
                    <a
                      href={product.coupang_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleOutlinkClick(product.id, "coupang")}
                      className={`w-full font-bold text-white transition-all flex items-center justify-between shadow-sm ${
                        isCompact ? "py-1.5 px-2 rounded-lg text-[10px]" : !isNaverActive ? "py-3 px-4 rounded-xl text-sm" : "py-2.5 px-3 rounded-xl text-xs"
                      } ${
                        isCoupangCheaper
                          ? "bg-red-600 hover:bg-red-700 ring-2 ring-red-500/20"
                          : "bg-red-500/90 hover:bg-red-600"
                      }`}
                    >
                      <span className="flex items-center gap-1 truncate">
                        <Rocket className={isCompact ? "w-3 h-3 text-yellow-300" : "w-4 h-4 text-yellow-300"} />
                        <span>{isCompact ? "🚀 쿠팡" : isNaverActive ? "🚀 [쿠팡 로켓]" : (lang === "KR" ? "🚀 쿠팡 최저가 보러가기" : "🚀 Xem giá Coupang")}</span>
                      </span>
                      <span className="font-extrabold flex items-center gap-0.5">
                        {product.coupang_price.toLocaleString()}원
                        <ExternalLink className={isCompact ? "w-2.5 h-2.5 opacity-80" : "w-3.5 h-3.5 opacity-80"} />
                      </span>
                    </a>

                    {/* Naver Button (Only rendered if isNaverActive) */}
                    {isNaverActive && product.naver_price && (
                      <a
                        href={product.naver_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleOutlinkClick(product.id, "naver")}
                        className={`w-full font-bold text-white transition-all flex items-center justify-between shadow-sm ${
                          isCompact ? "py-1.5 px-2 rounded-lg text-[10px]" : "py-2.5 px-3 rounded-xl text-xs"
                        } ${
                          isNaverCheaper
                            ? "bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/20"
                            : "bg-emerald-600/90 hover:bg-emerald-700"
                        }`}
                      >
                        <span className="flex items-center gap-1 truncate">
                          <Gift className={isCompact ? "w-3 h-3 text-yellow-300" : "w-3.5 h-3.5 text-yellow-300"} />
                          <span>{isCompact ? "🟢 네이버" : "🟢 [네이버 최저가]"}</span>
                        </span>
                        <span className="font-extrabold flex items-center gap-0.5">
                          {product.naver_price.toLocaleString()}원
                          {product.naver_point_back && (
                            <span className="text-[10px] bg-white/20 px-1 rounded font-normal">
                              +{product.naver_point_back}p
                            </span>
                          )}
                          <ExternalLink className={isCompact ? "w-2.5 h-2.5 opacity-80" : "w-3 h-3 opacity-80"} />
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Comparison Tray */}
      {compareItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-lg text-white border-t border-gray-800 shadow-tray transition-all duration-300">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-extrabold text-red-400 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5" /> {lang === "KR" ? "비교 선택" : "So sánh"}
                </span>
                <span className="text-[11px] text-gray-400">
                  <strong className="text-white">{compareItems.length}</strong> / 3개
                </span>
              </div>

              {/* Thumbnails */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {compareItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative w-11 h-11 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-gray-700"
                  >
                    <Image
                      src={item.image_url}
                      alt={item.name_kr}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="44px"
                    />
                    <button
                      onClick={() => removeFromCompare(item.id)}
                      className="absolute top-0 right-0 bg-black/70 text-white w-4 h-4 rounded-bl flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setCompareItems([])}
                className="text-xs text-gray-400 hover:text-white px-2 py-2 underline underline-offset-2"
              >
                {lang === "KR" ? "비우기" : "Xóa"}
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className={`text-white text-xs sm:text-sm font-extrabold px-4 sm:px-5 py-2.5 rounded-xl shadow-glow hover:opacity-95 transition-all flex items-center gap-1.5 ${
                  showNaverProducts
                    ? "bg-gradient-to-r from-red-600 to-emerald-600"
                    : "bg-gradient-to-r from-red-600 to-rose-600"
                }`}
              >
                <span>{lang === "KR" ? `비교하기 (${compareItems.length}/3)` : `So sánh (${compareItems.length}/3)`}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Comparison Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-red-600" />
                  {showNaverProducts
                    ? (lang === "KR" ? "쿠팡 vs 네이버 가격 및 스펙 실시간 비교 표" : "Bảng so sánh Coupang vs Naver chi tiết")
                    : (lang === "KR" ? "쿠팡 상품 상세 스펙 & 가격 비교 표" : "Bảng so sánh chi tiết Coupang")}
                </h2>
                <p className="text-xs text-gray-500">
                  {showNaverProducts
                    ? (lang === "KR" ? "쿠팡 로켓배송 가격과 네이버 최저가/NPay 적립 혜택을 한눈에 비교합니다." : "So sánh chi tiết giá Coupang và Naver Pay.")
                    : (lang === "KR" ? "선택 상품의 한국어/베트남어 명칭 및 가격 트렌드를 비교합니다." : "So sánh chi tiết thông số sản phẩm.")}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Table Body */}
            <div className="p-4 sm:p-6 overflow-x-auto custom-scrollbar flex-1">
              <table className="w-full min-w-[550px] border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="p-3 bg-gray-50 w-36 font-bold text-gray-500 sticky left-0 z-10">
                      {lang === "KR" ? "비교 항목" : "Mục so sánh"}
                    </th>
                    {compareItems.map((item) => (
                      <th key={item.id} className="p-3 w-1/3 min-w-[170px] align-top">
                        <div className="relative aspect-square rounded-xl bg-gray-100 overflow-hidden mb-2 border border-gray-200">
                          <Image
                            src={item.image_url}
                            alt={item.name_kr}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="170px"
                          />
                        </div>
                        <h4 className="font-bold text-gray-900 text-xs line-clamp-1 leading-snug">
                          {item.name_kr}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-normal line-clamp-1">
                          🇻🇳 {item.name_vn}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Row: Coupang Price */}
                  <tr>
                    <td className="p-3 bg-red-50/70 font-bold text-red-900 sticky left-0 z-10">
                      🚀 쿠팡 로켓 가격
                    </td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 bg-red-50/20 font-extrabold text-red-600 text-base">
                        {item.coupang_price.toLocaleString()}원
                        {item.is_rocket && (
                          <span className="block text-[10px] text-red-500 font-medium">🚀 로켓배송</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Naver Price */}
                  {showNaverProducts && (
                    <tr>
                      <td className="p-3 bg-emerald-50/70 font-bold text-emerald-900 sticky left-0 z-10">
                        🟢 네이버 최저가
                      </td>
                      {compareItems.map((item) => (
                        <td key={item.id} className="p-3 bg-emerald-50/20 font-extrabold text-emerald-700 text-base">
                          {item.naver_price ? `${item.naver_price.toLocaleString()}원` : "판매 정보 없음"}
                          {item.naver_point_back && (
                            <span className="block text-[11px] text-emerald-600 font-semibold">
                              +{item.naver_point_back.toLocaleString()}p 적립
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Row: 30-Day Trend */}
                  <tr>
                    <td className="p-3 bg-amber-50/80 font-bold text-amber-900 sticky left-0 z-10">
                      최근 30일 가격 동향
                    </td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 bg-amber-50/30">
                        <div className="text-xs font-bold text-amber-900 mb-1">
                          {item.price_history_trend}
                        </div>
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          30일 최저: {item.lowest_price_30days.toLocaleString()}원
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Features */}
                  <tr>
                    <td className="p-3 bg-gray-50 font-bold text-gray-700 sticky left-0 z-10 align-top">
                      핵심 스펙 (KR / VN)
                    </td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 align-top">
                        <ul className="space-y-1 text-xs text-gray-700">
                          {item.features_kr.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span>
                                {feat} {item.features_vn[idx] ? <span className="text-gray-400 text-[11px]">({item.features_vn[idx]})</span> : null}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  {/* Row: CTA Buttons */}
                  <tr>
                    <td className="p-3 bg-gray-50 font-bold text-gray-700 sticky left-0 z-10">
                      쇼핑몰 구매 이동
                    </td>
                    {compareItems.map((item) => (
                      <td key={item.id} className="p-3 space-y-1.5">
                        <a
                          href={item.coupang_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleOutlinkClick(item.id, "coupang")}
                          className="w-full py-2.5 px-2 rounded-lg text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-1 shadow-sm text-center"
                        >
                          <span>🚀 쿠팡 구매</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {showNaverProducts && item.naver_link && (
                          <a
                            href={item.naver_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleOutlinkClick(item.id, "naver")}
                            className="w-full py-2 px-2 rounded-lg text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 shadow-sm text-center"
                          >
                            <span>🟢 네이버 구매</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-500 text-center">
              ※ 표시된 가격 및 스펙은 마켓 사정에 따라 실시간으로 변동될 수 있습니다. (Giá có thể thay đổi theo thời gian.)
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Footer Disclaimers */}
      <footer className="mt-16 bg-white border-t border-gray-200 py-8 px-4 text-center">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>공정거래위원회 지침 준수 고지 (Thông báo tuân thủ quy định)</span>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 max-w-2xl mx-auto space-y-1.5">
            {showNaverProducts ? (
              <>
                <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                  &quot;본 서비스는 쿠팡 파트너스 및 네이버 쇼핑 커머스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.&quot;
                </p>
                <p className="text-xs text-gray-600 font-medium leading-relaxed border-t border-gray-200/60 pt-1.5">
                  &quot;Bài viết/Trang web này là một phần hoạt động của Coupang Partners và Naver Commerce, chúng tôi có thể nhận được một khoản hoa hồng nhất định khi bạn mua hàng.&quot;
                </p>
              </>
            ) : (
              <>
                <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                  &quot;이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.&quot;
                </p>
                <p className="text-xs text-gray-600 font-medium leading-relaxed border-t border-gray-200/60 pt-1.5">
                  &quot;Bài viết này là một phần hoạt động của Coupang Partners, chúng tôi nhận được một khoản hoa hồng nhất định.&quot;
                </p>
              </>
            )}
          </div>

          <p className="text-[11px] text-gray-400">
            © 2026 CouPick Landing Demo (Phase 3.0 Supabase Integrated). All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
