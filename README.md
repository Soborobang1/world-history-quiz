# 세계사 마스터 문제은행 📚

대학 세계사 강의노트(9~15주차) PDF 21개의 내용을 바탕으로 만든 **시험 대비 5지선다 문제은행 웹앱**입니다.
모바일·PC 어디서나 브라우저로 접속해 풀 수 있습니다.

## ✨ 특징

- **255문항**의 문제 풀 (PDF당 10문항 + 시대순 종합 45문항)
- **5지선다 객관식**, 대학 수준
- **시대 순서(연표) 문제 최다 비중** (약 36%) — 시대 흐름 숙지에 최적화
- 문제마다 **즉시 정답/오답 확인 + 해설**(오답이 왜 틀렸는지 포함)
- **한 세션 최대 20문제** (200+ 풀에서 무작위 추출)
- 4가지 풀이 모드
  - 🎲 **전체 랜덤**: 전체 풀에서 무작위 20문제
  - 🗂️ **주제·주차별**: 원하는 주차/단원만 골라 풀기
  - 🔁 **오답 복습**: 틀린 문제만 다시 풀기
  - ⏯️ **이어풀기**: 중단한 세션 복원
- **진행도 저장**: 누적 정답률·오답 노트·단원별 정답률 (브라우저 localStorage)
- **모바일 우선 반응형** 디자인

## 📂 구성

| 파일 | 설명 |
|------|------|
| `index.html` | 앱 진입점 |
| `style.css` | 스타일(모바일 우선 반응형) |
| `app.js` | 앱 로직(모드/세션/채점/진행도) |
| `questions.js` | 문제 풀 (`window.QUESTIONS` 배열, 255문항) |
| `pdf_files/` | 원본 강의노트 PDF |
| `tools/` | 개발용 스크립트(PDF 추출·검증) — 배포에 불필요 |

## ▶️ 로컬에서 실행

브라우저로 `index.html`을 직접 열거나, 로컬 서버로 띄웁니다.

```bash
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 🌐 GitHub Pages 배포

1. GitHub에서 **공개(public) 저장소**를 만든다. (무료 계정의 Pages는 공개 저장소 필요)
2. 이 폴더를 push 한다.
   ```bash
   git remote add origin https://github.com/<사용자명>/<저장소명>.git
   git push -u origin main
   ```
3. 저장소 **Settings ▸ Pages**에서 Source를 `main` 브랜치 / `/ (root)`로 설정한다.
4. 잠시 후 `https://<사용자명>.github.io/<저장소명>/` 에서 접속 가능. 휴대폰에서도 동일 URL로 열린다.

## 🔧 문제 풀 재생성/검증 (개발용)

```bash
pip3 install --user pymupdf esprima      # 의존성
python3 tools/extract_fitz.py            # PDF -> tools/text/*.txt 추출
python3 tools/validate.py                # 문항 수/형식/PDF당 10문제 검증
python3 tools/jscheck.py                 # JS 구문 검증(esprima)
```

## 📝 문제 신뢰성

- 모든 문항은 강의노트 PDF에서 추출한 내용을 근거로 출제했으며, 정답은 역사적 사실과
  PDF 서술에 부합하도록 작성했습니다.
- 각 문항의 `explanation`에 정답 근거와 주요 오답이 틀린 이유를 함께 기재했습니다.
