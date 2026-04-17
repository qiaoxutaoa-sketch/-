import os
import re

base = 'E:/青九教务系统-三端（重构）/重构/网页端重构'

mappings = [
    {
        'source': 'E:/青九教务系统-三端（重构）/排课管理.html',
        'raw_output': f'{base}/src/assets/raw_courses_main.html',
        'vue_output': f'{base}/src/views/CoursesView.vue',
        'raw_import': 'raw_courses_main'
    },
    {
        'source': 'E:/青九教务系统-三端（重构）/消课记录.html',
        'raw_output': f'{base}/src/assets/raw_records_main.html',
        'vue_output': f'{base}/src/views/RecordsView.vue',
        'raw_import': 'raw_records_main'
    },
    {
        'source': 'E:/青九教务系统-三端（重构）/经营数据.html',
        'raw_output': f'{base}/src/assets/raw_business_main.html',
        'vue_output': f'{base}/src/views/BusinessView.vue',
        'raw_import': 'raw_business_main'
    },
    {
        'source': 'E:/青九教务系统-三端（重构）/暗门管理.html',
        'raw_output': f'{base}/src/assets/raw_secret_main.html',
        'vue_output': f'{base}/src/views/SecretView.vue',
        'raw_import': 'raw_secret_main'
    }
]

for mapping in mappings:
    try:
        with open(mapping['source'], 'r', encoding='utf-8') as f:
            html = f.read()
        
        main_match = re.search(r'<main[^>]*>(.*?)</main>', html, re.DOTALL | re.IGNORECASE)
        inner_content = main_match.group(1) if main_match else ''
        
        # Write raw snippet
        with open(mapping['raw_output'], 'w', encoding='utf-8') as f:
            f.write(inner_content)
        
        # Write Vue component
        vue_template = f'''<template>
  <div style="height: 100%; display: flex; flex-direction: column; width: 100%;" v-html="rawHtml"></div>
</template>

<script setup>
import rawHtmlRaw from '../assets/{mapping['raw_import']}.html?raw'
const rawHtml = rawHtmlRaw
</script>
'''
        with open(mapping['vue_output'], 'w', encoding='utf-8') as f:
            f.write(vue_template)
            
        print(f"Successfully processed {mapping['source']}")
    except Exception as e:
        print(f"Error processing {mapping['source']}: {e}")

print('Finished generating remaining views.')
