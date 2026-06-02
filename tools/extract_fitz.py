#!/usr/bin/env python3
"""pymupdf(fitz)로 모든 PDF 텍스트를 tools/text/<name>.txt 로 추출."""
import os, glob
import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.join(ROOT, "pdf_files")
OUT_DIR = os.path.join(ROOT, "tools", "text")
os.makedirs(OUT_DIR, exist_ok=True)

pdfs = sorted(glob.glob(os.path.join(PDF_DIR, "*.pdf")))
for pdf_path in pdfs:
    name = os.path.splitext(os.path.basename(pdf_path))[0]
    doc = fitz.open(pdf_path)
    lines = []
    for i, page in enumerate(doc, 1):
        t = page.get_text("text").strip()
        if t:
            lines.append(f"--- p.{i} ---\n{t}")
    out = os.path.join(OUT_DIR, name + ".txt")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"{name}: {sum(len(l) for l in lines)}자")
print("완료.")
