#!/usr/bin/env python3
"""문자열/주석을 인식하는 괄호 균형 검사 (JS 대략적 구문 점검)."""
import sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def check(path):
    s = open(path, encoding="utf-8").read()
    i = 0; n = len(s)
    stack = []
    pairs = {')':'(', ']':'[', '}':'{'}
    line = 1
    errs = []
    while i < n:
        c = s[i]
        if c == '\n': line += 1; i += 1; continue
        # 주석
        if c == '/' and i+1 < n and s[i+1] == '/':
            while i < n and s[i] != '\n': i += 1
            continue
        if c == '/' and i+1 < n and s[i+1] == '*':
            i += 2
            while i+1 < n and not (s[i]=='*' and s[i+1]=='/'):
                if s[i]=='\n': line += 1
                i += 1
            i += 2; continue
        # 문자열
        if c in '"\'`':
            q = c; i += 1
            while i < n:
                if s[i] == '\\': i += 2; continue
                if s[i] == '\n': line += 1
                if s[i] == q: break
                i += 1
            i += 1; continue
        if c in '([{':
            stack.append((c, line))
        elif c in ')]}':
            if not stack or stack[-1][0] != pairs[c]:
                errs.append(f"{os.path.basename(path)}:{line} 닫는 '{c}' 불일치")
                break
            stack.pop()
        i += 1
    if stack:
        c, ln = stack[-1]
        errs.append(f"{os.path.basename(path)}: 닫히지 않은 '{c}' (line {ln})")
    return errs

all_errs = []
for f in ["questions.js", "app.js", "index.html", "style.css"]:
    p = os.path.join(ROOT, f)
    if os.path.exists(p):
        e = check(p)
        all_errs += e
        print(f"{f}: {'OK' if not e else 'ERROR'}")

if all_errs:
    print("\n[X] 구문 문제:")
    for e in all_errs: print("  - " + e)
    sys.exit(1)
print("\n[OK] 괄호 균형 검사 통과")
