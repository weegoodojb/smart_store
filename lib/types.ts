export type CategoryType = 
  | "전체" 
  | "🇻🇳 베트남 식자재/생필품" 
  | "🎁 기념일/뗏(Tết) 선물" 
  | "💄 K-뷰티/건강" 
  | "家電 가전/디지털";

export interface Product {
  id: string;
  name_kr: string;                // 한국어 상품명
  name_vn: string;                // 베트남어 상품명 (직관적 설명)
  
  // 쿠팡 제휴 정보
  coupang_price: number;          // 쿠팡 가격
  coupang_link: string;           // 쿠팡 파트너스 제휴 링크
  is_rocket: boolean;             // 로켓배송 여부
  
  // 네이버 제휴 정보
  naver_price?: number;           // 네이버 가격
  naver_link?: string;            // 네이버 제휴 링크
  naver_point_back?: number;      // 네이버페이 적립 포인트금액
  
  // 가격 동향 및 히스토리
  lowest_price_30days: number;    // 30일 최저가
  price_history_trend?: string;   // 가격 트렌드 (예: "지난달 대비 12% 할인", "역대 최저가")
  
  // 특징 및 카테고리
  features_kr: string[];          // 한국어 특징 태그
  features_vn: string[];          // 베트남어 특징 태그
  category: CategoryType;         // 카테고리
  image_url: string;              // 상품 이미지 URL
  
  // 옵션 뱃지 및 리뷰
  badge?: string;
  original_price?: number;
  discount_rate?: number;
  rating?: number;
  review_count?: number;
}
