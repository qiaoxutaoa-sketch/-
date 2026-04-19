<template>
  <div style="padding-bottom: 24px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <h2 style="margin:0px;font-size:24px;font-weight:800;color:var(--gray-800);letter-spacing:-0.5px">师资配置与权限库</h2>
      <div class="toolbar" style="display:flex;gap:15px;align-items:center">
        <div class="search-box">
          <input type="text" placeholder="搜索姓名 / 手机号 / 岗位..." style="border:1px solid var(--gray-200);background:white;border-radius:999px;padding:10px 20px;font-size:14px;box-shadow:rgba(0,0,0,0.03) 0px 4px 12px;width:280px;outline:none;transition:0.2s" v-model="searchQuery">
        </div>
        <button class="primary-btn" style="border-radius:999px;padding:10px 24px;display:flex;align-items:center;gap:8px" @click="() => { isEditMode = false; selectedTeacher = null; showAddDialog = true }">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg> 
          创建新账号 
        </button>
      </div>
    </div>
    
    <div class="table-container saas-card" style="padding:0px;overflow:hidden" v-loading="loading">
      <table class="data-table">
        <thead>
          <tr>
            <th>名师档案</th>
            <th>联系方式(账号)</th>
            <th>系统角色</th>
            <th>建档时间</th>
            <th>关键操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="teacher in filteredTeachers" :key="teacher._id">
            <td>
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--primary-light),var(--primary));color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;box-shadow:rgba(99,102,241,0.2) 0px 4px 10px">
                  {{ teacher.name ? teacher.name.charAt(0) : '师' }}
                </div>
                <div class="bold-text" style="font-size:15px!important">
                  {{ teacher.name }} 
                  <span style="font-size:12px;color:var(--gray-400);font-weight:normal;margin-left:6px">在职</span>
                </div>
              </div>
            </td>
            <td>
              <div class="phone-text">{{ teacher.phone }}</div>
            </td>
            <td>
              <span class="saas-pill" :class="teacher.role === 'admin' ? 'danger' : 'info'">
                <span class="dot"></span> {{ teacher.role === 'admin' ? '超管 / 校长' : '授课教师' }}
              </span>
            </td>
            <td class="date-text">{{ formatTime(teacher.timestamp) }}</td>
            <td>
              <button class="text-btn" style="color:var(--primary)" @click="handleEdit(teacher)">编辑资料</button>
              <button class="text-btn" style="color:var(--warning)" @click="handleResetPwd(teacher)">重置密码</button>
              <button v-if="teacher.role !== 'admin'" class="text-btn" style="color:var(--danger)" @click="handleDelete(teacher)">删除权限</button>
            </td>
          </tr>
          <tr v-if="filteredTeachers.length === 0 && !loading">
             <td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8">暂无匹配的教师档案</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modals -->
    <AddTeacherDialog v-model="showAddDialog" :is-edit="isEditMode" :edit-data="selectedTeacher" @refresh="loadData" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { fetchTeachers, deleteTeacher } from '../api/teachers'
import AddTeacherDialog from './components/AddTeacherDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const teachers = ref([])
const loading = ref(true)
const searchQuery = ref('')
const showAddDialog = ref(false)
const selectedTeacher = ref(null)
const isEditMode = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const data = await fetchTeachers()
    teachers.value = data || []
  } catch(e) {
    console.error(e)
    ElMessage.error('获取教师列表失败: ' + (e.message || String(e)))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const formatTime = (ts) => {
  if(!ts) return '暂无'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const filteredTeachers = computed(() => {
  if (!searchQuery.value) return teachers.value
  const q = searchQuery.value.toLowerCase()
  return teachers.value.filter(s => 
    (s.name && s.name.toLowerCase().includes(q)) || 
    (s.phone && s.phone.includes(q)) ||
    (s.role && s.role.toLowerCase().includes(q))
  )
})

const handleEdit = (teacher) => {
  isEditMode.value = true
  selectedTeacher.value = teacher
  showAddDialog.value = true
}

const handleResetPwd = async (teacher) => {
  try {
    const { value } = await ElMessageBox.prompt(`为教师【${teacher.name}】设置新密码，由6-16位字符组成：`, '重置密码', {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      inputPattern: /^.{6,16}$/,
      inputErrorMessage: '密码长度需在6到16位之间'
    })
    
    // API call expects teacherItem to carry the generic metadata and password
    const itemData = { _id: teacher._id, password: value }
    const res = await import('../api/teachers').then(m => m.resetTeacherPassword(itemData))
    if (res && res.success) {
      ElMessage.success('密码已成功重置！')
    } else {
      ElMessage.error(res?.msg || '操作失败')
    }
  } catch(e) {
    if(e !== 'cancel') ElMessage.error('发生异常: ' + String(e))
  }
}

const handleDelete = async (teacher) => {
  try {
    await ElMessageBox.confirm(`确定要注销授课教师【${teacher.name}】的权限吗？此操作将立即生效。`, '系统警告', {
      confirmButtonText: '确定吊销',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    // User agreed
    const res = await deleteTeacher(teacher)
    if(res && res.success) {
      ElMessage.success('成功注销权限')
      loadData()
    } else {
      ElMessage.error(res?.msg || '操作失败')
    }
  } catch(e) {
    if(e !== 'cancel') ElMessage.error('发生异常: ' + String(e))
  }
}
</script>

<style scoped>
/* Scoped overrides to ensure pixel perfect matches in Vue */
.primary-btn {
  background: var(--primary);
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.primary-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
.text-btn {
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 12px;
  transition: all 0.2s;
}
.text-btn:hover {
  opacity: 0.7;
}
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.data-table th {
  text-align: left;
  padding: 16px 24px;
  background: #f8fafc;
  color: #64748b;
  font-weight: 500;
  font-size: 13px;
  border-bottom: 1px solid #e2e8f0;
}
.data-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.data-table tbody tr:hover td {
  background: #f8fafc;
}
.bold-text {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}
.phone-text {
  font-size: 14px;
  font-family: monospace;
  color: #475569;
}
.date-text {
  font-family: monospace;
  color: #64748b;
  font-size: 13px;
}
.saas-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
.saas-pill {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.saas-pill .dot {
  width: 6px; height: 6px; border-radius: 50%;
}
.saas-pill.danger {
  background: rgb(254,226,226); color: rgb(185,28,28);
}
.saas-pill.danger .dot {
  background: rgb(239,68,68);
}
.saas-pill.info {
  background: rgb(224,242,254); color: rgb(3,105,161);
}
.saas-pill.info .dot {
  background: rgb(14,165,233);
}
</style>
