#!/usr/bin/env python3
"""questions.js 검증 (node 없이 파이썬으로). 따옴표를 인식해 선택지 개수를 정확히 센다."""
import re, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "questions.js"), encoding="utf-8").read()

# 각 문항 객체는 '{ id:' 로 시작
blocks = re.split(r'\n\{ id:', src)
blocks = ['{ id:' + b for b in blocks[1:]]  # 첫 조각(헤더) 제외

def count_choices(block):
    m = re.search(r'choices:\[', block)
    if not m:
        return -1
    i = m.end()
    depth = 1
    in_str = False
    esc = False
    items = 0
    started = False
    while i < len(block) and depth > 0:
        c = block[i]
        if in_str:
            if esc: esc = False
            elif c == '\\': esc = True
            elif c == '"': in_str = False
        else:
            if c == '"': in_str = True; started = True
            elif c == '[': depth += 1
            elif c == ']':
                depth -= 1
            elif c == ',' and depth == 1:
                items += 1
        i += 1
    return items + 1 if started else 0

errors = []
ids = set()
per_source = {}
type_count = {}
total = 0

for b in blocks:
    total += 1
    mid = re.search(r'id:"([^"]+)"', b)
    qid = mid.group(1) if mid else f"(unknown@{total})"
    if qid in ids: errors.append(f"중복 id: {qid}")
    ids.add(qid)
    week = int(re.search(r'week:(\d+)', b).group(1))
    session = int(re.search(r'session:(\d+)', b).group(1))
    answer = int(re.search(r'answer:(\d+)', b).group(1))
    nch = count_choices(b)
    if nch != 5: errors.append(f"{qid}: choices 개수 {nch}")
    if not (0 <= answer <= 4): errors.append(f"{qid}: answer 범위 {answer}")
    for fld in ("question:", "explanation:", "source:"):
        if fld not in b: errors.append(f"{qid}: {fld} 누락")
    key = f"w{week:02d}-s{session}"
    per_source[key] = per_source.get(key, 0) + 1
    t = re.search(r'type:"([^"]+)"', b)
    tt = t.group(1) if t else "?"
    type_count[tt] = type_count.get(tt, 0) + 1

print(f"총 문항 수: {total}")
print(f"고유 id 수: {len(ids)}")
print("\n유형별 분포:")
for t in sorted(type_count):
    print(f"  {t}: {type_count[t]} ({round(type_count[t]/total*100)}%)")
print("\nPDF(주차-차시)별 문항 수:")
low = []
for k in sorted(per_source):
    n = per_source[k]
    print(f"  {k}: {n}")
    if k != "w16-s0" and n < 10:
        low.append(f"{k}({n})")

print("\n=== 검증 결과 ===")
if low: errors.append("10문제 미만 PDF: " + ", ".join(low))
if errors:
    print("[X] 오류:")
    for e in errors: print("  - " + e)
    sys.exit(1)
else:
    print("[OK] 모든 검증 통과")
