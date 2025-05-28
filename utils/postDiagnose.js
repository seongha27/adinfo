const axios = require("axios");
const cheerio = require("cheerio");

// 1. URL을 모바일 주소로 변환
function toMobileUrl(url) {
  return url.replace("://blog.naver.com/", "://m.blog.naver.com/");
}

// 2. 블로그 본문 정보 수집
async function getBlogMeta(blogUrl) {
  const mUrl = toMobileUrl(blogUrl);

  // 아이디 추출
  const blogId = blogUrl.match(/blog\.naver\.com\/([^/]+)/)?.[1] || "";

  // 본문 크롤링
  const res = await axios.get(mUrl, {
    headers: { "user-agent": "Mozilla/5.0" },
  });
  const $ = cheerio.load(res.data);

  // 3. 제목 추출
  let title = $("h3.se_textarea").first().text().trim();
  if (!title) {
    // 보조: meta태그 og:title
    title = $('meta[property="og:title"]').attr("content") || "";
  }

  // 4. 닉네임 추출 (지정 셀렉터)
  let nickname = $("div.blog2_container span.writer span.nick a")
    .first()
    .text()
    .trim();

  // 5. 발행일 추출 (여러 버전 대응)
  let publishedDate =
    $(".se_publishDate").first().text().trim() ||
    $(".blog_date").first().text().trim() ||
    $(".date").first().text().trim();

  // 6. 글자수 (지정 영역)
  let contentText = $(".se-main-container").text().trim();
  let contentCnt = contentText.length;

  // 7. 이미지수 (본문 내 img)
  let imageCnt = $(".se-main-container img").length;

  return { blogId, title, nickname, publishedDate, contentCnt, imageCnt, mUrl };
}

// 8. 노출/미노출 판별 함수
async function checkExposure(title, blogId) {
  // 네이버 모바일에서 제목 검색 (자연검색)
  const searchUrl = `https://m.search.naver.com/search.naver?where=m_blog&sm=mtb_jum&query=${encodeURIComponent(
    title
  )}`;

  const res = await axios.get(searchUrl, {
    headers: { "user-agent": "Mozilla/5.0" },
  });
  const $ = cheerio.load(res.data);

  // 검색결과에서 아이디 포함된 블로그 주소 찾기
  let exposed = false;
  $("a.name").each((i, el) => {
    const href = $(el).attr("href") || "";
    if (href.includes(blogId)) {
      exposed = true;
      return false; // break loop
    }
  });
  return exposed ? "노출" : "미노출";
}

// 9. 전체 실행 함수
async function diagnose(blogUrl) {
  const meta = await getBlogMeta(blogUrl);

  if (!meta.title) {
    console.log("제목 추출 실패");
    return;
  }

  // 노출 여부 확인
  const exposure = await checkExposure(meta.title, meta.blogId);
  return {
    url: blogUrl,
    blogId: meta.blogId,
    nickname: meta.nickname,
    publishedDate: meta.publishedDate,
    title: meta.title,
    contentCnt: meta.contentCnt,
    imageCnt: meta.imageCnt,
    exposure: exposure,
  };
}

// 반드시 exports 해주세요!
module.exports = { diagnose };
