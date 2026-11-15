# 창운 — 인쇄·판촉물 주문 사이트 (시연 데모)

명함, 스티커, 전단, 현수막, 배너를 **옵션만 고르면 가격과 출고일이 바로 계산되는** 인쇄 주문 사이트입니다.
고객이 직접 명함을 디자인해 인쇄용 파일까지 받아 가는 **CARD STUDIO**가 함께 들어 있습니다.

- 사이트: https://jinjjabg-hub.github.io/changun/
- 명함 스튜디오: https://jinjjabg-hub.github.io/changun/studio/

> 포트폴리오용 시연 데모입니다. **화면의 모든 가격은 샘플**이고, 결제·로그인·실제 주문 접수는 없습니다.
> 장바구니, 주문 내역, 스튜디오 작업은 방문자의 브라우저(localStorage)에만 저장됩니다.

## 주요 기능

### 주문 사이트

- **상품 5종:** 명함, 스티커, 전단·리플렛, 실사 현수막, X배너·롤업 배너
- **옵션 의존 관계:** 용지에 따라 고를 수 있는 사이즈·인쇄 면·후가공이 바뀝니다. 불가능한 항목은 사유와 함께 비활성으로 보이고, 선택이 무효가 되면 가장 가까운 값으로 자동 보정한 뒤 안내합니다.
- **즉시 계산:** 옵션을 바꾸면 가격(수량 구간 할인 포함)과 영업일 기준 출고 예정일이 바로 바뀝니다.
- **넓은 선택 폭:** 용지·소재 7~22종(추천 먼저, 전체는 분류별로 펼침), 사이즈 직접 입력, 인쇄도수(별색·흑백), 디자인 의뢰(전면/후면 × 건수, 추가편집, 옵션)
- **재질 비교:** 고른 용지를 기준 용지와 나란히 놓고 색 표현, 빛 반사(마우스로 조명 이동), 10배 확대 표면, 두께(복사지·신용카드와 비교)를 보여 줍니다.
- **인쇄용 파일 도구 (브라우저 안에서 처리, 서버 전송 없음)**
  - 명함·전단·배너·현수막: 올린 JPG/PNG를 실제 mm 크기 + 도련 + 재단선이 들어간 PDF로 변환, 해상도·잘림 경고
  - 스티커: 그림 외곽을 따라 칼선 자동 생성, 칼선 SVG와 인쇄용 PDF(그림+칼선 / 칼선만)
- **장바구니 → 주문서 → 주문 완료** (결제 단계 제외)

### CARD STUDIO (`/studio`)

정보 입력 → 시안 4종 → 편집 → 인쇄 검사·내려받기 순서로, 디자인 경험이 없는 고객도 인쇄 가능한 명함 파일을 만들 수 있게 한 엔진 MVP입니다.

- **시안 생성:** 업종·분위기·선호 색으로 템플릿을 골라 서로 다른 배치 계열의 4종을 제안합니다. 지금은 AI 호출 없이 규칙으로 고르는 데모 모드이며, LLM 기획 엔진을 끼울 자리는 분리해 두었습니다.
- **템플릿 28종:** 가로형 20종(90×50mm)과 세로형 8종(50×90mm), 템플릿마다 다른 뒷면
- **글꼴 7종:** 프리텐다드, 나눔명조, 송명, 블랙한산스, 도현, 주아, 나눔손글씨 펜 (모두 SIL OFL)
- **벡터 편집기:** 이름·전화번호 등 고객 정보는 각각 독립 객체입니다. 끌어서 이동, 글자·색·크기·글꼴 변경, 도형 추가, 실행 취소를 지원합니다.
- **용지 고르기:** 내 디자인이 고른 용지에 인쇄된 모습을 미리 봅니다(크라프트·검은 종이·펄지 등에 따라 결과가 달라짐).
- **인쇄 검사:** 글자 잘림, 안전 영역, 작은 글자, 이미지 해상도, QR 크기·대비, 용지와 디자인의 궁합을 통과/경고/실패로 판정합니다. 실패가 있으면 내려받기를 막습니다.
- **출력:**
  - PDF: 실제 mm 크기, 도련 3mm, 재단선, 글자 윤곽선 변환, 글자·도형 색은 CMYK 값
  - SVG: 글자 편집용 / 윤곽선용

## 페이지

| 경로 | 내용 |
| --- | --- |
| `/` | 홈 (상단 배너, 메가메뉴, 히어로·상품 캐러셀, 호버 카드) |
| `/products` | 전체 상품 · 검색 |
| `/products/[slug]` | 상품 상세 (옵션 선택, 재질 비교, 인쇄 파일 도구) |
| `/cart`, `/checkout`, `/order-complete` | 장바구니, 주문서, 주문 완료 |
| `/studio` | CARD STUDIO |
| `/studio/gallery` | 템플릿 전체 보기 |

## 내용 바꾸기

| 바꿀 것 | 파일 |
| --- | --- |
| 상품·용지·사이즈·후가공·가격·출고일 규칙 | `src/data/catalog.ts` |
| 실제 가격표 | `catalog.ts`의 상품에 `priceTable` 추가 (규칙 계산보다 우선) |
| 홈 슬라이드·추천 상품 | `src/data/home.ts` |
| 가격·출고일 계산 로직 | `src/lib/pricing.ts` |
| 스튜디오 템플릿 / 색 조합 / 글꼴 | `src/studio/templates.ts`, `src/studio/palettes.ts`, `src/studio/fonts.ts` |
| 인쇄 검사 기준 | `src/studio/preflight.ts` |

용지별 재질 정보(광택, 거칠기, 바탕색, 특징 문구)는 `catalog.ts`의 각 용지 `feel` 값입니다.

## 실행

Node.js 24 이상이 필요합니다.

```bash
npm install
```

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

검사(린트·타입·빌드)는 다음 명령으로 한 번에 돌립니다.

```bash
npm run check
```

## 배포 (GitHub Pages)

정적 파일로 빌드해 `gh-pages` 브랜치에 올립니다. 저장소 이름이 경로가 되므로 `NEXT_PUBLIC_BASE_PATH`를 맞춥니다.

```bash
STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/changun npm run build
```

빌드 결과(`out/`)를 `gh-pages` 브랜치에 그대로 올립니다.

```bash
git worktree add /tmp/ghp gh-pages
```

```bash
cd /tmp/ghp && git rm -rq . && cp -r ../path/to/changun/out/. . && touch .nojekyll && git add -A && git commit -m "Deploy" && git push origin gh-pages
```

저장소 Settings → Pages 에서 Source가 `gh-pages` 브랜치(root)로 되어 있어야 합니다.

## 폴더 구조

```
src/
  app/                  페이지 (홈, 상품, 장바구니, 주문, 스튜디오)
  components/
    site/               헤더·메가메뉴·푸터·캐러셀 등 공통 화면
    product/            옵션 선택, 재질 비교, 인쇄 파일 도구, 장바구니·주문서
    studio/             CARD STUDIO 화면 (입력, 시안, 편집기, 검사·내려받기)
  data/                 상품·가격 데이터, 홈 구성
  lib/                  가격 계산, 장바구니 저장, 인쇄용 PDF, 칼선 추출
  studio/               스튜디오 엔진 (템플릿, 시안 기획, 글꼴, 검사, PDF·SVG 출력)
public/studio/fonts/    스튜디오 글꼴 파일과 라이선스
docs/research/          레퍼런스 사이트 관찰 기록
```

## 한계

- 결제, 회원가입·로그인, 서버 저장, 관리자 기능이 없습니다.
- 상품 이미지와 재질 미리보기는 사진이 아니라 그림으로 그린 예시입니다.
- 사진·로고 이미지는 RGB 그대로 PDF에 들어갑니다. 글자·도형의 CMYK 값도 색상 프로파일 없이 계산식으로 바꾼 값이라, 실물 샘플로 색을 확인해야 합니다.
- Illustrator `.ai` 파일은 만들지 않습니다. PDF와 SVG만 제공합니다.
- 가격, 용지 특성, 디자인 의뢰 비용은 모두 샘플 값입니다.

## 기술 스택

Next.js 16 (App Router, 정적 export) · React 19 · TypeScript · Tailwind CSS v4 · pdf-lib · opentype.js · qrcode

## 라이선스 · 출처

- 프로젝트 뼈대는 [ai-website-cloner-template](https://github.com/JCodesMore/ai-website-cloner-template) (MIT, `LICENSE`)에서 시작했습니다.
- 레퍼런스 사이트는 구조와 동작만 참고했고, 로고·이미지·문구·브랜드 색은 사용하지 않았습니다.
- 글꼴은 모두 SIL Open Font License 1.1이며, 저작권 표기와 라이선스 전문은 `public/studio/fonts/`에 있습니다.
