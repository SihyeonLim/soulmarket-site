# 소울푸드 소개 사이트 (GitHub Pages)

(주)소울푸드 거래처 소개용 정적 사이트입니다. 결제·로그인 없이 상품 소개와 전화/이메일 문의만 제공합니다.

## 폴더 구성
| 파일/폴더 | 설명 |
|---|---|
| `index.html`, `catalog.html`, `product.html`, `cs.html`, `info.html` | 메인 / 상품 목록 / 상품 상세 / 문의하기 / 회사소개 |
| `data.js` | 마켓·상품 정보, 그리고 **가격 표시 스위치 `SHOW_PRICE`** |
| `common.js`, `common.css` | 공통 헤더·푸터·상품 카드 / 공통 디자인 |
| `images/goods/` | 상품 이미지 (아래 1번 참고) |
| `CNAME` | 연결할 도메인 (`soulmarket.co.kr`) |
| `.nojekyll`, `404.html` | GitHub Pages 설정 / 없는 주소 안내 페이지 |
| `tools/download_images.py` | 기존 서버에서 상품 이미지를 내려받는 스크립트 |

## 올리기 전에 꼭 할 일

### 1. 상품 이미지 내려받기 (가비아 해지 전에!)
상품 이미지 118장은 지금 기존 서버(`soulmarket.co.kr/data/goods/1/…`)에 있습니다.
도메인을 GitHub로 돌리면 그 주소가 사라지므로, **호스팅을 해지하기 전에** 이 폴더에서 아래를 실행하세요.

    python3 tools/download_images.py

- `images/goods/` 아래에 같은 폴더 구조(예: `2026/07/xxx.PNG`)로 저장됩니다.
- 중간에 멈춰도 다시 실행하면 이어서 받습니다. 끝에 실패 목록이 나옵니다.
- 이미지가 없는 상품은 사진 대신 마켓 아이콘이 표시됩니다.

### 2. 가격 표시 여부 정하기
`data.js` 위쪽의 `const SHOW_PRICE = false;` 를 바꾸면 됩니다. (기본: 숨김)
`true` 로 바꾸면 가격과 가격순 정렬이 나타납니다. 켜기 전에 `data.js` 의 가격이 맞는지 확인하세요.

## 배포
1. GitHub 저장소를 만들고 이 폴더의 **내용물 전체**를 올립니다 (`index.html` 이 저장소 맨 위에 있어야 합니다).
2. 저장소 Settings → Pages → Source 를 `main` 브랜치 / `/ (root)` 로 지정합니다.
3. Custom domain 에 `soulmarket.co.kr` 을 입력합니다. (`CNAME` 파일은 이미 들어 있습니다.)
4. 가비아 DNS 에서 A 레코드 4개와 www CNAME 을 GitHub 쪽으로 바꿉니다.
   IP 값은 GitHub Docs 의 "Managing a custom domain for your GitHub Pages site" 에서 최신 값을 확인하세요.
5. 사이트가 정상 표시되면 "Enforce HTTPS" 를 켭니다.
6. 새 사이트 확인이 끝난 뒤에 가비아 호스팅을 해지합니다. (도메인은 계속 갱신해야 합니다.)

## 로컬에서 미리보기
    python3 -m http.server 8000
브라우저에서 http://localhost:8000 을 엽니다.
