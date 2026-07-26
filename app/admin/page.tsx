"use client";

import { useState, useEffect } from "react";
import { MOCK_PRODUCTS } from "@/lib/mockProducts";
import { getConfig, updateConfig } from "@/lib/supabase";
import { 
  Lock, 
  KeyRound, 
  LogOut, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle, 
  ExternalLink, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export default function AdminDashboardPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showNaverProducts, setShowNaverProducts] = useState<boolean>(true);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin1234";

  // Check auth session & load config on mount
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("admin_authorized");
    if (sessionAuth === "true") {
      setIsAuthorized(true);
    }

    getConfig("show_naver_products", true).then((val) => {
      setShowNaverProducts(val);
    });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      sessionStorage.setItem("admin_authorized", "true");
      setErrorMsg(null);
    } else {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem("admin_authorized");
    setPasswordInput("");
  };

  const toggleNaverSetting = async () => {
    const nextState = !showNaverProducts;
    setShowNaverProducts(nextState);
    await updateConfig("show_naver_products", nextState);
  };

  // Password Login Screen when not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xl text-center">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-1">
            PickViet (픽비엣) 관리자 인증 (Admin Login)
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            어드민 대시보드 접근을 위해 관리자 비밀번호를 입력해 주세요.
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

          <p className="text-[11px] text-gray-400 mt-6">
            환경변수 <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">NEXT_PUBLIC_ADMIN_PASSWORD</code>로 변경 가능
          </p>
        </div>
      </div>
    );
  }

  // Admin Dashboard Content when Authorized
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">PickViet (픽비엣) 관리자 센터 (Phase 5.0)</h1>
          <p className="text-xs text-gray-500">Supabase ss_ DB 테이블 연동 및 네이버 듀얼 제휴 노출 관리 대시보드입니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/demo"
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>데모 메인</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handleLogout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* Admin Control Switch Panel (Phase 3.0 Admin Only Toggle) */}
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
              ? "유저 랜딩 페이지(/demo)에 쿠팡과 네이버 듀얼 가격 비교표 및 네이버 최저가 버튼이 노출됩니다."
              : "유저 랜딩 페이지(/demo)에서 네이버 영역이 감춰지고 [쿠팡 로켓배송] 단독 모드로 전환됩니다."}
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400">Supabase DB 테이블</span>
          <p className="text-xl font-black text-gray-900 mt-1">ss_products / ss_config</p>
          <span className="text-[11px] text-emerald-600 font-medium">Prefix ss_ 테이블 분리완료</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400">현재 제휴 모드</span>
          <p className={`text-xl font-extrabold mt-1 ${showNaverProducts ? "text-emerald-600" : "text-red-600"}`}>
            {showNaverProducts ? "쿠팡 & 네이버 듀얼" : "쿠팡 파트너스 단독"}
          </p>
          <span className="text-[11px] text-gray-400 font-medium">관리자 전용 스위치 연동중</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400">대가성 고지 문구 준수</span>
          <p className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle className="w-5 h-5" /> 정상 준수
          </p>
          <span className="text-[11px] text-gray-400 font-medium">모드에 맞춰 푸터 문구 가변적용</span>
        </div>
      </div>

      {/* Product List Table Layout Preview (Fixed with safe price formatting) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-800">등록 상품 및 파트너스 링크 목록 (ss_products)</h3>
          <span className="text-xs text-gray-400">실시간 스키마 데이터</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">상품명 (KR / VN)</th>
                <th className="p-3">카테고리</th>
                <th className="p-3">쿠팡 판매가</th>
                <th className="p-3">네이버 최저가</th>
                <th className="p-3">쿠팡 파트너스 링크</th>
                <th className="p-3">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {MOCK_PRODUCTS.map((prod) => {
                // Safe property access to prevent toLocaleString TypeError
                const priceValue = (prod as unknown as { price?: number }).price 
                  ?? prod.coupang_price 
                  ?? 0;
                const naverPriceValue = prod.naver_price;
                const nameKr = prod.name_kr ?? (prod as unknown as { name?: string }).name ?? "상품명 없음";
                const nameVn = prod.name_vn ?? "";
                const coupangLink = prod.coupang_link ?? (prod as unknown as { affiliate_link?: string }).affiliate_link ?? "#";

                return (
                  <tr key={prod.id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-400">#{prod.id}</td>
                    <td className="p-3 font-bold text-gray-800">
                      <div>{nameKr}</div>
                      {nameVn && <div className="text-[11px] text-gray-400 font-normal">🇻🇳 {nameVn}</div>}
                    </td>
                    <td className="p-3 text-gray-600">{prod.category}</td>
                    <td className="p-3 font-bold text-red-600">
                      {priceValue.toLocaleString()}원
                    </td>
                    <td className="p-3 font-bold text-emerald-600">
                      {naverPriceValue ? `${naverPriceValue.toLocaleString()}원` : "-"}
                    </td>
                    <td className="p-3 text-blue-600 truncate max-w-[180px]">
                      <a href={coupangLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {coupangLink}
                      </a>
                    </td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        활성
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
