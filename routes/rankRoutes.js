const express = require("express");
const router = express.Router();
const {
  handleRankSubmit,
  getSearchHistory,
  deleteRank,
} = require("../controllers/rankController");
const authMiddleware = require("../middlewares/auth");

router.post("/submit", authMiddleware, handleRankSubmit);
router.get("/history", authMiddleware, getSearchHistory);
router.delete("/delete/:id", authMiddleware, deleteRank); // ★ 추가

module.exports = router;
