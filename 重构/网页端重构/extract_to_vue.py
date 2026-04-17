import os
import re

base = 'E:/青九教务系统-三端（重构）/重构/网页端重构'

# Create raw html snippets for students and teachers based on my previous script
with open('E:/青九教务系统-三端（重构）/学员库.html', 'r', encoding='utf-8') as f:
    students_html = f.read()
students_main_match = re.search(r'<main[^>]*>(.*?)</main>', students_html, re.DOTALL | re.IGNORECASE)
with open(f'{base}/src/assets/raw_students_main.html', 'w', encoding='utf-8') as f:
    f.write(students_main_match.group(1) if students_main_match else '')

with open('E:/青九教务系统-三端（重构）/教师库.html', 'r', encoding='utf-8') as f:
    teachers_html = f.read()
teachers_main_match = re.search(r'<main[^>]*>(.*?)</main>', teachers_html, re.DOTALL | re.IGNORECASE)
with open(f'{base}/src/assets/raw_teachers_main.html', 'w', encoding='utf-8') as f:
    f.write(teachers_main_match.group(1) if teachers_main_match else '')

# 1. MainLayout.vue
main_layout = '''<template>
  <div class="saas-layout fade-in" style="display: flex; height: 100vh; width: 100vw; overflow: hidden; background: var(--gray-50); color: var(--gray-800); font-family: Inter, system-ui, sans-serif;">
    <div v-html="sidebarHtml" style="display: contents"></div>
    <main class="saas-content" style="flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; position: relative;">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import sidebarHtmlRaw from '@/assets/raw_sidebar.html?raw'
const sidebarHtml = sidebarHtmlRaw
</script>
'''

with open(f'{base}/src/layout/MainLayout.vue', 'w', encoding='utf-8') as f:
    f.write(main_layout)

# 2. DashboardView.vue
dashboard_view = '''<template>
  <div style="height: 100%; display: flex; flex-direction: column; width: 100%;" v-html="dashboardHtml"></div>
</template>

<script setup>
import dashboardHtmlRaw from '@/assets/raw_main.html?raw'
const dashboardHtml = dashboardHtmlRaw
</script>
'''

with open(f'{base}/src/views/DashboardView.vue', 'w', encoding='utf-8') as f:
    f.write(dashboard_view)

# 3. StudentsView.vue
students_view = '''<template>
  <div style="height: 100%; display: flex; flex-direction: column; width: 100%;" v-html="studentsHtml"></div>
</template>

<script setup>
import studentsHtmlRaw from '@/assets/raw_students_main.html?raw'
const studentsHtml = studentsHtmlRaw
</script>
'''

with open(f'{base}/src/views/StudentsView.vue', 'w', encoding='utf-8') as f:
    f.write(students_view)

# 4. TeachersView.vue
teachers_view = '''<template>
  <div style="height: 100%; display: flex; flex-direction: column; width: 100%;" v-html="teachersHtml"></div>
</template>

<script setup>
import teachersHtmlRaw from '@/assets/raw_teachers_main.html?raw'
const teachersHtml = teachersHtmlRaw
</script>
'''

with open(f'{base}/src/views/TeachersView.vue', 'w', encoding='utf-8') as f:
    f.write(teachers_view)

print('Updated all components to use v-html.')
