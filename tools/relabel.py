#!/usr/bin/env python3
"""지정한 id의 문항 type을 fact -> chronology 로 재분류 (연도·기간·시대 배경 문항)."""
import re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(ROOT, "questions.js")
src = open(path, encoding="utf-8").read()

targets = [
 "w09a-02","w09a-08","w11a-08","w12a-02","w12a-03","w12b-10","w12c-02",
 "w12c-03","w13a-02","w13a-06","w13b-03","w13c-03","w14c-04","w14c-10",
 "w15a-06","w15a-07","w15c-02","sum-13",
]

changed = 0
for tid in targets:
    # id 다음, 닫는 중괄호 이전의 type:"fact" 를 chronology 로 변경
    pat = re.compile(r'(id:"' + re.escape(tid) + r'"[^}]*?)type:"fact"')
    new, n = pat.subn(r'\1type:"chronology"', src)
    if n == 1:
        src = new; changed += 1
    else:
        print(f"  [경고] {tid}: 매칭 {n}건")

open(path, "w", encoding="utf-8").write(src)
print(f"재분류 완료: {changed}/{len(targets)}")
