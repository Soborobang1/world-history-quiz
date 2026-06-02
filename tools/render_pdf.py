#!/usr/bin/env python3
"""pdf_files/ 의 모든 PDF 페이지를 PNG montage로 렌더링 (tools/img/).
슬라이드 여러 장을 세로로 합쳐 읽기 편하게 만든다.

usage: python3 render_pdf.py [substr_filter] [pages_per_image]
  substr_filter: 파일명에 포함된 문자열로 일부만 렌더링 (예: "나폴레옹")
"""
import sys
import os
import glob
import fitz  # pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.join(ROOT, "pdf_files")
OUT_DIR = os.path.join(ROOT, "tools", "img")

substr = sys.argv[1] if len(sys.argv) > 1 else ""
per = int(sys.argv[2]) if len(sys.argv) > 2 else 6

os.makedirs(OUT_DIR, exist_ok=True)
pdfs = sorted(glob.glob(os.path.join(PDF_DIR, "*.pdf")))
if substr:
    pdfs = [p for p in pdfs if substr in os.path.basename(p)]

zoom = 1.6
mat = fitz.Matrix(zoom, zoom)

for pdf_path in pdfs:
    base = os.path.splitext(os.path.basename(pdf_path))[0]
    doc = fitz.open(pdf_path)
    pix_list = [page.get_pixmap(matrix=mat) for page in doc]
    group = 0
    for start in range(0, len(pix_list), per):
        chunk = pix_list[start:start + per]
        width = max(p.width for p in chunk)
        height = sum(p.height for p in chunk) + 4 * (len(chunk) - 1)
        canvas = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, width, height), False)
        canvas.clear_with(255)
        y = 0
        for p in chunk:
            if p.n - p.alpha >= 4:
                p = fitz.Pixmap(fitz.csRGB, p)
            canvas.copy(p, (0, y, p.width, y + p.height))
            y += p.height + 4
        group += 1
        out = os.path.join(OUT_DIR, f"{base}__part{group}.png")
        canvas.save(out)
    print(f"{base}: {len(pix_list)}p -> {group} img")

print("완료.")
