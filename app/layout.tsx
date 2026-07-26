import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "쿠팡 파트너스 추천 & 상품 비교 - 최저가 검색 모바일 웹앱",
  description: "트렌드 최저가 상품 추천 및 최대 3개 제품 실시간 스펙 가격 비교 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased font-sans bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
