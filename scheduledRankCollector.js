const axios = require("axios");
const mysql = require("mysql2/promise");
const schedule = require("node-schedule");
require("dotenv").config();

// 🔹 DB에서 수집 대상 키워드 목록 가져오기
async function getKeywordsFromDB() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await conn.execute(
    "SELECT keyword FROM keywords WHERE is_active = TRUE"
  );
  await conn.end();
  return rows.map((r) => r.keyword);
}

// 🔹 특정 키워드의 순위 수집 및 이전 데이터 삭제
async function getNaverRankAndSave(keyword) {
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

  const now = new Date();
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // 🔥 기존 snapshot 삭제 (동일 키워드에 대해)
  await conn.execute(
    `DELETE FROM place_ranks WHERE keyword = ? AND snapshot < CURDATE()`,
    [keyword]
  );

  let rank = 0;

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
        await conn.execute(
          `INSERT INTO place_ranks (keyword, place_id, rank, place_name, snapshot, source)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [keyword, item.id, rank, item.name, now, "DB"]
        );
      }

      await new Promise((r) => setTimeout(r, 200)); // 0.2초 대기
    } catch (err) {
      console.error(`❌ ${keyword} (${start}~):`, err.message);
      break;
    }
  }

  await conn.end();
  console.log(`✅ ${keyword} 수집 완료`);
}

// 🔁 전체 수집 실행
async function runFullCollection() {
  const keywords = await getKeywordsFromDB();
  console.log(`🔁 총 ${keywords.length}개 키워드 수집 시작...`);
  for (const keyword of keywords) {
    console.log(`🔍 ${keyword} 수집 시작`);
    await getNaverRankAndSave(keyword);
  }
  console.log(`✅ 전체 수집 종료: ${new Date().toLocaleString()}`);
}

// ⏰ 매일 09:00, 15:00 자동 실행
schedule.scheduleJob("0 9 * * *", runFullCollection); // 오전 09시
schedule.scheduleJob("0 15 * * *", runFullCollection); // 오후 15시

// 수동 실행도 가능
// runFullCollection();
