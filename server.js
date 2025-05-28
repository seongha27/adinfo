// server.js
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

// 🔥 API 라우터 연결
const diagnoseRoutes = require("./routes/diagnoseRoutes");
const userRoutes = require("./routes/userRoutes");
const rankRoutes = require("./routes/rankRoutes");

// 환경변수 로드
dotenv.config();

// Express 앱 생성
const app = express();
app.use(express.json());

// 요청 로그 미들웨어
app.use((req, res, next) => {
  console.log("[요청]", req.method, req.url);
  next();
});

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "public")));

// API 경로 연결
app.use("/api/diagnose", diagnoseRoutes);
app.use("/api/user", userRoutes);
app.use("/api/rank", rankRoutes);

// 🔥 크롤러(index.js) 실행

// 서버 실행
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`✅ 서버 실행 중: http://${HOST}:${PORT}`);
});
