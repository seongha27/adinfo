// SPA 화면 제어
const loginSection = document.getElementById("login-section");
const signupSection = document.getElementById("signup-section");
const rankSection = document.getElementById("rank-section");

// SPA 이동 함수
function showSection(section) {
  loginSection.style.display = section === "login" ? "" : "none";
  signupSection.style.display = section === "signup" ? "" : "none";
  rankSection.style.display = section === "rank" ? "" : "none";
}

document.getElementById("showSignup").onclick = () => showSection("signup");
document.getElementById("backToLogin").onclick = () => showSection("login");

// 로그인 상태 확인 및 초기화
window.onload = () => {
  if (localStorage.getItem("token")) {
    showSection("rank");
    fetchHistory();
  } else {
    showSection("login");
    document.getElementById("company-tbody").innerHTML = "";
  }
};

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const res = await fetch("/api/user/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const result = await res.json();
  if (result.success && result.token) {
    localStorage.setItem("token", result.token);
    showSection("rank");
    fetchHistory();
    alert("로그인 성공!");
  } else {
    alert(result.message || "로그인 실패");
  }
});

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("signupUsername").value;
  const password = document.getElementById("signupPassword").value;
  const res = await fetch("/api/user/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const result = await res.json();
  if (result.success) {
    alert("회원가입 성공! 다시 로그인해주세요.");
    showSection("login");
  } else {
    alert(result.message || "회원가입 실패");
  }
});

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  showSection("login");
  document.getElementById("company-tbody").innerHTML = "";
};

document.getElementById("rankForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const keyword = document.getElementById("keyword").value.trim();
  const url = document.getElementById("url").value.trim();
  const token = localStorage.getItem("token");
  if (!keyword || !url || !token) {
    alert("대표키워드, URL, 로그인 정보가 모두 필요합니다.");
    return;
  }
  const res = await fetch("/api/rank/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ keyword, url }),
  });
  const data = await res.json();
  if (data.found) {
    document.getElementById(
      "resultBox"
    ).innerHTML = `<span style="color:green;">✅ 순위: ${data.rank}위<br>업체명: ${data.place_name}</span>`;
    fetchHistory();
  } else {
    document.getElementById(
      "resultBox"
    ).innerHTML = `<span style="color:red;">❌ 300위 밖 또는 업체를 찾을 수 없습니다.</span>`;
  }
});

async function fetchHistory() {
  const token = localStorage.getItem("token");
  if (!token) {
    document.getElementById("company-tbody").innerHTML = "";
    return;
  }
  const res = await fetch("/api/rank/history", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.success && data.history.length) {
    const showList = [];
    data.history.forEach((item) => {
      if (
        !showList.some(
          (v) => v.keyword === item.keyword && v.place_name === item.place_name
        )
      ) {
        showList.push(item);
      }
    });
    const html = showList
      .map(
        (item) => `
      <tr>
        <td>
          <div class="top-row">
            <span>대표키워드: ${item.keyword}</span> &nbsp; | &nbsp;
            <span>업체명: ${item.place_name || "-"}</span>
          </div>
          <div class="bottom-row" style="display:flex; align-items:center; justify-content:space-between;">
            <div>
              <span>날짜: ${new Date(item.snapshot).toLocaleDateString(
                "ko-KR"
              )}</span>
              &nbsp; | &nbsp;
              <span>순위: <b style="color:#0070f3;">${
                item.rank ? item.rank + "위" : "-"
              }</b></span>
              &nbsp; | &nbsp;
              <span><a href="https://m.place.naver.com/place/${
                item.place_id
              }" target="_blank" style="color:#225ae0;">플레이스보기</a></span>
            </div>
            <button class="delete-btn" data-id="${
              item.id
            }" style="background:#ff5b5b; color:#fff; border:none; border-radius:4px; padding:4px 12px; cursor:pointer; font-size:14px; margin-left:14px;">삭제</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
    document.getElementById("company-tbody").innerHTML = html;

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.onclick = async function () {
        if (confirm("정말 삭제하시겠습니까?")) {
          await deleteCompany(this.dataset.id);
        }
      };
    });
  } else {
    document.getElementById(
      "company-tbody"
    ).innerHTML = `<tr><td style="text-align:center; color:#aaa;">아직 등록된 업체가 없습니다.</td></tr>`;
  }
}

async function deleteCompany(id) {
  const token = localStorage.getItem("token");
  if (!token) return alert("로그인이 필요합니다.");
  const res = await fetch(`/api/rank/delete/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.success) {
    alert("삭제되었습니다.");
    fetchHistory();
  } else {
    alert(data.message || "삭제 실패");
  }
}
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
document.getElementById("diagnoseForm").onsubmit = async (e) => {
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
