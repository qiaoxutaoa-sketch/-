import os
import re

base = 'E:/青九教务系统-三端（重构）'
dest_base = os.path.join(base, '重构/网页端重构/src')

mappings = [
    ('工作台.html', 'raw_main.html', 'DashboardView.vue'),
    ('学员库.html', 'raw_students_main.html', 'StudentsView.vue'),
    ('教师库.html', 'raw_teachers_main.html', 'TeachersView.vue'),
    ('排课管理.html', 'raw_courses_main.html', 'CoursesView.vue'),
    ('消课记录.html', 'raw_records_main.html', 'RecordsView.vue'),
    ('经营数据.html', 'raw_business_main.html', 'BusinessView.vue'),
    ('暗门管理.html', 'raw_secret_main.html', 'SecretView.vue'),
]

for src, raw, vue in mappings:
    src_path = os.path.join(base, src)
    if not os.path.exists(src_path):
        continue
    
    with open(src_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    main_match = re.search(r'<main[^>]*>(.*?)</main>', html, re.DOTALL | re.IGNORECASE)
    if main_match:
        inner = main_match.group(1).strip()
        
        # 1. Reset the raw HTML payload to purely the innerHTML of main
        with open(os.path.join(dest_base, f'assets/{raw}'), 'w', encoding='utf-8') as f:
            f.write(inner)
            
        # 2. Reset the Vue component to the safest, perfect 0-impact injection
        vue_code = f'''<template>
  <div style="display: contents" v-html="innerHtml"></div>
</template>

<script setup>
import rawHtml from '../assets/{raw}?raw'
const innerHtml = rawHtml
</script>
'''
        with open(os.path.join(dest_base, f'views/{vue}'), 'w', encoding='utf-8') as f:
            f.write(vue_code)
        print(f"Pristine restored: {vue}")

print("All views have been pristine restored and injected via display:contents.")
