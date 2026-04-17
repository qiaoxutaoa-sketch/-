import os
import re

base = 'E:/青九教务系统-三端（重构）/重构/网页端重构'

# FIX 1: MainLayout.vue (Extracting the aside tag properly and making elements clickable without breaking layout)
with open(f'{base}/src/assets/raw_sidebar.html', 'r', encoding='utf-8') as f:
    sidebar = f.read()

# We need to manually construct MainLayout.vue so we don't have wrappers
main_layout = """<template>
  <div class="saas-layout fade-in" style="display: flex; height: 100vh; width: 100vw; overflow: hidden; background: var(--gray-50); color: var(--gray-800); font-family: Inter, system-ui, sans-serif;">
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
          <!-- 宣传大盘 user asked to ignore, but we can leave it unclickable or remove it. Let's just render it inactive -->
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
    
    <main class="saas-content" style="flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; position: relative;">
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

print('Updated MainLayout.vue with proper Vue component for aside to fix click events and direct child CSS.')


# FIX 2: Layout Wrappers for all views. Instead of `<div>` wrapper, we will just use `div` wrapper WITHOUT inline styles if it's not needed, or ideally no wrapper.
# Since a component *must* have a single root element if we use v-html, 
# The best way is to extract the class and style from the outer tag of the raw HTML, and apply it to our Vue root template!

def process_view(filename, vue_filename):
    with open(filename, 'r', encoding='utf-8') as f:
        raw_html = f.read()
    
    # We find the very first element (like `<div data-v-xxx class="..." style="...">`)
    # and we capture its attributes vs inner content.
    match = re.match(r'<([a-zA-Z0-9]+)\s+([^>]+)>(.*)</\1>$', raw_html, re.DOTALL | re.IGNORECASE)
    if match:
        tag = match.group(1)
        attrs = match.group(2)
        inner = match.group(3)
        # Reconstruct exactly:
        vue_code = f'''<template>
  <{tag} {attrs} v-html="innerHtml"></{tag}>
</template>

<script setup>
// Using pure text string for inner assignment to avoid compilation errors
const innerHtml = `{inner.replace('`', r'\`').replace('$', r'\$')}`
</script>
'''
        with open(vue_filename, 'w', encoding='utf-8') as f:
            f.write(vue_code)
        print(f"Fixed wrapper for {vue_filename}")
    else:
        # Fallback if regex fails to match a single root
        print(f"Regex failed for {filename}, falling back")

process_view(f'{base}/src/assets/raw_main.html', f'{base}/src/views/DashboardView.vue')
process_view(f'{base}/src/assets/raw_students_main.html', f'{base}/src/views/StudentsView.vue')
process_view(f'{base}/src/assets/raw_teachers_main.html', f'{base}/src/views/TeachersView.vue')
process_view(f'{base}/src/assets/raw_courses_main.html', f'{base}/src/views/CoursesView.vue')
process_view(f'{base}/src/assets/raw_records_main.html', f'{base}/src/views/RecordsView.vue')
process_view(f'{base}/src/assets/raw_business_main.html', f'{base}/src/views/BusinessView.vue')
process_view(f'{base}/src/assets/raw_secret_main.html', f'{base}/src/views/SecretView.vue')
