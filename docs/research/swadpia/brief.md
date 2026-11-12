# swadpia.co.kr — homepage brief

Captured 2026-11-12 from https://www.swadpia.co.kr/ (desktop, 1280×800 emulated; the source is a fixed-width site: `body` min-width 1090px, `header/main/footer` min-width 1180px, no responsive breakpoints below that).

## Route map

| Source | Local | Owner files |
| --- | --- | --- |
| `https://www.swadpia.co.kr/` | `/` | `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/sites/swadpia/*`, `public/sites/swadpia/**` |

All other destinations (goods pages, boards, member pages, adpiamall.com, etc.) are out of scope and keep pointing at the source via `src()` in `data.ts`.

## Typography / tokens

- Font: **Pretendard** (source names it "Pretandard"), weights 100–900 self-hosted as woff2 → `public/sites/swadpia/images/2025/font/`. Body falls back to Dotum 12px #666 (old reset) — every visible element overrides it.
- Brand blue `#335cff` (hover `#3c62fa`, light `#f0f3ff`), surface grey `#f4f5f7`, hairline `#edeef0` / `#e6e7eb`.
- Christmas skin was live at capture: header bg gif (1920×165, bottom center), top banner `#87201e`, buttons `#056839`. `SwadpiaHeader` takes `christmas={false}` to switch to the default blue skin (default logo / hamburger SVGs are included).
- Container `.max-1180` (1180px centered). Page total height 3683px.

## Section order (desktop, top offsets in px)

| # | Section | Top | Height | Notes |
| --- | --- | --- | --- | --- |
| 0 | `.banner_top` | 0 | 40 | Swiper fraction "1 / 2", autoplay 5s, loop, close X hides it |
| 0 | `.header_wrap` | 40 | 115 | logo 156×23, 회원가입/로그인/basket |
| 0 | `.gnb_2025` | 155 | 50 | hamburger + 5 category buttons (click toggles mega menu) + 셀프디자인/실사출력; right: 이용방법 dropdown (click), 고객센터, 웹하드 |
| 1 | `.sec01` hero | 205 | 480 | Swiper `slidesPerView:auto`, centered, gap 30, loop, autoplay 5s, fraction pagination bottom-left, round arrows outside the 1180 slide, white notice card 310px at right |
| 2 | `.sec02` 빠른 서비스 | 720 | 156 | shadow card, 7 buttons 114×114 |
| 3 | `.sec03` 인기상품 | 876 | 614 | 5-up Swiper gap 13, loop, numbered badges, arrows above-right |
| 4 | `.sec04` 추천상품 | 1490 | 614 | same slider, 12 items |
| 5 | `.sec05` 애드피아몰 신상품 | 2104 | 649 | 4-up (285×384) autoplay 3s, hover overlay card, arrows outside at ±21px |
| 6 | `.sec06` 셀프 디자인 | 2753 | 514 | 5 static cards 225×250 with hover overlay |
| — | `footer` | 3428 | 296 | left: links/company info; right: 4 buttons + video banner, SNS icons, 성원택배, FAMILY SITE dropdown (opens upward on click) |
| — | `.abs > .floating_box` | 715 | 308 | sticky side menu at `max(1190px, (100% − 1180)/2 + 1180 + clamp(20px, 19px + 6%, 12%))` |

## Mega menu

`.menu_box` is absolutely positioned under `.gnb_2025`; `.inner_box` height depends on the active tab (type01 575 / type02 501 / type03 385 / type04 357 / type05–06 356). Below it `.outer_box` (126px): "나만의 메뉴보기" with 9 empty cards and a 별도견적 box. Link columns are generated from `menu-data.ts` (parsed from the source markup); promo banners per tab live in `MegaMenu.tsx`.

## Interactions reproduced

- Top banner: autoplay/loop/prev/next/fraction, close.
- Hero: autoplay/loop/prev/next/fraction; slide click navigates to the source board post.
- Notice list hover (indent + blue highlight), icon buttons (세금계산서 shows the source alert text).
- Product sliders: prev/next with loop; disabled state dims arrow to 35%.
- sec05 autoplay + hover overlay; sec06 hover overlay; arrow button fills blue on hover.
- Mega menu open/close per category; hamburger shows X; click outside closes.
- 이용방법 dropdown, FAMILY SITE dropdown, floating TOP button (smooth scroll).

## Assets

113 files in `public/sites/swadpia/` mirroring the source paths (`images/2025/...`, `uploads/banner/...`, and `img/...` for image.swadpia.co.kr). Full mapping in `asset_map.txt`. Raw inputs kept here: `source.html`, `body_stripped.html`, `css/*.css`, `menu.json`.

## Known gaps

- Popups (`#popup_main2` promo, app-install warning) and the "나만의 메뉴" / 별도견적 logged-in features are not reproduced.
- Hover-only "best"/"new" tag images and card hover text come from the source assets; the `sec02` icon SVGs embed rasters and are large (0.5–5 MB each), as on the source.
- Footer `사업자정보확인` opens the FTC lookup for the registered number; source does the same via its own script.
