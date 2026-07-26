import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coupang_url } = body;

    if (!coupang_url || typeof coupang_url !== "string") {
      return NextResponse.json(
        { success: false, error: "쿠팡 파트너스 단축 링크 URL을 입력해 주세요." },
        { status: 400 }
      );
    }

    let html = "";
    try {
      const res = await fetch(coupang_url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });

      if (res.ok) {
        html = await res.text();
      }
    } catch (err) {
      console.warn("Coupang metadata fetch error:", err);
    }

    // Extract OpenGraph & Meta Tags (Pure OpenGraph Scraping, NO fake AI data)
    let name_kr = extractMetaTag(html, "og:title") || extractTitle(html) || "";
    let image_url = extractMetaTag(html, "og:image") || "";
    let coupang_price = extractPrice(html) || 0;
    const is_rocket = html.includes("로켓배송") || html.includes("rocket");

    // Clean title
    if (name_kr) {
      name_kr = name_kr.replace(/ - 쿠팡!| \| 쿠팡!| : 쿠팡!/g, "").trim();
    }

    return NextResponse.json({
      success: true,
      data: {
        name_kr,
        name_vn: "", // Optional, left empty for admin choice
        category: guessCategory(name_kr),
        coupang_price,
        naver_price: undefined, // Optional, left empty
        coupang_link: coupang_url,
        naver_link: "", // Optional, left empty
        naver_point_back: undefined,
        image_url,
        lowest_price_30days: coupang_price || undefined,
        price_history_trend: "", // Optional, left empty
        badge: "", // Optional, left empty
        is_rocket,
        features_kr: [],
        features_vn: [],
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json(
      { success: false, error: `스크랩 실패: ${errorMsg}` },
      { status: 500 }
    );
  }
}

// Helpers for OpenGraph metadata parsing
function extractMetaTag(html: string, property: string): string | null {
  const reg1 = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
  const match1 = html.match(reg1);
  if (match1 && match1[1]) return match1[1];

  const reg2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, "i");
  const match2 = html.match(reg2);
  if (match2 && match2[1]) return match2[1];

  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1] : null;
}

function extractPrice(html: string): number | null {
  const priceMeta = extractMetaTag(html, "product:price:amount") || extractMetaTag(html, "og:price:amount");
  if (priceMeta) {
    const p = parseInt(priceMeta.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(p) && p > 0) return p;
  }

  const match = html.match(/class="[^"]*total-price[^"]*"[^>]*>\s*([0-9,]+)/i) || html.match(/([1-9][0-9]{2,3},[0-9]{3})\s*원/);
  if (match && match[1]) {
    const p = parseInt(match[1].replace(/,/g, ""), 10);
    if (!isNaN(p) && p > 0) return p;
  }

  return null;
}

function guessCategory(name: string): string {
  if (/커피|G7|쌀국수|라면|김치|소스|식자재|차|음료/i.test(name)) {
    return "🇻🇳 베트남 식자재/생필품";
  }
  if (/선물|뗏|Tết|인삼|홍삼|건강|비타민/i.test(name)) {
    return "🎁 기념일/뗏(Tết) 선물";
  }
  if (/화장품|스킨|마스크|뷰티|크림|세럼/i.test(name)) {
    return "💄 K-뷰티/건강";
  }
  if (/가전|전기|노트북|이어폰|스피커|디지털/i.test(name)) {
    return "家電 가전/디지털";
  }
  return "🇻🇳 베트남 식자재/생필품";
}
