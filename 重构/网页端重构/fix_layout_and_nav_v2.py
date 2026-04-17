import os
import re

base = 'E:/青九教务系统-三端（重构）/重构/网页端重构'

def process_view(filename, vue_filename):
    with open(filename, 'r', encoding='utf-8') as f:
        raw_html = f.read()
    
    match = re.match(r'<([a-zA-Z0-9]+)\s*([^>]*)>(.*)</\1>$', raw_html, re.DOTALL | re.IGNORECASE)
    
    raw_basename = os.path.basename(filename)

    if match:
        tag = match.group(1)
        attrs = match.group(2)
        inner = match.group(3)
        
        # Save inner back
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(inner)

        vue_code = f'''<template>
  <{tag} {attrs} v-html="innerHtml"></{tag}>
</template>

<script setup>
import rawHtml from '../assets/{raw_basename}?raw'
const innerHtml = rawHtml
</script>
'''
        with open(vue_filename, 'w', encoding='utf-8') as f:
            f.write(vue_code)
        print(f"Fixed wrapper (extracted root) for {vue_filename}")
    else:
        # Fallback to display contents
        vue_code = f'''<template>
  <div style="display: contents" v-html="innerHtml"></div>
</template>

<script setup>
import rawHtml from '../assets/{raw_basename}?raw'
const innerHtml = rawHtml
</script>
'''
        with open(vue_filename, 'w', encoding='utf-8') as f:
            f.write(vue_code)
        print(f"Fixed wrapper (display contents) for {vue_filename}")

process_view(f'{base}/src/assets/raw_main.html', f'{base}/src/views/DashboardView.vue')
process_view(f'{base}/src/assets/raw_students_main.html', f'{base}/src/views/StudentsView.vue')
process_view(f'{base}/src/assets/raw_teachers_main.html', f'{base}/src/views/TeachersView.vue')
process_view(f'{base}/src/assets/raw_courses_main.html', f'{base}/src/views/CoursesView.vue')
process_view(f'{base}/src/assets/raw_records_main.html', f'{base}/src/views/RecordsView.vue')
process_view(f'{base}/src/assets/raw_business_main.html', f'{base}/src/views/BusinessView.vue')
process_view(f'{base}/src/assets/raw_secret_main.html', f'{base}/src/views/SecretView.vue')

# Also, ensure MainLayout.vue doesn't have ANY inline styles overriding the original saas-layout
main_layout = """<template>
  <div class="saas-layout fade-in">
    <aside data-v-4434df1b class="saas-sidebar">
      <div data-v-4434df1b class="sidebar-header">
        <img data-v-4434df1b src="../assets/logo.png" alt="Logo" style="width:100px;height:100px;object-fit:contain;margin-bottom:12px">
        <span data-v-4434df1b class="sidebar-title">青九教务</span>
      </div>
      <div data-v-4434df1b style="padding:0px 16px;flex:1 1 0%;overflow-y:auto">
        <div data-v-4434df1b class="nav-label">MAIN MENU</div>
        <ul data-v-4434df1b class="saas-nav">
          <li data-v-4434df1b :class="{ active: route.path === '/dashboard' || route.path === '/' }" @click="router.push('/dashboard')" style="cursor:pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-4434df1b><rect x="3" y="3" width="7" height="9" data-v-4434df1b></rect><rect x="14" y="3" width="7" height="5" data-v-4434df1b></rect><rect x="14" y="12" width="7" height="9" data-v-4434df1b></rect><rect x="3" y="16" width="7" height="5" data-v-4434df1b></rect></svg>
            工作台
          </li>
          <li data-v-4434df1b :class="{ active: route.path === '/students' }" @click="router.push('/students')" style="cursor:pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-4434df1b><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" data-v-4434df1b></path><circle cx="9" cy="7" r="4" data-v-4434df1b></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87" data-v-4434df1b></path><path d="M16 3.13a4 4 0 0 1 0 7.75" data-v-4434df1b></path></svg>
            学员库
          </li>
          <li data-v-4434df1b :class="{ active: route.path === '/teachers' }" @click="router.push('/teachers')" style="cursor:pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-4434df1b><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" data-v-4434df1b></path><circle cx="8.5" cy="7" r="4" data-v-4434df1b></circle><line x1="20" y1="8" x2="20" y2="14" data-v-4434df1b></line><line x1="23" y1="11" x2="17" y2="11" data-v-4434df1b></line></svg>
            教师库
          </li>
          <li data-v-4434df1b :class="{ active: route.path === '/courses' }" @click="router.push('/courses')" style="cursor:pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-4434df1b><rect x="3" y="4" width="18" height="18" rx="2" ry="2" data-v-4434df1b></rect><line x1="16" y1="2" x2="16" y2="6" data-v-4434df1b></line><line x1="8" y1="2" x2="8" y2="6" data-v-4434df1b></line><line x1="3" y1="10" x2="21" y2="10" data-v-4434df1b></line></svg>
            排课管理
          </li>
          <li data-v-4434df1b :class="{ active: route.path === '/records' }" @click="router.push('/records')" style="cursor:pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-4434df1b><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" data-v-4434df1b></path><polyline points="14 2 14 8 20 8" data-v-4434df1b></polyline><line x1="16" y1="13" x2="8" y2="13" data-v-4434df1b></line><line x1="16" y1="17" x2="8" y2="17" data-v-4434df1b></line><polyline points="10 9 9 9 8 9" data-v-4434df1b></polyline></svg>
            消课记录
          </li>
        </ul>
        <div data-v-4434df1b class="nav-label" style="margin-top:24px">MANAGEMENT</div>
        <ul data-v-4434df1b class="saas-nav">
          <li data-v-4434df1b :class="{ active: route.path === '/business' }" @click="router.push('/business')" style="cursor:pointer">
            <svg data-v-4434df1b xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline data-v-4434df1b points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            经营数据
          </li>
          <li data-v-4434df1b style="opacity: 0.5">
            <svg data-v-4434df1b xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path data-v-4434df1b d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            宣传大盘
          </li>
          <li data-v-4434df1b :class="{ active: route.path === '/secret' }" @click="router.push('/secret')" style="cursor:pointer">
            <svg data-v-4434df1b xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path data-v-4434df1b d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            暗门管理
          </li>
        </ul>
      </div>
      <div data-v-4434df1b style="padding:16px">
        <div data-v-4434df1b class="logout-pill" @click="handleLogout" style="cursor:pointer">
          <svg data-v-4434df1b xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path data-v-4434df1b d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline data-v-4434df1b points="16 17 21 12 16 7"></polyline><line data-v-4434df1b x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span data-v-4434df1b>退出系统</span>
        </div>
      </div>
    </aside>
    
    <main class="saas-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const handleLogout = () => {
    localStorage.removeItem('_callerPhone');
    router.push('/login');
}
</script>
"""
with open(f'{base}/src/layout/MainLayout.vue', 'w', encoding='utf-8') as f:
    f.write(main_layout)
print('Updated MainLayout NO WRAPPERS')
