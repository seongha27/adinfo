const fs = require("fs");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function insertKeywordsFromFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const keywords = content
    .split("\n")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  let success = 0,
    skipped = 0;

  for (const keyword of keywords) {
    try {
      await conn.execute("INSERT IGNORE INTO keywords (keyword) VALUES (?)", [
        keyword,
      ]);
      success++;
    } catch (err) {
      console.error(`❌ 삽입 실패: ${keyword} → ${err.message}`);
      skipped++;
    }
  }

  await conn.end();
  console.log(
    `✅ 총 ${keywords.length}개 중 ${success}개 삽입, ${skipped}개 건너뜸`
  );
}

// 🔁 실행
insertKeywordsFromFile("generated_keywords.txt");
