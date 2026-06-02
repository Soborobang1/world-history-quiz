#!/usr/bin/env python3
"""pdf_files/ 의 모든 PDF 텍스트를 tools/extracted/<name>.txt 로 추출."""
import os
import glob
from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.join(ROOT, "pdf_files")
OUT_DIR = os.path.join(ROOT, "tools", "extracted")

os.makedirs(OUT_DIR, exist_ok=True)

pdfs = sorted(glob.glob(os.path.join(PDF_DIR, "*.pdf")))
print(f"발견한 PDF: {len(pdfs)}개")

for path in pdfs:
    name = os.path.splitext(os.path.basename(path))[0]
    try:
        reader = PdfReader(path)
        parts = []
        for i, page in enumerate(reader.pages, 1):
            txt = page.extract_text() or ""
            parts.append(f"\n===== [p.{i}] =====\n{txt}")
        content = "".join(parts)
    except Exception as e:
        content = f"[추출 실패: {e}]"
    out_path = os.path.join(OUT_DIR, name + ".txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    chars = len(content)
    print(f"  {name}: {chars}자")

print("완료.")
