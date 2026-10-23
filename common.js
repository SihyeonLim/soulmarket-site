/* =========================================================
   common.js : 모든 페이지가 함께 쓰는 "동작"
   - 헤더(로고·검색·메뉴)와 푸터를 그려 줘요.
     → 각 페이지에는 <div id="site-header"></div>, <div id="site-footer"></div>
       빈 자리만 두면 돼요. 메뉴를 고칠 때 이 파일 한 곳만 고치면 끝!
   - 반드시 data.js 다음에 불러와야 해요.
   - 데이터(JSON)를 다 불러온 뒤에 할 일은 onData(function () { ... }) 안에 적어요.
   ========================================================= */

// ---------------------------------------------------------
// 0. 연락처 (여기 한 곳만 고치면 헤더 · 푸터 · 상품 상세에 모두 반영돼요)
// ---------------------------------------------------------
const CONTACT = {
  phones: ['053-311-1980', '010-8388-8823'],
  email: 'soul1980@soulfd.co.kr',
  hours: '평일 07:30 ~ 16:30 · 주말/공휴일 휴무'
};
// 전화번호 묶음 (sep: 사이에 넣을 글자)
function phoneLinks(sep) {
  return CONTACT.phones.join(sep || ' / ');   // 링크 없이 글자로만 표시
}

// ---------------------------------------------------------
// 2. 자주 쓰는 작은 도구들
// ---------------------------------------------------------
// 숫자에 쉼표: 69900 → "69,900"
function won(n) { return Number(n).toLocaleString('ko-KR'); }

// 사용자가 입력한 글자를 화면에 안전하게 넣기 (< > 같은 기호 무력화)
function esc(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// 주소 뒤의 값 읽기: catalog.html?market=0002 → param('market') === '0002'
function param(name) { return new URLSearchParams(location.search).get(name); }

// 상품 사진 주소
// (관리자 페이지에서 올린 사진은 images/goods/파일명 으로 저장돼요)
function imgUrl(g) {
  const p = String(g.img || '').replace(/^\/+/, '');
  if (/^https?:/.test(p) || p.indexOf('images/') === 0) return p;
  return 'images/goods/' + p;
}

// 사진을 못 불러오면 마켓 이모지로 바꾸기 (img 태그의 onerror에서 호출)
function imgFail(img) {
  const ph = document.createElement('div');
  ph.className = 'ph';
  ph.textContent = img.dataset.ph || '🍽️';
  img.replaceWith(ph);
}

// ---------------------------------------------------------
// 2-0. 보관 방법 (냉동 / 냉장 / 상온) · 바코드
//      예전 상품의 "아이스박스 포장" 체크(ice)는 냉동 · 냉장으로 봐요.
// ---------------------------------------------------------
function storageOf(g) {
  if (g.storage) return g.storage;
  return g.ice ? '냉동 · 냉장' : '';
}
function isCold(g) { return storageOf(g).indexOf('냉') !== -1; }
const STORAGE_TEXT = {
  '냉동': '❄ 냉동 보관 (아이스박스 포장)',
  '냉장': '냉장 보관 (아이스박스 포장)',
  '상온': '상온 보관',
  '냉동 · 냉장': '❄ 냉동 · 냉장 (아이스박스 포장)'
};

// 바코드 번호 → EAN-13 바코드 그림(SVG). 13자리(또는 12자리)가 아니면 null
function barcodeSVG(code) {
  let d = String(code || '').replace(/\D/g, '');
  if (d.length !== 12 && d.length !== 13) return null;
  const n = d.slice(0, 12).split('').map(Number);
  const check = (10 - n.reduce(function (s, v, i) { return s + v * (i % 2 ? 3 : 1); }, 0) % 10) % 10;
  if (d.length === 13 && Number(d[12]) !== check) return null;   // 잘못된 번호
  d = d.slice(0, 12) + check;
  const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
  const P = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'][d[0]];
  let bits = '101';
  for (let i = 1; i <= 6; i++) bits += (P[i - 1] === 'L' ? L : G)[d[i]];
  bits += '01010';
  for (let i = 7; i <= 12; i++) bits += R[d[i]];
  bits += '101';
  const W = 2, X0 = 22, H = 64;   // 막대 1칸 2px, 왼쪽 여백 22px
  let rects = '';
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] !== '1') continue;
    const guard = i < 3 || (i >= 45 && i < 50) || i >= 92;
    rects += '<rect x="' + (X0 + i * W) + '" y="0" width="' + W + '" height="' + (guard ? H + 8 : H) + '"/>';
  }
  const t = function (x, s) { return '<text x="' + x + '" y="' + (H + 20) + '" text-anchor="middle">' + s + '</text>'; };
  return '<svg class="barcode-svg" viewBox="0 0 ' + (X0 * 2 + 95 * W) + ' ' + (H + 24) + '" role="img" aria-label="바코드 ' + d + '">' +
    '<g fill="#111">' + rects + '</g>' +
    '<g fill="#111" font-size="14" font-family="monospace">' +
      t(X0 - 10, d[0]) + t(X0 + (3 + 21) * W, d.slice(1, 7)) + t(X0 + (50 + 21) * W, d.slice(7)) +
    '</g></svg>';
}

// ---------------------------------------------------------
// 2-1. 상품 상태 (data.js 의 status: 품절 / 재고확보중 / 판매중지)
//      없으면 '정상'. 판매중지 상품은 목록·검색에 나오지 않아요.
// ---------------------------------------------------------
const STATUS = {
  '정상':      { buy: true },
  '품절':      { buy: false, cls: 'soldout', text: '품절',      msg: '현재 품절된 상품이에요. 입고 일정은 문의해 주세요' },
  '재고확보중': { buy: false, cls: 'restock', text: '재고확보중', msg: '재고를 확보하고 있어요. 입고 일정은 문의해 주세요' },
  '판매중지':   { buy: false, cls: 'stop',    text: '판매중지',   msg: '취급이 중지된 상품이에요', hide: true }
};
function goodsStatus(g) { return STATUS[g.status] ? g.status : '정상'; }
function canBuy(g) { return STATUS[goodsStatus(g)].buy; }
function isListed(g) { return !STATUS[goodsStatus(g)].hide; }
function listedGoods() { return allGoods().filter(isListed); }

// ---------------------------------------------------------
// 3. 알림 메시지 (화면 아래 검은 상자)
//    toast('검색어를 입력해 주세요')
// ---------------------------------------------------------
let toastTimer;
function toast(message, linkText, linkHref) {
  let box = document.getElementById('toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast';
    box.className = 'toast';
    document.body.appendChild(box);
  }
  box.innerHTML = '<span>' + esc(message) + '</span>' +
    (linkText ? '<a href="' + linkHref + '">' + esc(linkText) + ' ›</a>' : '');
  box.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { box.classList.remove('show'); }, 2600);
}

// ---------------------------------------------------------
// 4. 상품 카드 HTML (메인·목록·상세 어디서나 같은 모양)
//    가격은 data.js 의 SHOW_PRICE 가 true 일 때만 보여요.
// ---------------------------------------------------------
function goodsCardHTML(g, rank) {
  const market = MARKETS[g.market] || {};
  let tags = rank ? '<span class="tag rank">BEST ' + rank + '</span>' : '';
  g.tags.forEach(function (t) {
    if (t === 'BOX') return;   // BOX 는 박스 상품 분류용이라 사진 위에는 표시하지 않음
    let cls = 'tag';
    if (t === 'HACCP') cls += ' haccp';
    else if (t !== 'BOX') cls += ' origin';
    tags += '<span class="' + cls + '">' + esc(t) + '</span>';
  });

  let price = '', unit = '';
  if (SHOW_PRICE && g.price) {   // 가격이 0 이거나 비어 있으면 표시하지 않음
    price = '<p class="price">';
    if (g.rate) price += '<em class="rate">' + g.rate + '%</em>';
    price += won(g.price) + '<small>원</small>';
    if (g.was) price += '<del>' + won(g.was) + '원</del>';
    price += '</p>';
    if (g.box && g.boxUnit === '봉') unit = '<p class="unit">1봉당 약 ' + won(Math.round(g.price / g.box)) + '원</p>';
  }
  let ship = '';
  if (g.box) ship = '<span class="ship">1박스 ' + g.box + g.boxUnit + '</span>';

  const link = 'product.html?no=' + g.no;
  const st = STATUS[goodsStatus(g)];
  // 재고확보중·품절일 때 사진 위에 반투명 덮개
  const cover = st.buy ? '' : '<div class="status-cover ' + st.cls + '"><span>' + st.text + '</span></div>';
  return (
    '<li class="card' + (st.buy ? '' : ' unavailable') + '">' +
      '<div class="thumb">' +
        '<a href="' + link + '"><img src="' + imgUrl(g) + '" alt="' + esc(g.name) + '" data-ph="' + (market.icon || '') + '" onerror="imgFail(this)" loading="lazy">' + cover + '</a>' +
        '<div class="tags">' + tags + '</div>' +
      '</div>' +
      '<a class="info" href="' + link + '">' +
        '<p class="brand">' + esc(g.brand || market.name || '') + '</p>' +
        '<p class="name">' + esc(g.name) + '</p>' +
        price + unit + ship +
      '</a>' +
    '</li>'
  );
}

// 상품 정보가 아직 없는 자리에 넣는 예시 카드
function sampleCardHTML(market, num) {
  return (
    '<li class="card">' +
      '<div class="thumb"><div class="ph">' + market.icon + '</div></div>' +
      '<p class="brand">' + esc(market.name) + '</p>' +
      '<p class="name">예시 상품 ' + num + '</p>' +
      '<p class="price dim">상품 정보 준비 중</p>' +
    '</li>'
  );
}

// ---------------------------------------------------------
// 5. 헤더 그리기
//    body 태그의 data-current 값으로 지금 메뉴에 빨간 밑줄
//    예) <body data-current="0001">  /  "new"  /  "best"
// ---------------------------------------------------------
function renderHeader() {
  const holder = document.getElementById('site-header');
  if (!holder) return;
  const current = document.body.dataset.current || '';

  let menu = '';
  let mega = '';
  MARKET_ORDER.forEach(function (code) {
    const m = MARKETS[code];
    const href = 'catalog.html?market=' + code;
    menu += '<li><a href="' + href + '"' + (current === code ? ' class="current"' : '') + '>' + m.name + '</a></li>';
    mega += '<a href="' + href + '"><span class="m-icon">' + m.icon + '</span><span><b>' + m.name + '</b><small>' + m.desc + '</small></span></a>';
  });
  function cur(key) { return current === key ? ' class="current"' : ''; }

  holder.innerHTML =
    '<div class="top-bar"><div class="inner">' +
      '<p>식자재 전문 제조 · 무역 · 유통 법인 (주)소울푸드</p>' +
      '<ul>' +
        '<li>☎ ' + CONTACT.phones.join(' · ') + '</li>' +
      '</ul>' +
    '</div></div>' +
    '<header class="header"><div class="inner">' +
      '<a href="index.html" class="logo"><strong>소울푸드<img class="logo-mark" src="images/logo-mark.png" alt="SOUL FOOD"></strong><span>음식은 맛으로 먹는 것이 아니라 기억으로 먹는다.</span></a>' +
      '<form class="search" id="search-form">' +
        '<input type="search" name="q" placeholder="국산멸치, 납작만두, 편육을 검색해 보세요" value="' + esc(param('q') || '') + '">' +
        '<button type="submit">검색</button>' +
      '</form>' +
      '<nav class="header-icons">' +
        '<a href="cs.html"><span class="icon">✉️</span><span class="label">문의하기</span></a>' +
      '</nav>' +
    '</div></header>' +
    '<nav class="gnb"><div class="inner">' +
      '<ul>' +
        '<li><button type="button" class="all" id="mega-toggle" aria-expanded="false">☰ 전체</button></li>' +
        menu +
        '<li class="divider"></li>' +
        '<li><a href="catalog.html?list=new"' + cur('new') + '>신상품</a></li>' +
        '<li><a href="catalog.html?list=best"' + cur('best') + '>베스트</a></li>' +
      '</ul>' +
      '<div class="mega" id="mega">' + mega + '</div>' +
    '</div></nav>';
}

// ---------------------------------------------------------
// 6. 푸터 그리기
// ---------------------------------------------------------
function renderFooter() {
  const holder = document.getElementById('site-footer');
  if (!holder) return;
  holder.innerHTML =
    '<footer class="footer"><div class="inner">' +
      '<ul class="links">' +
        '<li><a href="info.html">회사소개</a></li>' +
      '</ul>' +
      '<ul class="company">' +
        '<li>회사명 : (주)소울푸드</li>' +
        '<li>대표자 : 임양섭</li>' +
        '<li>주소 : 경상북도 칠곡군 지천면 칠곡대로 2233-45</li>' +
        '<li>전화 : ' + CONTACT.phones.join(' / ') + '</li>' +
        '<li>사업자등록번호 : 504-81-82217</li>' +
        '<li>통신판매업신고 : 제2017 경북칠곡 0030호</li>' +
        '<li>이메일 : ' + CONTACT.email + '</li>' +
      '</ul>' +
      '<p class="copy">COPYRIGHT © (주)소울푸드 ALL RIGHTS RESERVED.</p>' +
    '</div></footer>';
}

// ---------------------------------------------------------
// 7. 클릭 처리를 한 곳에서 (이벤트 위임)
// ---------------------------------------------------------
document.addEventListener('click', function (e) {
  // "전체" 메뉴 열기/닫기
  const mega = document.getElementById('mega');
  const toggle = e.target.closest('#mega-toggle');
  if (toggle && mega) {
    const open = mega.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    return;
  }
  if (mega && mega.classList.contains('open') && !e.target.closest('#mega')) {
    mega.classList.remove('open');
  }
});

// Esc 키로 전체 메뉴 닫기
document.addEventListener('keydown', function (e) {
  const mega = document.getElementById('mega');
  if (e.key === 'Escape' && mega) mega.classList.remove('open');
});

// 검색: 검색어를 들고 목록 페이지로
document.addEventListener('submit', function (e) {
  if (e.target.id !== 'search-form') return;
  e.preventDefault();
  const q = e.target.q.value.trim();
  if (!q) { toast('검색어를 입력해 주세요'); return; }
  location.href = 'catalog.html?q=' + encodeURIComponent(q);
});

// ---------------------------------------------------------
// 8. 데이터를 다 불러온 뒤 실행하기
//    onData(function () { ... })  ← 각 페이지의 상품 그리기 코드
// ---------------------------------------------------------
function showDataError(err) {
  console.error(err);
  const box = document.createElement('div');
  box.className = 'inner';
  box.innerHTML = '<div class="empty"><div class="big">⚠️</div><p>상품 정보를 불러오지 못했어요. 잠시 후 새로고침해 주세요.</p>' +
    '<p style="font-size:13px;color:var(--text-sub)">문의 : ' + phoneLinks() + '</p></div>';
  const footer = document.getElementById('site-footer');
  if (footer) footer.parentNode.insertBefore(box, footer); else document.body.appendChild(box);
}
let dataErrorShown = false;
function onData(fn) {
  return DATA_READY.then(fn).catch(function (err) {
    if (!dataErrorShown) { dataErrorShown = true; showDataError(err); }
  });
}

// ---------------------------------------------------------
// 9. 페이지가 열리면 푸터는 바로, 헤더(마켓 메뉴)는 데이터를 불러온 뒤 그리기
// ---------------------------------------------------------
renderFooter();
onData(renderHeader);
