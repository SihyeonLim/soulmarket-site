#!/usr/bin/env python3
"""data/goods/ 폴더의 상품 파일(번호.json)을 모아 data/goods.json 하나로 만듭니다.

- 사이트는 data/goods.json 을 읽어요. 이 파일은 자동으로 만들어지니 직접 고치지 마세요.
- GitHub 에 올리면 배포할 때 자동으로 실행돼요 (.github/workflows/pages.yml).
- 내 컴퓨터에서 미리 볼 때만 직접 실행하세요:  python3 tools/build_data.py
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'data', 'goods')
OUT = os.path.join(ROOT, 'data', 'goods.json')

goods, problems, seen = [], [], {}
for name in sorted(os.listdir(SRC)):
    if not name.endswith('.json'):
        continue
    path = os.path.join(SRC, name)
    try:
        with open(path, encoding='utf-8') as f:
            g = json.load(f)
    except Exception as e:                      # 깨진 파일은 건너뛰고 알려주기
        problems.append('%s: 읽을 수 없음 (%s)' % (name, e))
        continue
    try:
        g['no'] = int(g.get('no'))
    except (TypeError, ValueError):
        problems.append('%s: 상품 번호가 없음' % name)
        continue
    if not g.get('name') or not g.get('market'):
        problems.append('%s: 상품명 또는 마켓이 비어 있음' % name)
        continue
    if g['no'] in seen:
        problems.append('%s: 상품 번호 %d 가 %s 와 겹침 (이 파일은 건너뜀)' % (name, g['no'], seen[g['no']]))
        continue
    seen[g['no']] = name
    # 빈 값 정리
    g = {k: v for k, v in g.items() if v not in (None, '', [])}
    goods.append(g)

def order_key(g):
    try:
        order = float(g.get('order'))
    except (TypeError, ValueError):
        order = 1e9                              # 순서가 없으면 맨 뒤
    return (order, -g['no'])

goods.sort(key=order_key)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump({'goods': goods}, f, ensure_ascii=False, separators=(',', ':'))

print('상품 %d개 → data/goods.json' % len(goods))
for p in problems:
    print('  주의:', p)
sys.exit(0)
