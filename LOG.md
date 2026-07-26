# PickViet (픽비엣) 프로젝트 개발 작업 로그 (LOG.md)

- **마지막 업데이트 일시**: 2026-07-26
- **서비스명**: PickViet (픽비엣) - 한국 거주 베트남인을 위한 스마트 가격 비교 플랫폼
- **GitHub 저장소**: `weegoodojb/smart_store` (main 브랜치)
- **프레임워크 및 기술 스택**: Next.js (App Router, TypeScript), Tailwind CSS, Lucide React, Supabase

---

## 1. 구현된 핵심 기능 및 페이지 구조

### A. 유저 랜딩 데모 페이지 (`app/demo/page.tsx`, `app/page.tsx`)
- **실시간 Supabase DB 연동 (`ss_products`)**: 하드코딩된 더미 데이터(`MOCK_PRODUCTS`) 완전 제거. 실제 저장된 상품만 실시간 Fetch 및 Empty State 처리.
- **다국어 언어 전환 (KR 🇰🇷 / VN 🇻🇳)**: 상단 [한국어 | Tiếng Việt] 토글 클릭 시 실시간 대응.
- **쿠팡 & 네이버 듀얼 제휴 노출**: 🚀 `[쿠팡 로켓배송]` + 🟢 `[네이버 최저가]` 듀얼 CTA 버튼.
- **3개 상품 실시간 비교 모달**: 가격, 30일 최저가 트렌드, 베트남어 스펙 세부 비교표.
- **동적 모바일 진열 레이아웃 (1열 / 2열 / 3열)**: Admin 설정 `mobile_grid_cols` 값 기반 가변 레이아웃.

### B. 관리자 대시보드 (`app/admin/page.tsx`) & API (`/api/admin/auto-fill`)
- **원클릭 인라인 상품 등록 바 (NO Popup Modal)**:
  - 대시보드 상단 인라인 바에서 쿠팡 단축 링크 입력 + 카테고리 선택 후 `[상품 등록하기]` 버튼 한 번으로 오픈그래프 스크랩 ➔ Supabase `ss_products` 즉시 저장.
- **실시간 상품 관리 센터**: Supabase `ss_products` 실시간 연동 (수정, 삭제 Confirm 모달).
- **네이버 비교 On/Off 전역 스위치**: 유저 화면 듀얼 모드 ↔ 쿠팡 단독 모드 원터치 제어 (`ss_config`).
- **📱 모바일 상품 진열 레이아웃 설정**: 1열 모드 / 2열 모드 / 3열 모드 세그먼트 버튼 컨트롤 (`ss_config: mobile_grid_cols`).

---

## 2. 환경변수 ([.env.local](file:///e:/code/coopang/.env.local))
```env
NEXT_PUBLIC_SUPABASE_URL=https://dhurxwwfzyyfufswyltn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5syLiQrKtutpuej94j7vjw_7L1OdrW6
NEXT_PUBLIC_ADMIN_PASSWORD=admin1234
```

---

## 3. 실행 및 배포 명령어 요약

### 로컬 실행
```bash
npm run dev
```
- **유저 페이지**: `http://localhost:3000/demo`
- **관리자 페이지**: `http://localhost:3000/admin` (비밀번호: `admin1234`)

### 배포 푸시
```bash
git add .
git commit -m "feat: completely remove mock products and fetch only live Supabase ss_products data"
git push origin main
```
