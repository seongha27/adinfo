const axios = require("axios");
const pool = require("../models/db");
const { extractPlaceId } = require("../utils/extractPlaceId");

// 검색 기록 저장 (userId를 토큰에서 추출)
async function handleRankSubmit(req, res) {
  const { keyword, url } = req.body;
  const userId = req.user.userId;
  console.log("[서버] 받은 userId:", userId);
  const placeId = extractPlaceId(url);
  if (!keyword || !placeId || !userId)
    return res.status(400).json({ error: "유효하지 않은 입력입니다." });

  const snapshot = new Date();
  const headers = {
    "content-type": "application/json",
    "x-wtm-graphql":
      "eyJhcmciOiLqtJHrqoXsmYHsi7EiLCJ0eXBlIjoicGxhY2UiLCJzb3VyY2UiOiJzZWFyY2gifQ",
    referer: `https://m.search.naver.com/search.naver?query=${encodeURIComponent(
      keyword
    )}`,
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16 Safari/605.1.15",
  };

  let rank = 0;
  try {
    for (let start = 1; start <= 300; start += 25) {
      const payload = [
        {
          operationName: "getAdditionalPlaces",
          variables: {
            input: {
              query: keyword,
              display: 25,
              start,
              x: "126.9783882",
              y: "37.5666103",
            },
          },
          query: `query getAdditionalPlaces($input: PlacesInput) {
            businesses: nxPlaces(input: $input) {
              items {  
                id
                name
                visitorReviewCount
                blogCafeReviewCount  
              }
            }
          }`,
        },
      ];
      const response = await axios.post(
        "https://nx-api.place.naver.com/graphql",
        payload,
        { headers }
      );
      if (response.data?.[0]?.errors) {
        console.log("======= [네이버 GraphQL 에러 상세] =======");
        for (const errObj of response.data[0].errors) {
          console.log("GraphQL Error message:", errObj.message);
          if (errObj.extensions) console.log("extensions:", errObj.extensions);
        }
        console.log("========================================");
      }
      const items = response.data?.[0]?.data?.businesses?.items || [];
      if (items.length === 0) break;

      for (const item of items) {
        rank++;
        if (item.id == placeId) {
          console.log(
            "[INSERT]",
            keyword,
            placeId,
            rank,
            item.name,
            snapshot,
            "REALTIME",
            userId
          );

          const visitorReviewCount = Number(item.visitorReviewCount) || 0;
          const blogCafeReviewCount = Number(item.blogCafeReviewCount) || 0;

          await pool.execute(
            `INSERT INTO place_ranks (keyword, place_id, \`rank\`, place_name, snapshot, source, user_id, visitor_review_count, blog_review_count)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              keyword,
              placeId,
              rank,
              item.name,
              snapshot,
              "REALTIME",
              userId,
              visitorReviewCount,
              blogCafeReviewCount,
            ]
          );
          console.log("👉 [서버] found:true 응답 보냄", {
            rank,
            place_name: item.name,
            visitorReviewCount,
            blogReviewCount: blogCafeReviewCount,
          });
          return res.json({
            found: true,
            rank,
            place_name: item.name,
            visitorReviewCount,
            blogReviewCount: blogCafeReviewCount,
          });
        }
      }
    }

    return res.json({ found: false, message: "300위 밖 혹은 찾을 수 없음" });
  } catch (err) {
    console.error("[서버 에러]", err.response?.data || err.message, err.stack);
    return res.status(500).json({ error: "수집 실패", message: err.message });
  }
}

// 사용자별 검색 기록 조회
async function getSearchHistory(req, res) {
  const userId = req.user.userId;
  try {
    const [rows] = await pool.execute(
      `SELECT id, keyword, place_id,  \`rank\`, place_name, snapshot, source, visitor_review_count, blog_review_count
       FROM place_ranks WHERE user_id = ? ORDER BY snapshot DESC LIMIT 100`,
      [userId]
    );
    res.json({ success: true, history: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
// 업체 삭제 (by id, 사용자 인증 포함)
async function deleteRank(req, res) {
  const userId = req.user.userId;
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, message: "ID 필요" });

  try {
    // user_id 체크: 본인 데이터만 삭제 가능
    const [rows] = await pool.execute(
      "DELETE FROM place_ranks WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (rows.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "삭제할 데이터 없음" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { handleRankSubmit, getSearchHistory, deleteRank };
