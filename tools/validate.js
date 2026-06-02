// questions.js 검증: 총 문항수, 선택지 5개, answer 0~4, PDF당 10문제 이상, 중복 id
const fs = require("fs");
const path = require("path");
global.window = {};
require(path.join(__dirname, "..", "questions.js"));
const Q = global.window.QUESTIONS;

let errors = [];
const ids = new Set();
const perSource = {};   // week-session -> count
const typeCount = {};

for (const q of Q) {
  if (ids.has(q.id)) errors.push(`중복 id: ${q.id}`);
  ids.add(q.id);
  if (!Array.isArray(q.choices) || q.choices.length !== 5)
    errors.push(`${q.id}: choices 개수 ${q.choices ? q.choices.length : "없음"}`);
  if (typeof q.answer !== "number" || q.answer < 0 || q.answer > 4)
    errors.push(`${q.id}: answer 범위 오류 (${q.answer})`);
  if (!q.question || !q.explanation || !q.source)
    errors.push(`${q.id}: 필수 필드 누락`);
  const key = `w${q.week}-s${q.session}`;
  perSource[key] = (perSource[key] || 0) + 1;
  typeCount[q.type] = (typeCount[q.type] || 0) + 1;
}

console.log(`총 문항 수: ${Q.length}`);
console.log(`고유 id 수: ${ids.size}`);
console.log(`\n유형별 분포:`);
for (const t of Object.keys(typeCount)) {
  console.log(`  ${t}: ${typeCount[t]} (${Math.round(typeCount[t]/Q.length*100)}%)`);
}
console.log(`\nPDF(주차-차시)별 문항 수:`);
const lowSources = [];
for (const k of Object.keys(perSource).sort()) {
  const n = perSource[k];
  console.log(`  ${k}: ${n}`);
  if (k !== "w16-s0" && n < 10) lowSources.push(`${k}(${n})`);
}

console.log(`\n=== 검증 결과 ===`);
if (lowSources.length) errors.push(`10문제 미만 PDF: ${lowSources.join(", ")}`);
if (errors.length) {
  console.log("❌ 오류:");
  errors.forEach(e => console.log("  - " + e));
  process.exit(1);
} else {
  console.log("✅ 모든 검증 통과");
}
