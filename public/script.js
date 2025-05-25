// ------- 모달 및 인증 로직 -------
const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const closeLogin = document.getElementById("closeLogin");
const closeSignup = document.getElementById("closeSignup");
const showSignup = document.getElementById("showSignup");

// 로그인 버튼 클릭
loginBtn.addEventListener("click", () => {
  loginModal.style.display = "block";
});
closeLogin.addEventListener("click", () => (loginModal.style.display = "none"));
closeSignup.addEventListener(
  "click",
  () => (signupModal.style.display = "none")
);
showSignup.addEventListener("click", () => {
  loginModal.style.display = "none";
  signupModal.style.display = "block";
});
window.addEventListener("click", (event) => {
  if (event.target === loginModal) loginModal.style.display = "none";
  if (event.target === signupModal) signupModal.style.display = "none";
});

// ----------- 인증 관련 함수 -----------
function onLoginSuccess(userId) {
  localStorage.setItem("userId", userId);
  document.getElementById("rankForm").style.display = "block";
  logoutBtn.style.display = "block";
  loginBtn.style.display = "none";
}

// 로그아웃
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("userId");
  document.getElementById("rankForm").style.display = "none";
  logoutBtn.style.display = "none";
  loginBtn.style.display = "block";
});

// 회원가입 폼 제출
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
    signupModal.style.display = "none";
  } else {
    alert(result.message || "회원가입 실패");
  }
});

// 로그인 폼 제출
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
  if (result.success) {
    onLoginSuccess(result.userId);
    alert("로그인 성공!");
    loginModal.style.display = "none";
  } else {
    alert(result.message || "로그인 실패");
  }
});

// ----------- 순위조회 폼 제출 -----------
document.getElementById("rankForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const keyword = document.getElementById("keyword").value.trim();
  const url = document.getElementById("url").value.trim();
  const userId = localStorage.getItem("userId");
  console.log("[클라이언트] userId:", userId);
  if (!keyword || !url || !userId) {
    alert("대표키워드, URL, 로그인 정보가 모두 필요합니다.");
    return;
  }
  const res = await fetch("/api/rank/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, url, userId }),
  });
  const data = await res.json();
  console.log("[클라이언트] 서버 응답:", data);
  const resultBox = document.getElementById("resultBox");
  console.log("서버에서 온 응답:", data);
  if (data.found) {
    alert(`✅ 순위: ${data.rank}위\n업체명: ${data.place_name}`);
    resultBox.innerText = `✅ 순위: ${data.rank}위\n업체명: ${data.place_name}`;
  } else {
    alert("❌ 300위 밖 또는 업체를 찾을 수 없습니다.");
    resultBox.innerText = "❌ 300위 밖 또는 업체를 찾을 수 없습니다.";
  }
});

// ----------- 첫 로딩 시 로그인 상태 체크 -----------
window.onload = () => {
  const userId = localStorage.getItem("userId");
  if (userId) {
    onLoginSuccess(userId);
  }
};
