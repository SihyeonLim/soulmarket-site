#!/usr/bin/env python3
"""기존 소울마켓 사이트의 '상세설명' 사진들을 가져와 각 상품에 넣습니다.

★ 가비아 호스팅을 해지하기 "전에", 인터넷이 되는 본인 컴퓨터에서 실행하세요.
   (기존 사이트가 꺼지면 상세 사진을 더 이상 받을 수 없어요.)

사용법 (저장소 폴더 안에서):
    python3 tools/import_detail_images.py            # 상세 사진이 비어 있는 상품만
    python3 tools/import_detail_images.py --force    # 이미 있는 상품도 다시 받기
    python3 tools/import_detail_images.py 610 611    # 특정 상품 번호만

하는 일
  1. 상품마다 https://soulmarket.co.kr/goods/view_contents?no=번호 페이지를 열어
     상세설명 사진(/data/editor/...) 주소를 순서대로 찾아요.
  2. 사진을 images/detail/번호/ 폴더에 저장해요.
     - Pillow 가 설치돼 있으면(pip install Pillow) 가로 1000px 이하 JPG 로 줄여서
       저장소 용량을 크게 아껴요. 없으면 원본 그대로 저장해요.
  3. data/goods/번호.json 의 "상세 이미지"(detail_images)에 사진 경로를 넣어요.
     → 관리자 페이지에서 순서 변경 · 삭제 · 추가를 할 수 있어요.
  끝나면 GitHub Desktop 에서 Commit → Push 하세요.
"""
import io, json, os, re, sys, time, urllib.request, urllib.error
from urllib.parse import urljoin

BASE = os.environ.get('SOUL_BASE', 'https://soulmarket.co.kr/')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GOODS = os.path.join(ROOT, 'data', 'goods')
OUT = os.path.join(ROOT, 'images', 'detail')
MAX_W = 1000

try:
    from PIL import Image
except ImportError:
    Image = None

def get(url, timeout=30):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers.get('Content-Type', '')

def find_images(no):
    html, _ = get(urljoin(BASE, 'goods/view_contents?no=%d&zoom=1' % no))
    html = html.decode('utf-8', 'replace')
    urls = []
    for m in re.finditer(r'<img[^>]+src\s*=\s*["\']([^"\']+)["\']', html, re.I):
        src = m.group(1).strip()
        if '/data/editor/' not in src:          # 버튼·아이콘 등은 제외
            continue
        u = urljoin(BASE, src)
        if u not in urls:
            urls.append(u)
    return urls

def save_image(data, dest_base):
    """저장한 파일 경로(확장자 포함)를 돌려줌"""
    if Image is not None:
        try:
            im = Image.open(io.BytesIO(data))
            im.load()
            if im.mode in ('RGBA', 'LA', 'P'):
                im = im.convert('RGBA')
                bg = Image.new('RGB', im.size, (255, 255, 255))
                bg.paste(im, mask=im.split()[-1])
                im = bg
            else:
                im = im.convert('RGB')
            if im.width > MAX_W:
                im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
            path = dest_base + '.jpg'
            im.save(path, 'JPEG', quality=85, optimize=True, progressive=True)
            return path
        except Exception:
            pass                                 # 변환 실패 시 원본 저장
    ext = '.png' if data[:8] == b'\x89PNG\r\n\x1a\n' else ('.gif' if data[:4] == b'GIF8' else '.jpg')
    path = dest_base + ext
    with open(path, 'wb') as f:
        f.write(data)
    return path

def main(argv):
    force = '--force' in argv
    only = {int(a) for a in argv if a.isdigit()}
    files = sorted(f for f in os.listdir(GOODS) if f.endswith('.json'))
    done = skipped = empty = 0
    failed = []
    total_bytes = 0
    for i, name in enumerate(files, 1):
        path = os.path.join(GOODS, name)
        with open(path, encoding='utf-8') as f:
            g = json.load(f)
        try:
            no = int(g.get('no'))
        except (TypeError, ValueError):
            continue
        if only and no not in only:
            continue
        if g.get('detail_images') and not force:
            skipped += 1
            continue
        try:
            urls = find_images(no)
        except (urllib.error.URLError, OSError) as e:
            failed.append((no, '페이지를 열 수 없음: %s' % e))
            print('[%d/%d] %d 실패 (페이지)' % (i, len(files), no))
            continue
        if not urls:
            empty += 1
            print('[%d/%d] %d 상세 사진 없음' % (i, len(files), no))
            continue
        folder = os.path.join(OUT, str(no))
        os.makedirs(folder, exist_ok=True)
        saved = []
        for k, u in enumerate(urls, 1):
            try:
                data, ctype = get(u, timeout=60)
                if not data or not (ctype.startswith('image/') or data[:4] in (b'\x89PNG', b'GIF8') or data[:2] == b'\xff\xd8'):
                    raise ValueError('이미지가 아님 (%s)' % ctype)
                p = save_image(data, os.path.join(folder, '%02d' % k))
                total_bytes += os.path.getsize(p)
                saved.append(os.path.relpath(p, ROOT).replace(os.sep, '/'))
            except (urllib.error.URLError, ValueError, OSError) as e:
                failed.append((no, '%s : %s' % (u, e)))
            time.sleep(0.1)
        if saved:
            g['detail_images'] = saved
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(g, f, ensure_ascii=False, indent=2)
                f.write('\n')
            done += 1
            print('[%d/%d] %d 사진 %d장 저장' % (i, len(files), no, len(saved)))

    print('\n완료: 상품 %d개에 상세 사진 추가 · 이미 있어서 건너뜀 %d개 · 상세 사진 없는 상품 %d개' % (done, skipped, empty))
    print('저장한 사진 용량: %.1f MB%s' % (total_bytes / 1048576, '' if Image else '  (Pillow 를 설치하면 더 작게 저장돼요: pip install Pillow)'))
    for no, e in failed:
        print('  실패:', no, '-', e)
    if failed:
        nos = ' '.join(sorted({str(n) for n, _ in failed}))
        print('\n실패한 상품만 다시 받으려면:  python3 tools/import_detail_images.py --force ' + nos)
    return 1 if failed else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
