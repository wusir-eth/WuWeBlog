#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 WuClass 的 spanish.json 中「阿根廷」标签文章转成 WuWeBlog 的格式。

正文实测只用到：** 粗体、表格、> 引用、## 标题、- 无序列表。
目标是小程序 <rich-text>，它不继承页面 WXSS，所以样式必须内联。
"""
import json, re, html, datetime, os

SRC = '/Volumes/AirGapDev/dev/WuClass/seed/spanish/spanish.json'
OUT = '/Volumes/AirGapDev/dev/WuWeBlog/seed'

CAT_ID = 'cat-spanish-classroom'
CAT_NAME = '西语课堂'
TAG = '阿根廷'

# rich-text 不继承 WXSS，全部内联
S = {
    'h2': 'font-size:34rpx;font-weight:700;margin:36rpx 0 16rpx;line-height:1.45;',
    'p': 'margin:0 0 24rpx;',
    'ul': 'margin:0 0 24rpx;padding-left:40rpx;',
    'li': 'margin:0 0 12rpx;',
    'quote': ('margin:0 0 24rpx;padding:16rpx 24rpx;border-left:6rpx solid #3B6E8F;'
              'background:#F2F6F9;color:#42474D;border-radius:0 8rpx 8rpx 0;'),
    'table': ('width:100%;border-collapse:collapse;margin:0 0 24rpx;font-size:26rpx;'
              'display:table;table-layout:fixed;'),
    'th': ('border:1rpx solid #D9DEE3;padding:12rpx 10rpx;background:#F2F6F9;'
           'font-weight:600;text-align:left;word-break:break-word;'),
    'td': 'border:1rpx solid #D9DEE3;padding:12rpx 10rpx;word-break:break-word;',
}


def inline(text):
    """行内标记。先转义，再还原我们自己生成的标签。"""
    t = html.escape(text, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'`([^`]+)`',
               r'<code style="background:#F0F2F4;padding:2rpx 8rpx;'
               r'border-radius:4rpx;font-size:26rpx;">\1</code>', t)
    return t.strip()


def split_row(line):
    inner = line.strip()
    if inner.startswith('|'):
        inner = inner[1:]
    if inner.endswith('|'):
        inner = inner[:-1]
    return [c.strip() for c in inner.split('|')]


def is_sep(line):
    return bool(re.match(r'^\s*\|?[\s:\-|]+\|[\s:\-|]*$', line)) and '-' in line


def md_to_html(md):
    lines = md.replace('\r\n', '\n').split('\n')
    out, i, n = [], 0, len(lines)

    while i < n:
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        # 表格：当前行是 | 开头且下一行是分隔行
        if stripped.startswith('|') and i + 1 < n and is_sep(lines[i + 1]):
            head = split_row(stripped)
            i += 2
            body = []
            while i < n and lines[i].strip().startswith('|'):
                body.append(split_row(lines[i].strip()))
                i += 1
            cells = ''.join(f'<th style="{S["th"]}">{inline(c)}</th>' for c in head)
            rows = [f'<tr>{cells}</tr>']
            for r in body:
                tds = ''.join(f'<td style="{S["td"]}">{inline(c)}</td>' for c in r)
                rows.append(f'<tr>{tds}</tr>')
            out.append(f'<table style="{S["table"]}">{"".join(rows)}</table>')
            continue

        # 标题
        m = re.match(r'^(#{2,4})\s+(.*)$', stripped)
        if m:
            lvl = len(m.group(1))
            size = {2: '34rpx', 3: '31rpx', 4: '30rpx'}[lvl]
            style = S['h2'].replace('34rpx', size)
            out.append(f'<h{lvl} style="{style}">{inline(m.group(2))}</h{lvl}>')
            i += 1
            continue

        # 引用：连续的 > 行合成一段，行间用 <br>
        if stripped.startswith('>'):
            buf = []
            while i < n and lines[i].strip().startswith('>'):
                buf.append(inline(re.sub(r'^\s*>\s?', '', lines[i])))
                i += 1
            out.append(f'<blockquote style="{S["quote"]}">{"<br>".join(buf)}</blockquote>')
            continue

        # 无序列表
        if re.match(r'^[-*]\s+', stripped):
            items = []
            while i < n and re.match(r'^\s*[-*]\s+', lines[i]):
                items.append(inline(re.sub(r'^\s*[-*]\s+', '', lines[i])))
                i += 1
            lis = ''.join(f'<li style="{S["li"]}">{x}</li>' for x in items)
            out.append(f'<ul style="{S["ul"]}">{lis}</ul>')
            continue

        # 有序列表
        if re.match(r'^\d+\.\s+', stripped):
            items = []
            while i < n and re.match(r'^\s*\d+\.\s+', lines[i]):
                items.append(inline(re.sub(r'^\s*\d+\.\s+', '', lines[i])))
                i += 1
            lis = ''.join(f'<li style="{S["li"]}">{x}</li>' for x in items)
            out.append(f'<ol style="{S["ul"]}">{lis}</ol>')
            continue

        # 分割线
        if re.match(r'^(-{3,}|\*{3,})$', stripped):
            out.append('<hr style="border:none;border-top:1rpx solid #E5E8EB;margin:32rpx 0;">')
            i += 1
            continue

        # 段落：吃到空行或下一个块级标记为止
        buf = []
        while i < n:
            s2 = lines[i].strip()
            if (not s2 or s2.startswith('#') or s2.startswith('>')
                    or s2.startswith('|') or re.match(r'^[-*]\s+', s2)
                    or re.match(r'^\d+\.\s+', s2)
                    or re.match(r'^(-{3,}|\*{3,})$', s2)):
                break
            buf.append(s2)
            i += 1
        if buf:
            out.append(f'<p style="{S["p"]}">{inline(" ".join(buf))}</p>')

    return ''.join(out)


def plain(htm, limit=60):
    t = re.sub(r'<[^>]+>', '', htm)
    t = html.unescape(t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t[:limit] + '…' if len(t) > limit else t


def main():
    data = json.load(open(SRC, encoding='utf-8'))
    posts = [p for p in data['posts'] if TAG in p['tags']]
    posts.sort(key=lambda p: p['created_at'])

    articles = []
    for idx, p in enumerate(posts):
        content = md_to_html(p['content'])
        # 原 created_at 全是同一秒，按顺序错开 1 分钟，保证列表顺序稳定
        ts = datetime.datetime.fromtimestamp(p['created_at'], datetime.timezone.utc) \
             + datetime.timedelta(minutes=idx)
        iso = ts.strftime('%Y-%m-%dT%H:%M:%S.000Z')
        articles.append({
            '_id': 'art-' + p['slug'],
            'title': p['title'],
            'content': content,
            'summary': p.get('description') or plain(content),
            'categoryId': CAT_ID,
            'tags': [TAG],
            'coverImage': '',
            'status': 'published' if p.get('published') else 'draft',
            'views': 0,
            # 纯 ISO 字符串；写库由 seedData-oneoff 转成真 Date
            # （CloudBase 不接受 {"$date": ...}，字段名不能以 $ 开头）
            'createTime': iso,
            'updateTime': iso,
        })

    categories = [{'_id': CAT_ID, 'name': CAT_NAME, 'order': 0}]

    os.makedirs(OUT, exist_ok=True)

    # 人类可读的源，进 git
    with open(f'{OUT}/articles.json', 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    with open(f'{OUT}/categories.json', 'w', encoding='utf-8') as f:
        json.dump(categories, f, ensure_ascii=False, indent=2)

    # 供 seedData-oneoff 云函数打包使用
    with open(f'{OUT}/seedData-oneoff/data.json', 'w', encoding='utf-8') as f:
        json.dump({'articles': articles, 'categories': categories}, f, ensure_ascii=False)

    print(f'文章 {len(articles)} 篇，分类 {len(categories)} 个')
    for a in articles:
        print(f"  {a['_id']:36} {a['status']:9} 正文 {len(a['content']):5} 字符  {a['title']}")


if __name__ == '__main__':
    main()
