const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const diagnoseRoutes = require("./routes/diagnoseRoutes");

dotenv.config();

const app = express();
app.use(express.json());

// 모든 요청 로그 미들웨어 (최상단!)
app.use((req, res, next) => {
  console.log("[요청]", req.method, req.url);
  next();
});

app.use(express.static("public"));
app.use("/api/diagnose", diagnoseRoutes);
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/rank", require("./routes/rankRoutes"));

const PORT = 3000;
const HOST = "0.0.0.0"; // 중요!

app.listen(PORT, HOST, () => {
  console.log(`✅ 서버 실행 중: http://${HOST}:${PORT}`);
});
