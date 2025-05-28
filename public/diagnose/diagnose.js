// diagnose/diagnose.js
document.getElementById("form").onsubmit = async (e) => {
  e.preventDefault();
  const urls = document
    .getElementById("urls")
    .value.split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!urls.length) return alert("URL을 입력하세요!");

  document.getElementById("resultTbl").style.display = "";
  const tbody = document.querySelector("#resultTbl tbody");
  tbody.innerHTML = '<tr><td colspan="11">조회중...</td></tr>';

  const resp = await fetch("/api/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urlList: urls }),
  }).then((res) => res.json());

  if (!resp.success) {
    tbody.innerHTML = `<tr><td colspan="11">에러: ${
      resp.error || "서버 오류"
    }</td></tr>`;
    return;
  }

  tbody.innerHTML = resp.data
    .map(
      (row) => `
    <tr>
      <td>${row.blogId || ""}</td>
      <td>${row.nickName || ""}</td>
      <td>${row.publishedDate || ""}</td>
      <td>${row.title || ""}</td>
      <td>${row.indicesLabel || ""}</td>
      <td>${row.exposure || ""}</td>
      <td>${row.contentCnt || ""}</td>
      <td>${row.sympathyCnt || ""}</td>
      <td>${row.thumbnailCnt || ""}</td>
      <td>${row.showThumbnailCnt || ""}</td>
      <td><a href="${row.url || "#"}" target="_blank">바로가기</a></td>
    </tr>
  `
    )
    .join("");
};
