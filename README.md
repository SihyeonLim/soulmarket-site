# 소울푸드 소개 사이트 (GitHub Pages)

(주)소울푸드 거래처 소개용 정적 사이트입니다. 결제·로그인 없이 상품 소개와 전화/이메일 문의만 제공합니다.

## 폴더 구성
| 파일/폴더 | 설명 |
|---|---|
| `index.html`, `catalog.html`, `product.html`, `cs.html`, `info.html` | 메인 / 상품 목록 / 상품 상세 / 문의하기 / 회사소개 |
| `data/goods/번호.json` | 상품 1개당 파일 1개 (관리자 페이지에서 편집) |
| `data/markets.json` · `data/site.json` | 마켓(카테고리) / 사이트 설정(가격 표시) |
| `data.js` | 위 데이터를 불러오는 코드 |
| `tools/build_data.py` | 상품 파일들을 모아 `data/goods.json` 을 만드는 스크립트 (배포 때 자동 실행) |
| `.github/workflows/pages.yml` | 저장할 때마다 자동 배포하는 설정 |
| `admin/` | 관리자 페이지 (`/admin/`) |
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
관리자 페이지의 **사이트 설정 → 가격 표시**에서 켜고 끕니다. (기본: 숨김)
켜기 전에 상품 가격이 맞는지 확인하세요.

## 배포
1. GitHub 저장소를 만들고 이 폴더의 **내용물 전체**를 올립니다 (`index.html` 이 저장소 맨 위에 있어야 합니다).
2. 저장소 Settings → Pages → **Source 를 `GitHub Actions`** 로 지정합니다. (상품 목록을 자동으로 만들기 위해 꼭 필요)
3. Custom domain 에 `soulmarket.co.kr` 을 입력합니다. (`CNAME` 파일은 이미 들어 있습니다.)
4. 가비아 DNS 에서 A 레코드 4개와 www CNAME 을 GitHub 쪽으로 바꿉니다.
   IP 값은 GitHub Docs 의 "Managing a custom domain for your GitHub Pages site" 에서 최신 값을 확인하세요.
5. 사이트가 정상 표시되면 "Enforce HTTPS" 를 켭니다.
6. 새 사이트 확인이 끝난 뒤에 가비아 호스팅을 해지합니다. (도메인은 계속 갱신해야 합니다.)

## 관리자 페이지 (/admin)
`https://soulmarket.co.kr/admin/` 에서 상품 추가·수정·삭제, 사진 업로드, 마켓 관리, 가격 표시 설정을 할 수 있습니다.
저장하면 GitHub 저장소에 자동으로 커밋되고 1~2분 뒤 사이트에 반영됩니다.

### 처음 한 번: 로그인용 토큰 만들기
1. GitHub 오른쪽 위 프로필 → **Settings** → 왼쪽 맨 아래 **Developer settings**
2. **Personal access tokens → Fine-grained tokens → Generate new token**
3. Token name: `soulmarket-admin`, Expiration: 원하는 기간 (만료되면 새로 만들면 됩니다)
4. Repository access: **Only select repositories** → `soulmarket-site`
5. Permissions → Repository permissions → **Contents: Read and write**
6. **Generate token** 을 누르고 나온 토큰을 복사합니다. (다시 볼 수 없으니 안전한 곳에 보관)

### 로그인
`/admin/` 에서 **Sign In with Token** 을 누르고 토큰을 붙여 넣습니다.
- 토큰은 그 컴퓨터의 브라우저에만 저장됩니다. 공용 PC에서는 쓰지 말고, 다 쓰면 로그아웃하세요.
- 토큰이 없는 사람은 관리자 페이지를 열어도 아무것도 바꿀 수 없습니다.
- 토큰이 유출되면 GitHub 의 같은 화면에서 바로 삭제(Revoke)하세요.

### 사용 요령
- 왼쪽 **상품** 메뉴: 오른쪽 위 **새 상품**으로 추가하고, 목록에서 상품을 누르면 수정 화면이 열립니다.
  상품명 · 마켓 · 사진 · 한 줄 소개 · 상세 설명 · 상세 이미지 · 포장 정보 · 상태를 입력할 수 있습니다.
- 상품 번호는 다른 상품과 겹치지 않게 넣으세요. (겹치면 배포할 때 뒤의 것이 빠집니다)
- **진열 순서** 숫자가 작을수록 '랭킹순'에서 앞에 나옵니다. 새 상품은 기본 0 이라 맨 앞에 나옵니다.
- 상품 상태를 **판매중지**로 하면 사이트에서 숨겨집니다. (삭제하지 않고 숨기기)
- 새 마켓을 만들면, 상품의 '마켓' 선택지에 나오도록 `admin/config.yml` 의 options 에 한 줄을 추가해야 합니다.

## 로컬에서 미리보기
상품 정보를 JSON 으로 불러오기 때문에 html 파일을 더블클릭해서는 상품이 보이지 않습니다. 폴더에서 아래를 실행하세요.

    python3 tools/build_data.py
    python3 -m http.server 8000

브라우저에서 http://localhost:8000 을 엽니다.

## 연락처 바꾸기
전화번호 · 이메일 · 상담 시간은 `common.js` 맨 위 `CONTACT` 에서 바꿉니다. (`cs.html`, `index.html` 의 문의 안내 문구도 함께 고쳐 주세요)
