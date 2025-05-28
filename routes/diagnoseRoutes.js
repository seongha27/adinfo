const express = require("express");
const router = express.Router();
const { diagnose } = require("../utils/postDiagnose");

// 여러 개(대량진단)
router.post("/", async (req, res) => {
  // <--- "/"로 변경
  let urls = [];
  // postUrlList 또는 urlList 또는 blogUrl (하나만)
  if (Array.isArray(req.body.urlList)) urls = req.body.urlList;
  else if (Array.isArray(req.body.postUrlList))
    urls = req.body.postUrlList.map((x) => x.postUrl);
  else if (req.body.blogUrl) urls = [req.body.blogUrl];
  else return res.json({ success: false, error: "URL 목록 누락" });

  // 대량 진단 처리
  try {
    const result = await Promise.all(
      urls.map(async (url) => {
        try {
          return await diagnose(url);
        } catch (e) {
          return { url, error: e.message };
        }
      })
    );
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

module.exports = router;
