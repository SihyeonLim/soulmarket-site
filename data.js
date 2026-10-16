/* =========================================================
   data.js : 사이트 데이터 불러오기
   - 실제 데이터는 data 폴더의 JSON 파일에 있어요.
       data/markets.json  마켓(카테고리) 목록 · 순서 · 색 · 필터 버튼
       data/goods.json    상품 목록 (위에 있을수록 "랭킹순" 앞쪽)
       data/site.json     사이트 설정 (가격 표시 여부)
   - 관리자 페이지(/admin)에서 고치면 이 JSON 파일들이 바뀌고,
     1~2분 뒤 사이트에 반영돼요. 직접 JSON 을 고쳐도 돼요.
   - 상품 항목
       no       상품 번호 (겹치지 않게)       market  마켓 코드 (0001 등)
       img      사진 경로 (images/goods/...)  price   가격  was/rate 원래 가격/할인율
       box / boxUnit  1박스에 든 개수 / 단위   ice     아이스박스 포장 여부
       tags     카드 위 태그   desc  생산지·인증 정보   sold  판매량(베스트 순서용)
       status   품절 / 재고확보중 / 판매중지 (비우면 정상)
   ========================================================= */

let MARKET_ORDER = [];   // 메뉴 순서
let MARKETS = {};        // { '0001': { name, ..., goods: [...] } }
let SHOW_PRICE = false;  // 가격 표시 여부 (data/site.json)

function loadJSON(path) {
  // no-cache: 관리자가 고친 내용이 바로 보이도록 매번 최신인지 확인
  return fetch(path, { cache: 'no-cache' }).then(function (r) {
    if (!r.ok) throw new Error(path + ' (' + r.status + ')');
    return r.json();
  });
}

const DATA_READY = Promise.all([
  loadJSON('data/markets.json'),
  loadJSON('data/goods.json'),
  loadJSON('data/site.json')
]).then(function (res) {
  const markets = res[0].markets || [];
  const goods = res[1].goods || [];
  const site = res[2] || {};

  markets.forEach(function (m) {
    if (!m || !m.code) return;
    m.colors = (m.colors && m.colors.length >= 2) ? m.colors : ['#D7282F', '#8E1519'];
    m.chips = (m.chips || []).map(function (c) { return { label: c.label, words: c.words || [] }; });
    m.goods = [];
    MARKETS[m.code] = m;
    MARKET_ORDER.push(m.code);
  });

  goods.forEach(function (g) {
    if (!g || !MARKETS[g.market]) return;        // 마켓이 없는 상품은 건너뜀
    g.no = Number(g.no);
    if (!g.no || !g.name) return;                // 번호·이름 없는 상품은 건너뜀
    g.tags = g.tags || [];
    g.brand = g.brand || '';
    g.price = Number(g.price) || 0;
    if (!g.status) delete g.status;
    MARKETS[g.market].goods.push(g);
  });

  MARKET_ORDER.forEach(function (code) { MARKETS[code].count = MARKETS[code].goods.length; });
  SHOW_PRICE = site.show_price === true;
});

// ---------------------------------------------------------
// 데이터를 찾아 주는 도우미 함수들 (데이터를 불러온 뒤에 사용)
// ---------------------------------------------------------

// 모든 마켓의 상품을 한 줄로 모으기
function allGoods() {
  const list = [];
  MARKET_ORDER.forEach(function (code) {
    MARKETS[code].goods.forEach(function (g) { list.push(g); });
  });
  return list;
}

// 상품 번호로 상품 하나 찾기 (없으면 null)
function findGoods(no) {
  no = Number(no);
  return allGoods().find(function (g) { return g.no === no; }) || null;
}
