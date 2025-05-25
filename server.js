const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
app.use(express.static("public"));
app.use(express.json());

// 라우터 등록
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/rank", require("./routes/rankRoutes"));

const PORT = 3000;
const HOST = "0.0.0.0"; // 중요!

app.listen(PORT, HOST, () => {
  console.log(`✅ 서버 실행 중: http://${HOST}:${PORT}`);
});
