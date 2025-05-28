const pool = require("../models/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// 회원가입
async function signup(req, res) {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({ success: false, message: "아이디/비밀번호 필요" });
  const hashed = await bcrypt.hash(password, 10);
  try {
    const [dupe] = await pool.execute(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    if (dupe.length)
      return res.json({ success: false, message: "이미 존재하는 아이디" });
    await pool.execute("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hashed,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

// 로그인
async function login(req, res) {
  try {
    const { username, password } = req.body;
    console.log("[로그인 시도] username:", username, "password:", password);
    const [users] = await pool.execute(
      "SELECT id, password FROM users WHERE username=?",
      [username]
    );
    console.log("[DB 조회 결과]", users);
    if (!users.length) {
      console.log("[로그인 실패] 존재하지 않는 계정");
      return res.json({ success: false, message: "존재하지 않는 계정" });
    }
    const match = await bcrypt.compare(password, users[0].password);
    console.log("[비밀번호 일치 여부]", match);
    if (match) {
      // JWT 토큰 발급
      const token = jwt.sign({ userId: users[0].id }, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      console.log("[로그인 성공] userId:", users[0].id);
      res.json({ success: true, token });
    } else {
      console.log("[로그인 실패] 비밀번호 오류");
      res.json({ success: false, message: "비밀번호 오류" });
    }
  } catch (err) {
    console.error("[로그인 서버 에러]", err);
    res
      .status(500)
      .json({ success: false, message: "서버 에러: " + err.message });
  }
}

module.exports = { signup, login };
