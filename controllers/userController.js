const pool = require("../models/db");
const bcrypt = require("bcrypt");

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
  const { username, password } = req.body;
  const [users] = await pool.execute(
    "SELECT id, password FROM users WHERE username=?",
    [username]
  );
  if (!users.length)
    return res.json({ success: false, message: "존재하지 않는 계정" });
  const match = await bcrypt.compare(password, users[0].password);
  if (match) {
    res.json({ success: true, userId: users[0].id });
  } else {
    res.json({ success: false, message: "비밀번호 오류" });
  }
}

module.exports = { signup, login };
