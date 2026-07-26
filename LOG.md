# PickViet (픽비엣) 프로젝트 개발 작업 로그 (LOG.md)

- **마지막 업데이트 일시**: 2026-07-26 (세션 기록)
- **서비스명**: PickViet (픽비엣) - 한국 거주 베트남인을 위한 스마트 가격 비교 플랫폼
- **GitHub 저장소**: `weegoodojb/smart_store` (main 브랜치)
- **프레임워크 및 기술 스택**: Next.js 14 (App Router, TypeScript), Tailwind CSS, Lucide React, Supabase

---

## 1. 구현된 핵심 기능 및 대시보드 체계

### A. 유저 랜딩 데모 페이지 (`app/demo/page.tsx`, `app/page.tsx`)
- **실시간 Supabase DB 연동 (`ss_products`)**: 더미 데이터(`MOCK_PRODUCTS`) 완전 제거. DB 데이터만 실시간 노출 및 Empty State 깔끔 처리.
- **다국어 언어 전환 (KR 🇰🇷 / VN 🇻🇳)**: 상단 [한국어 | Tiếng Việt] 토글 클릭 시 실시간 번역 전환.
- **쿠팡 & 네이버 듀얼 제휴 노출**: 🚀 `[쿠팡 최저가 보러가기]` + 🟢 `[네이버 최저가 비교]` 듀얼 CTA.
- **3개 상품 실시간 비교 모달**: 가격, 30일 최저가 트렌드, 베트남어 스펙 세부 비교표.
- **동적 모바일 진열 레이아웃 (1열 / 2열 / 3열)**: Admin 설정 `mobile_grid_cols` 기반 가변 모바일 상품 카드 진열.

### B. 관리자 대시보드 (`app/admin/page.tsx`) & 스크랩 API (`/api/admin/auto-fill`)
- **쿠팡 파트너스 원클릭 즉시 등록 바**:
  - 상단 인라인 입력 바에서 쿠팡 단축 링크 입력 ➔ 메타데이터 스크랩 ➔ Supabase `ss_products` 즉시 저장.
- **3단계 스크랩 파이프라인 (`/api/admin/auto-fill/route.ts`)**:
  1. 단축 링크(`https://link.coupang.com/a/...`) 원본 URL 및 `productId` 리다이렉트 추적.
  2. 데스크톱 Chrome 헤더 기반 OpenGraph 태그 직접 파싱.
  3. 쿠팡 403 차단 시 검색 프록시(DuckDuckGo + Naver Shopping)를 통해 실물 이미지, 정확한 상품명, 판매가 자동 복원.
  4. 더미 예시 이미지(Unsplash 커피/쿠키 등) 대입 완전 제거.
- **수동 인라인 입력 폼 (Fallback & Manual Mode)**:
  - 스크랩 실패 시 프로세스가 차단되지 않고 `[상품명]`, `[쿠팡 판매가]`, `[이미지 URL]` 수동 입력 폼이 자동 노출되어 즉시 저장 가능.
  - `[✏️ 스크랩 없이 수동으로 직접 입력하기]` 토글 버튼 제공.
- **상품 정보 수정 모달 (Edit Modal)**:
  - `[상품 이미지 URL (image_url)]` 입력 필드가 추가되어 자유롭게 이미지 링크 변경 및 수정 가능.
- **외부 이미지 도메인 전면 허용 (`next.config.js`)**:
  - `unoptimized: true` 및 `hostname: '**'` 적용으로 쿠팡 CDN(`thumbnail.coupangcdn.com`, `thumbnail1.coupangcdn.com`) 및 외부 이미지 100% 정상 출력.

---

## 2. 세션 푸시 이력 (GitHub `main`)

| 커밋 해시 | 커밋 메시지 | 주요 내용 |
| :--- | :--- | :--- |
| `68a28b8` | `fix: clean up handleFormSubmit and remove unused auto fill logic` | Vercel 빌드 syntax error 수정 및 함수 정돈 |
| `248c1e2` | `fix: remove raw backticks from JSX text in app/admin/page.tsx` | JSX 텍스트 내 원시 백틱 이스케이프 수정 |
| `ae7ecce` | `fix: resolve unclosed JSX tags and handleOpenAddModal reference` | 누락된 JSX `</div>` 태그 및 레퍼런스 정돈 |
| `0081829` | `feat: enhance Coupang short link scraper pipeline and remove dummy Unsplash fallbacks` | 3단계 쿠팡 스크랩 파이프라인 구축 & 더미 데이터 대입 제거 |
| `2bedb8c` | `feat: add manual inline input fallback for product creation when auto scrape fails` | 스크랩 실패 시 수동 인라인 입력 폼 자동 노출 및 저장 |
| `5c40c15` | `fix: add image_url input to Edit Modal and allow all remote image domains in next.config.js` | 수정 모달 내 `image_url` 필드 신설 및 쿠팡 CDN 이미지 차단 해제 |

---

## 3. 환경변수 ([.env.local](file:///e:/code/coopang/.env.local))
```env
NEXT_PUBLIC_SUPABASE_URL=https://dhurxwwfzyyfufswyltn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5syLiQrKtutpuej94j7vjw_7L1OdrW6
NEXT_PUBLIC_ADMIN_PASSWORD=admin1234
```

---

## 4. 로컬 테스트 및 실행 명령어

### 로컬 실행
```bash
npm run dev
```
- **유저 페이지**: `http://localhost:3000/demo`
- **관리자 페이지**: `http://localhost:3000/admin` (비밀번호: `admin1234`)

### 빌드 검증 및 푸시
```bash
npm run build
git add .
git commit -m "feat: project update"
git push origin main
```
