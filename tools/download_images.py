#!/usr/bin/env python3
"""상품 이미지를 기존 소울마켓 서버에서 내려받아 images/goods/ 에 저장합니다.

★ 가비아 호스팅을 해지하기 "전에", 인터넷이 되는 본인 컴퓨터에서 실행하세요.
   (도메인을 GitHub 로 돌린 뒤에는 기존 이미지 주소가 사라져 내려받을 수 없어요.)

사용법 (프로젝트 폴더 안에서):
    python3 tools/download_images.py

- 이미 받은 파일은 건너뛰어서, 중간에 멈춰도 다시 실행하면 이어서 받아요.
- 끝나면 실패한 파일 목록을 보여줘요.
"""
import os, sys, time, urllib.request, urllib.error

BASE = os.environ.get('IMG_BASE', 'https://soulmarket.co.kr/data/goods/1/')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIST = os.path.join(ROOT, 'tools', 'image-list.txt')
OUT = os.path.join(ROOT, 'images', 'goods')

names = [l.strip() for l in open(LIST, encoding='utf-8') if l.strip()]
ok = skipped = 0
failed = []
for i, name in enumerate(names, 1):
    dest = os.path.join(OUT, *name.split('/'))
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        skipped += 1
        continue
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        req = urllib.request.Request(BASE + name, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
            ctype = r.headers.get('Content-Type', '')
        if not ctype.startswith('image/') or not data:
            raise ValueError('이미지가 아님 (%s)' % ctype)
        with open(dest, 'wb') as f:
            f.write(data)
        ok += 1
        print('[%d/%d] 저장 %s' % (i, len(names), name))
    except (urllib.error.URLError, ValueError, OSError) as e:
        failed.append((name, str(e)))
        print('[%d/%d] 실패 %s : %s' % (i, len(names), name, e))
    time.sleep(0.1)

print('\n완료: 새로 %d개, 건너뜀 %d개, 실패 %d개 (전체 %d개)' % (ok, skipped, len(failed), len(names)))
for n, e in failed:
    print('  실패:', n, '-', e)
sys.exit(1 if failed else 0)
