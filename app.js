/* 세계사 마스터 문제은행 — 앱 로직 */
"use strict";

const SESSION_SIZE = 20;
const LS = {
  stats: "whqb_stats_v1",
  wrong: "whqb_wrong_v1",
  hist: "whqb_hist_v1",
  session: "whqb_session_v1",
};

/* ---------- localStorage helpers ---------- */
function load(key, def) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? def : v; }
  catch (e) { return def; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function getStats() { return load(LS.stats, { answered: 0, correct: 0, scores: [] }); }
function getWrong() { return load(LS.wrong, []); }          // array of question ids
function getHist() { return load(LS.hist, {}); }            // id -> {seen, correct}

/* ---------- app state ---------- */
let state = null; // { queue:[ids], idx, correct, answers:[{id, picked, ok}], mode, locked }

/* ---------- utils ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function byId(id) { return QUESTIONS_BY_ID[id]; }
const QUESTIONS_BY_ID = {};
QUESTIONS.forEach(q => { QUESTIONS_BY_ID[q.id] = q; });

const CATEGORIES = [...new Set(QUESTIONS.map(q => q.category))];
const WEEKS = [...new Set(QUESTIONS.map(q => q.week))].sort((a, b) => a - b);
function weekLabel(w) { return w >= 16 ? "종합" : `${w}주차`; }

/* ---------- screen switching ---------- */
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

function goHome() {
  renderHome();
  show("home");
}

/* ---------- HOME ---------- */
function renderHome() {
  const stats = getStats();
  const wrong = getWrong();
  const rate = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
  document.getElementById("statsCard").innerHTML = `
    <div><div class="stat-num">${stats.answered}</div><div class="stat-lbl">푼 문제</div></div>
    <div><div class="stat-num">${rate}%</div><div class="stat-lbl">누적 정답률</div></div>
    <div><div class="stat-num">${wrong.length}</div><div class="stat-lbl">오답 노트</div></div>`;

  document.getElementById("wrongCount").textContent =
    wrong.length ? `틀린 문제 ${wrong.length}개 다시 풀기` : "틀린 문제가 아직 없어요";

  const poolInfo = document.getElementById("poolInfo");
  poolInfo.textContent = `총 ${QUESTIONS.length}문제 · ${WEEKS.length}개 주차 · 한 세션 최대 ${SESSION_SIZE}문제`;
  document.getElementById("footerInfo").textContent =
    `문제 풀 ${QUESTIONS.length}개 · 9~15주차 강의노트 기반`;

  // 이어풀기
  const sess = load(LS.session, null);
  const resumeCard = document.getElementById("resumeCard");
  if (sess && sess.queue && sess.idx < sess.queue.length) {
    resumeCard.style.display = "";
    document.getElementById("resumeDesc").textContent =
      `${sess.idx} / ${sess.queue.length} 진행 중`;
  } else {
    resumeCard.style.display = "none";
  }
}

/* ---------- start modes ---------- */
function beginSession(ids, mode) {
  if (!ids.length) { alert("해당 범위에 문제가 없습니다."); return; }
  const queue = shuffle(ids).slice(0, SESSION_SIZE);
  state = { queue, idx: 0, correct: 0, answers: [], mode, locked: false };
  persistSession();
  renderQuestion();
  show("quiz");
}

function startRandom() {
  beginSession(QUESTIONS.map(q => q.id), "random");
}

function startWrong() {
  const wrong = getWrong();
  if (!wrong.length) { alert("오답 노트가 비어 있습니다. 먼저 문제를 풀어보세요!"); return; }
  beginSession(wrong, "wrong");
}

/* ---------- FILTER ---------- */
let filterWeeks = new Set();
let filterCats = new Set();

function openFilter() {
  filterWeeks = new Set(WEEKS);
  filterCats = new Set(CATEGORIES);
  const wc = document.getElementById("weekChips");
  wc.innerHTML = WEEKS.map(w => `<div class="chip on" data-w="${w}" onclick="toggleWeek(${w})">${weekLabel(w)}</div>`).join("");
  const cc = document.getElementById("catChips");
  cc.innerHTML = CATEGORIES.map(c => `<div class="chip on" data-c="${c}" onclick="toggleCat('${c}')">${c}</div>`).join("");
  updateFilterCount();
  show("filter");
}
function toggleWeek(w) {
  if (filterWeeks.has(w)) filterWeeks.delete(w); else filterWeeks.add(w);
  document.querySelector(`[data-w="${w}"]`).classList.toggle("on");
  updateFilterCount();
}
function toggleCat(c) {
  if (filterCats.has(c)) filterCats.delete(c); else filterCats.add(c);
  document.querySelector(`[data-c="${CSS.escape(c)}"]`).classList.toggle("on");
  updateFilterCount();
}
function filteredIds() {
  return QUESTIONS.filter(q => filterWeeks.has(q.week) && filterCats.has(q.category)).map(q => q.id);
}
function updateFilterCount() {
  const n = filteredIds().length;
  document.getElementById("filterCount").textContent =
    `선택된 문제 ${n}개 → 이 중 무작위 ${Math.min(n, SESSION_SIZE)}문제 출제`;
}
function startFiltered() {
  const ids = filteredIds();
  if (!ids.length) { alert("주차와 단원을 하나 이상 선택하세요."); return; }
  beginSession(ids, "filter");
}

/* ---------- QUIZ ---------- */
function renderQuestion() {
  const q = byId(state.queue[state.idx]);
  state.locked = false;
  state.picked = null;

  document.getElementById("qCounter").textContent = `${state.idx + 1} / ${state.queue.length}`;
  document.getElementById("qScore").textContent = `정답 ${state.correct}`;
  document.getElementById("progressBar").style.width =
    `${(state.idx / state.queue.length) * 100}%`;

  const typeLabel = TYPE_LABELS[q.type] || q.type;
  document.getElementById("qTags").innerHTML =
    `<span class="tag">${weekLabel(q.week)}</span>` +
    `<span class="tag">${q.category}</span>` +
    `<span class="tag">${q.topic}</span>` +
    `<span class="tag type">${typeLabel}</span>`;

  document.getElementById("qText").textContent = q.question;

  const ch = document.getElementById("choices");
  ch.innerHTML = q.choices.map((c, i) =>
    `<button class="choice" data-i="${i}" onclick="pick(${i})">
       <span class="num">${i + 1}</span><span class="ctext">${escapeHtml(c)}</span>
     </button>`).join("");

  const fb = document.getElementById("feedback");
  fb.className = "feedback"; fb.innerHTML = "";
  document.getElementById("submitBtn").style.display = "";
  document.getElementById("submitBtn").disabled = true;
  document.getElementById("nextBtn").style.display = "none";
}

function pick(i) {
  if (state.locked) return;
  state.picked = i;
  document.querySelectorAll("#choices .choice").forEach(el =>
    el.classList.toggle("selected", +el.dataset.i === i));
  document.getElementById("submitBtn").disabled = false;
}

function submitAnswer() {
  if (state.locked || state.picked == null) return;
  const q = byId(state.queue[state.idx]);
  const ok = state.picked === q.answer;
  state.locked = true;
  if (ok) state.correct++;
  state.answers.push({ id: q.id, picked: state.picked, ok });

  // lock choices + color
  document.querySelectorAll("#choices .choice").forEach(el => {
    const i = +el.dataset.i;
    el.classList.add("locked");
    el.classList.remove("selected");
    el.setAttribute("onclick", "");
    if (i === q.answer) el.classList.add("correct");
    else if (i === state.picked) el.classList.add("wrong");
  });

  // feedback
  const fb = document.getElementById("feedback");
  fb.className = "feedback show";
  fb.innerHTML =
    `<div class="fb-banner ${ok ? "ok" : "bad"}">${ok ? "✅ 정답입니다!" : "❌ 오답입니다"}</div>
     <div class="fb-explain"><b>정답: ${q.answer + 1}번</b><br>${escapeHtml(q.explanation)}
       <div class="fb-source">📖 출처: ${escapeHtml(q.source)}</div>
     </div>`;

  document.getElementById("qScore").textContent = `정답 ${state.correct}`;
  document.getElementById("submitBtn").style.display = "none";
  document.getElementById("nextBtn").style.display = "";
  document.getElementById("nextBtn").textContent =
    state.idx + 1 >= state.queue.length ? "결과 보기 ▶" : "다음 ▶";

  // persist stats + wrong note + history
  recordAnswer(q, ok);
  persistSession();
}

function recordAnswer(q, ok) {
  const stats = getStats();
  stats.answered++; if (ok) stats.correct++;
  save(LS.stats, stats);

  const hist = getHist();
  const h = hist[q.id] || { seen: 0, correct: 0 };
  h.seen++; if (ok) h.correct++;
  hist[q.id] = h; save(LS.hist, hist);

  let wrong = getWrong();
  if (ok) { wrong = wrong.filter(id => id !== q.id); }
  else if (!wrong.includes(q.id)) { wrong.push(q.id); }
  save(LS.wrong, wrong);
}

function nextQuestion() {
  state.idx++;
  if (state.idx >= state.queue.length) { finishSession(); return; }
  persistSession();
  renderQuestion();
}

function quitToHome() {
  if (state && state.idx < state.queue.length && !confirm("진행 중인 세션을 중단할까요? (이어풀기로 다시 시작할 수 있어요)")) return;
  goHome();
}

/* ---------- RESULT ---------- */
function finishSession() {
  const total = state.queue.length;
  const correct = state.correct;
  const pct = Math.round((correct / total) * 100);
  const stats = getStats();
  stats.scores = (stats.scores || []).concat([{ t: Date.now(), correct, total }]).slice(-30);
  save(LS.stats, stats);
  localStorage.removeItem(LS.session);

  const grade = pct >= 90 ? "🏆 완벽해요!" : pct >= 70 ? "👍 잘했어요!" :
    pct >= 50 ? "💪 조금 더!" : "📖 복습이 필요해요";
  document.getElementById("resultHero").innerHTML =
    `<div class="result-score">${correct}<span class="small"> / ${total}</span></div>
     <div class="result-grade">${grade}</div>
     <div class="result-msg">정답률 ${pct}%</div>`;

  const rl = document.getElementById("reviewList");
  rl.innerHTML = state.answers.map((a, n) => {
    const q = byId(a.id);
    return `<div class="review-item ${a.ok ? "ok" : "bad"}" onclick="this.classList.toggle('open')">
      <span class="mark">${a.ok ? "○" : "✕"}</span>
      <div>
        <div>${n + 1}. <span class="rq">${escapeHtml(q.question)}</span></div>
        <div class="review-detail">
          <b>정답 ${q.answer + 1}번:</b> ${escapeHtml(q.choices[q.answer])}<br>
          ${a.ok ? "" : `<b>내 선택 ${a.picked + 1}번:</b> ${escapeHtml(q.choices[a.picked])}<br>`}
          <br>${escapeHtml(q.explanation)}
        </div>
      </div></div>`;
  }).join("");

  const anyWrong = state.answers.some(a => !a.ok);
  document.getElementById("reviewWrongBtn").style.display = anyWrong ? "" : "none";
  state._wrongIds = state.answers.filter(a => !a.ok).map(a => a.id);
  show("result");
}

function reviewWrongFromResult() {
  if (state && state._wrongIds && state._wrongIds.length) beginSession(state._wrongIds, "wrong");
}

/* ---------- session persistence ---------- */
function persistSession() {
  if (!state) return;
  save(LS.session, { queue: state.queue, idx: state.idx, correct: state.correct, answers: state.answers, mode: state.mode });
}
function resumeSession() {
  const s = load(LS.session, null);
  if (!s || !s.queue) { alert("이어풀 세션이 없습니다."); goHome(); return; }
  state = { queue: s.queue, idx: s.idx, correct: s.correct, answers: s.answers || [], mode: s.mode, locked: false };
  if (state.idx >= state.queue.length) { finishSession(); return; }
  renderQuestion();
  show("quiz");
}

/* ---------- topic stats ---------- */
function showTopicStats() {
  const hist = getHist();
  const map = {};
  QUESTIONS.forEach(q => {
    const key = `${weekLabel(q.week)} ${q.topic}`;
    if (!map[key]) map[key] = { seen: 0, correct: 0, total: 0 };
    map[key].total++;
    const h = hist[q.id];
    if (h) { map[key].seen += h.seen; map[key].correct += h.correct; }
  });
  let msg = "📊 단원별 정답률 (푼 문제 기준)\n\n";
  Object.keys(map).forEach(k => {
    const m = map[k];
    const r = m.seen ? Math.round((m.correct / m.seen) * 100) + "%" : "-";
    msg += `${k}: ${r} (${m.seen}회 응시 / 문항 ${m.total})\n`;
  });
  alert(msg);
}

function resetAll() {
  if (!confirm("모든 기록(통계·오답노트·진행)을 삭제할까요?")) return;
  [LS.stats, LS.wrong, LS.hist, LS.session].forEach(k => localStorage.removeItem(k));
  goHome();
}

/* ---------- misc ---------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const TYPE_LABELS = {
  chronology: "⏳ 시대순",
  fact: "📌 사실확인",
  person: "👤 인물",
  place: "📍 장소",
  cause: "🔗 원인·결과",
};

/* ---------- boot ---------- */
window.addEventListener("DOMContentLoaded", goHome);
