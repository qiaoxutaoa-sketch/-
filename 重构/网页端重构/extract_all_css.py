import os
import re
import hashlib

base = 'E:/青九教务系统-三端（重构）'
html_files = [
    '工作台.html', '学员库.html', '教师库.html', 
    '排课管理.html', '消课记录.html', '经营数据.html', '暗门管理.html'
]

seen_hashes = set()
all_css = []

for file in html_files:
    filepath = os.path.join(base, file)
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    styles = re.findall(r'<style.*?>(.*?)</style>', content, re.DOTALL | re.IGNORECASE)
    
    for s in styles:
        s = s.strip()
        if not s:
            continue
        # simple deduplication
        h = hashlib.md5(s.encode('utf-8')).hexdigest()
        if h not in seen_hashes:
            seen_hashes.add(h)
            all_css.append("/* From " + file + " */\n" + s)

out_css_path = os.path.join(base, '重构/网页端重构/src/assets/original_v1.css')
with open(out_css_path, 'w', encoding='utf-8') as f:
    f.write('\n\n'.join(all_css))

print(f"Extracted and deduplicated {len(all_css)} unique style blocks into original_v1.css.")
print(f"Final CSS size: {os.path.getsize(out_css_path)} bytes.")
