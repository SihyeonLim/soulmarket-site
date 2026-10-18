#!/usr/bin/env python3
"""여러 상품에 '똑같이' 들어간 공통 안내 사진을 상세 사진에서 한 번에 빼고 지웁니다.

기존 사이트에서 가져온 상세 사진에는 배송 안내 · "CHECK IT PLEASE" 같은
공통 안내 사진이 거의 모든 상품에 들어 있어요. 이 내용은 이제 상품 페이지 아래
'배송 · 교환 · 반품 안내' 표로 보여 주기 때문에 사진은 필요 없어요.

사용법 (저장소 폴더 안에서):
    python3 tools/remove_common_detail_images.py            # 공통 사진을 찾아서 바로 빼고 지우기
    python3 tools/remove_common_detail_images.py --dry-run  # 지울 목록만 보여주기 (아무것도 안 바꿈)

- 파일 내용이 완전히 같은 사진이 20개 이상 상품에 들어 있으면 '공통 사진'으로 봐요.
  (기준을 바꾸려면 --min 10 처럼 숫자를 주세요)
- 끝나면 GitHub Desktop 에서 Commit → Push 하세요. 지운 파일도 자동으로 반영돼요.
  혹시 잘못 지워도 GitHub 기록(History)에서 되살릴 수 있어요.
"""
import hashlib, json, os, sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GOODS = os.path.join(ROOT, 'data', 'goods')

def main(argv):
    apply = '--dry-run' not in argv
    min_count = 20
    if '--min' in argv:
        min_count = int(argv[argv.index('--min') + 1])

    entries = {}                      # 상품 파일 → 상품 데이터
    users = defaultdict(set)          # 사진 해시 → 이 사진을 쓰는 상품 번호들
    files_by_hash = defaultdict(set)  # 사진 해시 → 사진 파일들
    hash_of = {}                      # 사진 경로 → 해시
    for name in sorted(os.listdir(GOODS)):
        if not name.endswith('.json'):
            continue
        path = os.path.join(GOODS, name)
        with open(path, encoding='utf-8') as f:
            g = json.load(f)
        entries[path] = g
        for img in g.get('detail_images') or []:
            fp = os.path.join(ROOT, img.lstrip('/'))
            if not os.path.isfile(fp):
                continue
            if img not in hash_of:
                with open(fp, 'rb') as f:
                    hash_of[img] = hashlib.md5(f.read()).hexdigest()
            h = hash_of[img]
            users[h].add(g.get('no'))
            files_by_hash[h].add(img)

    common = {h for h, nos in users.items() if len(nos) >= min_count}
    if not common:
        print('공통 사진이 없어요. (기준: %d개 이상 상품)' % min_count)
        return 0

    print('공통 사진 %d종을 찾았어요:' % len(common))
    for h in sorted(common, key=lambda x: -len(users[x])):
        sample = sorted(files_by_hash[h])[0]
        print('  - 상품 %d개에 들어 있음  (예: %s)' % (len(users[h]), sample))
    if not apply:
        print('\n(--dry-run 이라 아무것도 바꾸지 않았어요. 실제로 지우려면 --dry-run 없이 실행하세요)')
        return 0

    changed = removed_files = 0
    for path, g in entries.items():
        imgs = g.get('detail_images') or []
        keep = [i for i in imgs if hash_of.get(i) not in common]
        if len(keep) != len(imgs):
            if keep:
                g['detail_images'] = keep
            else:
                g.pop('detail_images', None)
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(g, f, ensure_ascii=False, indent=2)
                f.write('\n')
            changed += 1
    for h in common:
        for img in files_by_hash[h]:
            fp = os.path.join(ROOT, img.lstrip('/'))
            if os.path.isfile(fp):
                os.remove(fp)
                removed_files += 1
    print('\n완료: 상품 %d개에서 공통 사진을 뺐고, 사진 파일 %d개를 지웠어요.' % (changed, removed_files))
    print('GitHub Desktop 에서 Commit → Push 하세요.')
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
