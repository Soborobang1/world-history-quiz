#!/usr/bin/env python3
import esprima, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok = True
for f in ["questions.js", "app.js"]:
    p = os.path.join(ROOT, f)
    src = open(p, encoding="utf-8").read()
    try:
        esprima.parseScript(src)
        print(f"{f}: OK")
    except Exception as e:
        ok = False
        print(f"{f}: ERROR -> {e}")
sys.exit(0 if ok else 1)
