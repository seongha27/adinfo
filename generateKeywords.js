const fs = require("fs");

const regions = [
  "강남",
  "서초",
  "송파",
  "잠실",
  "홍대",
  "신촌",
  "건대",
  "성수",
  "청라",
  "구월",
  "인천",
  "수원",
  "분당",
  "일산",
  "의정부",
  "광명",
  "부천",
  "부산",
  "대구",
  "대전",
  "광주",
  "울산",
  "제주",
];

const categories = [
  "왁싱",
  "네일",
  "속눈썹",
  "피부과",
  "마사지",
  "한의원",
  "치과",
  "헤어",
  "스킨케어",
  "타투",
  "필라테스",
  "PT",
  "헬스",
  "성형외과",
];

const keywords = [];

for (const region of regions) {
  for (const category of categories) {
    keywords.push(`${region}${category}`);
  }
}

fs.writeFileSync("generated_keywords.txt", keywords.join("\n"), "utf-8");
console.log(
  `✅ 총 ${keywords.length}개 키워드 생성 완료! (generated_keywords.txt에 저장됨)`
);
