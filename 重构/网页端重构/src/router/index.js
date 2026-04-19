import { createRouter, createWebHistory } from 'vue-router'

// 路由守卫鉴权标识符，通常在 login 成功后写入 localStorage，如 _callerPhone
const isAuthenticated = () => !!localStorage.getItem('_callerPhone') && !!localStorage.getItem('_callerPassword')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/',
      name: 'main',
      component: () => import('../layout/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: 'dashboard' },
        { path: 'dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
        { path: 'students', name: 'students', component: () => import('../views/StudentsView.vue') },
        { path: 'teachers', name: 'teachers', component: () => import('../views/TeachersView.vue') },
        { path: 'courses', name: 'courses', component: () => import('../views/CoursesView.vue') },
        { path: 'records', name: 'records', component: () => import('../views/RecordsView.vue') },
        { path: 'business', name: 'business', component: () => import('../views/BusinessView.vue') },
        { path: 'secret', name: 'secret', component: () => import('../views/SecretView.vue') },
      ]
    }
  ]
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated()) {
    next('/')
  } else {
    next()
  }
})

export default router
