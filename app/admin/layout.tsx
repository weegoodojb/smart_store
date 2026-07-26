import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "쿠픽 관리자 센터 (Admin)",
  description: "상품 관리 및 쿠팡 파트너스 링크 히스토리 관리자 프레임",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col sm:flex-row">
      {/* Admin Sidebar Navigation Frame */}
      <aside className="w-full sm:w-64 bg-gray-900 text-gray-300 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-sm">
              CP
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">쿠픽 Admin</h2>
              <p className="text-[10px] text-gray-400">파트너스 센터 v1.0</p>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <a
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-red-600 text-white shadow-sm"
            >
              📊 대시보드 개요
            </a>
            <a
              href="#products"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            >
              📦 상품 등록 & 관리
            </a>
            <a
              href="#history"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            >
              🔗 파트너스 아웃링크 히스토리
            </a>
            <a
              href="#analytics"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            >
              📈 유입 통계 (SNS)
            </a>
          </nav>
        </div>

        <div className="pt-6 border-t border-gray-800 text-[11px] text-gray-500">
          <a href="/demo" className="text-red-400 font-bold hover:underline flex items-center gap-1">
            ← 데모 메인으로 이동
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
