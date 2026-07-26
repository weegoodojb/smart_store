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

    let name_kr = "";
    let image_url = "";
    let coupang_price = 0;
    let is_rocket = true;
    let targetUrl = coupang_url.trim();
    let productId = "";

    // 1. Follow short URL redirect to extract target URL and Product ID
    try {
      const res1 = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "manual",
      });

      if (res1.headers.get("location")) {
        targetUrl = res1.headers.get("location") || targetUrl;
      }
    } catch (err) {
      console.warn("Short URL redirect resolution warning:", err);
    }

    const pMatch = targetUrl.match(/products\/([0-9]+)/);
    if (pMatch && pMatch[1]) {
      productId = pMatch[1];
    }

    // 2. Direct Fetch Attempt on target URL
    try {
      const res2 = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9",
        },
      });

      if (res2.ok) {
        const html = await res2.text();
        name_kr = extractMetaTag(html, "og:title") || extractTitle(html) || "";
        image_url = extractMetaTag(html, "og:image") || "";
        coupang_price = extractPrice(html) || 0;
        is_rocket = html.includes("로켓배송") || html.includes("rocket");
      }
    } catch (err) {
      console.warn("Direct fetch warning:", err);
    }

    // Clean name_kr if obtained directly
    if (name_kr) {
      name_kr = cleanTitle(name_kr);
    }

    // 3. Search Proxy Fallback (DuckDuckGo for Title) if title is missing
    if (!name_kr && productId) {
      try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:coupang.com ${productId}`)}`;
        const resDdg = await fetch(ddgUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          },
        });
        if (resDdg.ok) {
          const htmlDdg = await resDdg.text();
          const titleMatches = [...htmlDdg.matchAll(/class="result__title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)/gi)];
          if (titleMatches.length > 0 && titleMatches[0][1]) {
            name_kr = cleanTitle(titleMatches[0][1].trim());
          }
        }
      } catch (err) {
        console.warn("DuckDuckGo title fallback warning:", err);
      }
    }

    // 4. Naver Mobile Search Proxy for Image & Price if missing
    if (name_kr && (!image_url || coupang_price === 0)) {
      try {
        const naverUrl = `https://m.search.naver.com/search.naver?where=m_shopping&query=${encodeURIComponent(name_kr)}`;
        const resN = await fetch(naverUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9",
          },
        });
        if (resN.ok) {
          const htmlN = await resN.text();

          // Extract Image
          if (!image_url) {
            const imgMatches = [...htmlN.matchAll(/https:\/\/[^"'\s]+\.(?:jpg|png|webp)/gi)].map((m) => m[0]);
            const candidateImg = imgMatches.find(
              (u) => u.includes("shopping-phinf.pstatic.net") || u.includes("phinf") || u.includes("coupangcdn")
            );
            if (candidateImg) {
              image_url = candidateImg;
            }
          }

          // Extract Price
          if (coupang_price === 0) {
            const prices = [...htmlN.matchAll(/([1-9][0-9]{0,2}(?:,[0-9]{3})+)\s*원/g)]
              .map((m) => parseInt(m[1].replace(/,/g, ""), 10))
              .filter((p) => p >= 3500);

            if (prices.length > 0) {
              coupang_price = prices[0];
            }
          }
        }
      } catch (err) {
        console.warn("Naver image/price fallback warning:", err);
      }
    }

    // Normalize image URL
    if (image_url.startsWith("//")) {
      image_url = "https:" + image_url;
    }

    // 5. Strict Verification: NO Unsplash dummy images allowed!
    if (!name_kr || !image_url) {
      return NextResponse.json(
        {
          success: false,
          error: "쿠팡 파트너스 상품 정보(상품명/이미지)를 자동으로 수집하지 못했습니다. 단축 링크를 확인해 주세요.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name_kr,
        name_vn: "", // Optional, defaults to name_kr on display if empty
        category: guessCategory(name_kr),
        coupang_price: coupang_price || 9900,
        naver_price: undefined,
        coupang_link: coupang_url.trim(),
        naver_link: "",
        naver_point_back: undefined,
        image_url,
        lowest_price_30days: coupang_price || 9900,
        price_history_trend: "",
        badge: "",
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

// OpenGraph & Meta tag extraction helpers
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

  const match =
    html.match(/class="[^"]*total-price[^"]*"[^>]*>\s*([0-9,]+)/i) ||
    html.match(/([1-9][0-9]{2,3},[0-9]{3})\s*원/);

  if (match && match[1]) {
    const p = parseInt(match[1].replace(/,/g, ""), 10);
    if (!isNaN(p) && p > 0) return p;
  }

  return null;
}

function cleanTitle(title: string): string {
  return title
    .replace(/ - 쿠팡!| \| 쿠팡!| : 쿠팡!/g, "")
    .replace(/ - [^-]+ \| 쿠팡$/g, "")
    .trim();
}

function guessCategory(name: string): string {
  if (/커피|G7|쌀국수|라면|김치|소스|식자재|차|음료|하오하오/i.test(name)) {
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
