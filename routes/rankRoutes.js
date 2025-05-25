const express = require("express");
const router = express.Router();
const { handleRankSubmit } = require("../controllers/rankController");

router.post("/submit", handleRankSubmit);

module.exports = router;
