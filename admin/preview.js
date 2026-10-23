/* =========================================================
   관리자 화면 오른쪽 미리보기 (상품)
   - 상품을 입력하는 동안 실제 사이트 상품 상세 페이지와
     목록 카드 모양으로 바로 보여줘요.
   - 사이트 디자인(common.css)을 그대로 불러와 써요.
   ========================================================= */
(function () {
  if (!window.CMS) return;
  var h = window.h || CMS.h || (CMS.React && CMS.React.createElement);
  if (!h) return;

  // 사이트 주소 기준 경로 (…/admin/ 의 한 단계 위)
  var SITE = new URL('../', location.href).href;
  var CONTACT = { phones: ['053-311-1980', '010-8388-8823'], email: 'soul1980@soulfd.co.kr' };
  var STATUS = {
    '품절': { cls: 'soldout', msg: '⛔ 현재 품절된 상품이에요. 입고 일정은 문의해 주세요' },
    '재고확보중': { cls: 'restock', msg: '🔄 재고를 확보하고 있어요. 입고 일정은 문의해 주세요' },
    '판매중지': { cls: 'stop', msg: '⛔ 판매중지 상품은 사이트 목록에 보이지 않아요' }
  };

  // 사이트 디자인 불러오기
  CMS.registerPreviewStyle('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
  CMS.registerPreviewStyle(SITE + 'common.css');
  CMS.registerPreviewStyle(SITE + 'admin/preview.css');

  // 마켓 이름 · 아이콘
  var markets = {};
  var showPrice = false;
  fetch(SITE + 'data/markets.json', { cache: 'no-cache' }).then(function (r) { return r.json(); })
    .then(function (d) { (d.markets || []).forEach(function (m) { markets[m.code] = m; }); }).catch(function () {});
  fetch(SITE + 'data/site.json', { cache: 'no-cache' }).then(function (r) { return r.json(); })
    .then(function (d) { showPrice = d.show_price === true; }).catch(function () {});

  function won(n) { return Number(n).toLocaleString('ko-KR'); }

  // 보관 방법 · 바코드 (사이트 common.js 와 같은 규칙)
  var STORAGE_TEXT = { '냉동': '❄ 냉동 보관', '냉장': '냉장 보관', '상온': '상온 보관' };
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

  function toJS(v) { return v && typeof v.toJS === 'function' ? v.toJS() : v; }

  // 사진 주소: 방금 올린 사진(아직 저장 전)도 보이게 getAsset 먼저
  function imageUrl(getAsset, path) {
    if (!path) return '';
    try {
      var a = getAsset(path);
      var u = a && (a.url || (typeof a.toString === 'function' ? a.toString() : ''));
      if (u && u !== '[object Object]') return u;
    } catch (e) {}
    if (/^(https?:|blob:|data:)/.test(path)) return path;
    var p = String(path).replace(/^\/+/, '');
    if (p.indexOf('images/') !== 0) p = 'images/goods/' + p;
    return SITE + p;
  }

  function Photo(props) {
    var cover = props.status ? h('div', { className: 'status-cover ' + props.status.cls }, h('span', null, props.statusText)) : null;
    return props.src
      ? h('div', { className: props.className }, h('img', { src: props.src, alt: '' }), cover)
      : h('div', { className: props.className }, h('div', { className: 'ph' }, props.icon || '🍽️'), cover);
  }

  function GoodsPreview(props) {
    var entry = props.entry, getAsset = props.getAsset;
    var d = toJS(entry.get('data')) || {};
    var m = markets[d.market] || { name: d.market ? '마켓 ' + d.market : '마켓을 선택하세요', icon: '🛍️' };
    var st = STATUS[d.status] || null;
    var tags = (d.tags || []).filter(function (t) { return t && t !== 'BOX'; });
    var img = imageUrl(getAsset, d.img);
    var details = (d.detail_images || []).map(function (p) { return imageUrl(getAsset, p); }).filter(Boolean);

    var rows = [];
    var storage = d.storage && d.storage !== '없음' ? d.storage : '';
    var pack = [];
    if (d.box) pack.push('1박스 ' + d.box + (d.boxUnit || ''));
    if (d.ice) pack.push('아이스박스 포장');
    if (pack.length) rows.push(h('div', { key: 'box' }, h('dt', null, '포장'), h('dd', null, pack.join(' · '))));
    if (storage) rows.push(h('div', { key: 'st' }, h('dt', null, '보관'), h('dd', null, STORAGE_TEXT[storage] || storage)));
    if (Number(d.shelf_life) > 0) rows.push(h('div', { key: 'sl' }, h('dt', null, '소비기한'), h('dd', null, Number(d.shelf_life) + (d.shelf_life_unit || '개월') + ' 이내')));
    var barcode = null;
    if (d.barcode) {
      var svg = barcodeSVG(d.barcode);
      barcode = svg
        ? h('div', { className: 'barcode', dangerouslySetInnerHTML: { __html: svg } })
        : h('div', { className: 'barcode' }, h('span', { className: 'barcode-num' }, d.barcode + ' (13자리 바코드 번호가 아니에요)'));
    }

    var priceBox = null;
    if (d.price) {
      priceBox = h('div', { className: 'price-box' + (showPrice ? '' : ' pv-dim') },
        h('p', { className: 'now' },
          d.rate ? h('em', { className: 'rate' }, d.rate + '%') : null,
          won(d.price), h('small', null, '원'),
          d.was ? h('del', null, won(d.was) + '원') : null),
        showPrice ? null : h('p', { className: 'unit' }, '※ 지금은 가격 표시가 꺼져 있어 사이트에는 보이지 않아요'));
    }

    return h('div', { className: 'pv' },
      // ---------- 안내 띠
      h('p', { className: 'pv-label' }, '미리보기 · 상품 상세 페이지'),
      !d.name ? h('p', { className: 'pv-warn' }, '상품명을 입력해 주세요') : null,
      !d.no ? h('p', { className: 'pv-warn' }, '상품 번호를 입력해 주세요 (다른 상품과 겹치지 않게)') : null,

      // ---------- 상세 페이지
      h('p', { className: 'breadcrumb' }, '홈 › ' + m.name + (d.brand ? ' › ' + d.brand : '')),
      h('section', { className: 'detail' },
        h(Photo, { className: 'photo', src: img, icon: m.icon, status: st, statusText: d.status }),
        h('div', { className: 'buy' },
          h('span', { className: 'market-link' }, (m.icon || '') + ' ' + m.name + ' ›'),
          h('h1', null, (d.brand ? '[' + d.brand + '] ' : '') + (d.name || '상품명')),
          tags.length ? h('div', { className: 'tags' }, tags.map(function (t) {
            return h('span', { key: t, className: 'tag' + (t === 'HACCP' ? ' haccp' : ' origin') }, t);
          })) : null,
          d.desc ? h('p', { className: 'desc' }, d.desc) : null,
          st ? h('p', { className: 'state-note ' + st.cls }, st.msg) : null,
          priceBox,
          rows.length ? h('dl', { className: 'rows' }, rows) : null,
          barcode,
          h('div', { className: 'actions' },
            h('span', { className: 'btn btn-primary' }, '📞 ' + CONTACT.phones[0]),
            h('span', { className: 'btn btn-primary' }, '📱 ' + CONTACT.phones[1]),
            h('span', { className: 'btn mail' }, '✉️ 이메일 문의 · ' + CONTACT.email)))),

      h('section', { className: 'tab-panel on' },
        h('h4', null, '상품명'), h('p', null, d.name || '-'),
        d.desc ? [h('h4', { key: 'dh' }, '생산 · 인증 정보'), h('p', { key: 'dp' }, d.desc)] : null,
        d.detail ? [h('h4', { key: 'th' }, '상세 설명'), h('p', { key: 'tp', className: 'detail-text' }, d.detail)] : null,
        details.length ? h('div', { className: 'detail-imgs' }, details.map(function (u, i) { return h('img', { key: i, src: u, alt: '' }); })) : null),

      // ---------- 목록 카드
      h('p', { className: 'pv-label' }, '미리보기 · 상품 목록 카드'),
      h('ul', { className: 'goods pv-cards' },
        h('li', { className: 'card' + (st ? ' unavailable' : '') },
          h('div', { className: 'thumb' },
            h(Photo, { className: 'pv-thumb', src: img, icon: m.icon, status: st, statusText: d.status }),
            tags.length ? h('div', { className: 'tags' }, tags.map(function (t) {
              return h('span', { key: t, className: 'tag' + (t === 'HACCP' ? ' haccp' : ' origin') }, t);
            })) : null),
          h('div', { className: 'info' },
            h('p', { className: 'brand' }, d.brand || m.name),
            h('p', { className: 'name' }, d.name || '상품명'),
            showPrice && d.price ? h('p', { className: 'price' }, won(d.price), h('small', null, '원')) : null,
            d.box ? h('span', { className: 'ship' }, '1박스 ' + d.box + (d.boxUnit || '')) : null))));
  }

  CMS.registerPreviewTemplate('goods', GoodsPreview);
})();
