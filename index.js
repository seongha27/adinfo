// index.js
const axios = require("axios");
const mysql = require("mysql2/promise");

const keywords = ["광명왁싱", "구월동네일", "청라왁싱"]; // 테스트용 키워드 배열

async function getNaverRank(keyword) {
  const headers = {
    "content-type": "application/json",
    "x-wtm-graphql":
      "eyJhcmciOiLqtJHrqoXsmYHsi7EiLCJ0eXBlIjoicGxhY2UiLCJzb3VyY2UiOiJzZWFyY2gifQ",
    referer: `https://m.search.naver.com/search.naver?query=${encodeURIComponent(
      keyword
    )}`,
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15",
  };

  let rank = 0;
  const now = new Date();

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
            items { id name }
          }
        }`,
      },
    ];

    try {
      const res = await axios.post(
        "https://nx-api.place.naver.com/graphql",
        payload,
        { headers }
      );
      const items = res.data?.[0]?.data?.businesses?.items || [];
      if (items.length === 0) break;

      for (const item of items) {
        rank++;
        await saveToDB(keyword, item.id, rank, item.name, now);
      }

      await new Promise((r) => setTimeout(r, 300)); // 차단 방지 대기
    } catch (err) {
      console.error(`❌ ${keyword} → ${start}부터 에러:`, err.message);
      break;
    }
  }
}

async function saveToDB(keyword, placeId, rank, name, timestamp) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await conn.execute(
    `INSERT INTO place_ranks (keyword, place_id, rank, place_name, snapshot, source)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [keyword, placeId, rank, name, timestamp, "DB"]
  );
  await conn.end();
}

// 전체 실행
(async () => {
  for (const keyword of keywords) {
    console.log(`🔍 ${keyword} 수집 시작`);
    await getNaverRank(keyword);
    console.log(`✅ ${keyword} 수집 완료`);
  }
})();
