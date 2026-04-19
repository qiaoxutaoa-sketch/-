<template>
  <div style="padding-bottom: 24px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <h2 style="margin:0px;font-size:24px;font-weight:800;color:var(--gray-800);letter-spacing:-0.5px">学员库综合管理</h2>
      <div class="toolbar" style="display:flex;gap:15px;align-items:center">
        <div class="search-box">
          <input type="text" placeholder="搜索姓名 / 手机号 / 学号..." style="border:1px solid var(--gray-200);background:white;border-radius:999px;padding:10px 20px;font-size:14px;box-shadow:rgba(0,0,0,0.03) 0px 4px 12px;width:280px;outline:none;transition:0.2s" v-model="searchQuery">
        </div>
        <button class="primary-btn" style="background:#fefce8;color:#a16207;border:1px solid #fef08a;border-radius:999px;padding:10px 20px;display:flex;align-items:center;gap:8px" @click="showAppDrawer = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          报名申请审核
        </button>
        <button class="primary-btn" style="border-radius:999px;padding:10px 24px;display:flex;align-items:center;gap:8px" @click="() => { isEditMode = false; selectedStudent = null; showAddDialog = true }">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> 
          录入新学员 
        </button>
      </div>
    </div>
    
    <div class="saas-card" style="padding:0px;overflow:hidden" v-loading="loading">
      <table class="data-table">
        <thead>
          <tr>
            <th>学号</th>
            <th>学员基本信息</th>
            <th>联系方式</th>
            <th>课时状态</th>
            <th>上次续费时间</th>
            <th>操作 (编辑/续费/删除)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(student, index) in filteredStudents" :key="student._id || index">
            <td style="color:rgb(100,116,139);font-family:monospace;font-size:13px">{{ student.studentNo || formatId(index) }}</td>
            <td>
              <div class="bold-text">
                {{ student.name }} 
                <span style="font-size:12px;color:rgb(100,116,139);font-weight:normal;margin-left:6px">{{ student.age || '未知' }}岁 / {{ student.gender || '未知' }}</span>
              </div>
              <div style="font-size:12px;color:rgb(148,163,184);margin-top:4px">报读: {{ student.course || '暂无分类' }}</div>
            </td>
            <td>
              <div class="phone-text">{{ student.phone || '未填写' }}</div>
              <div class="address-text" :title="student.address">{{ student.address || '无地址' }}</div>
            </td>
            <td>
              <div style="margin-bottom:4px;display:inline-block;padding:4px 10px;border-radius:20px"
                   :style="{ background: student.remain <= 4 ? 'rgb(254,226,226)' : 'rgb(220,252,227)', color: student.remain <= 4 ? 'rgb(185,28,28)' : 'rgb(21,128,61)' }"> 
                剩余 <span style="font-weight:bold;font-size:16px">{{ student.remain || 0 }}</span> 节 
              </div>
              <div style="font-size:12px;color:rgb(148,163,184)">累计购买: {{ student.totalHours || 0 }}</div>
            </td>
            <td class="date-text">{{ student.lastRenewalDate || student.enrollDate || '暂无' }}</td>
            <td v-if="isAdmin">
              <button class="text-btn" @click="handleEdit(student)">编辑</button>
              <button class="renew-btn" style="margin-right:8px" @click="handleRenew(student)">续费补充</button>
              <button class="text-btn" style="color:var(--danger);border-color:rgba(239,68,68,0.4)" @click="handleDelete(student)">删除</button>
            </td>
            <td v-else>
              <span style="font-size:12px;color:#cbd5e1">- 仅限超管操作 -</span>
            </td>
          </tr>
          <tr v-if="filteredStudents.length === 0 && !loading">
             <td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8">没有匹配的学员档案</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modals & Drawers -->
    <AddStudentDialog v-model="showAddDialog" :is-edit="isEditMode" :edit-data="selectedStudent" @refresh="loadData" />
    <RenewStudentDialog v-model="showRenewDialog" :student="selectedStudent" @refresh="loadData" />
    <ApplicationsDrawer v-model="showAppDrawer" @refresh="loadData" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { fetchStudents, deleteStudent } from '../api/students'
import AddStudentDialog from './components/AddStudentDialog.vue'
import RenewStudentDialog from './components/RenewStudentDialog.vue'
import ApplicationsDrawer from './components/ApplicationsDrawer.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { checkIsAdmin } from '../utils/api'

const students = ref([])
const loading = ref(true)
const searchQuery = ref('')
const showAddDialog = ref(false)
const showRenewDialog = ref(false)
const showAppDrawer = ref(false)
const selectedStudent = ref(null)
const isEditMode = ref(false)
const isAdmin = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const data = await fetchStudents()
    students.value = data || []
  } catch(e) {
    console.error(e)
    ElMessage.error('获取学员列表失败: ' + (e.message || String(e)))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  isAdmin.value = checkIsAdmin()
  loadData()
})

const formatId = (idx) => {
  return 'QJ' + String(idx + 1).padStart(5, '0')
}

const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  const q = searchQuery.value.toLowerCase()
  return students.value.filter(s => 
    (s.name && s.name.toLowerCase().includes(q)) || 
    (s.phone && s.phone.includes(q)) ||
    (s.studentNo && s.studentNo.toLowerCase().includes(q))
  )
})

const handleEdit = (student) => {
  isEditMode.value = true
  selectedStudent.value = student
  showAddDialog.value = true
}

const handleRenew = (student) => {
  selectedStudent.value = student
  showRenewDialog.value = true
}

const handleDelete = async (student) => {
  try {
    await ElMessageBox.confirm(`确定要永久删除学员【${student.name}】的档案吗？`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await deleteStudent(student._id)
    if (res.success) {
      ElMessage.success('学员已删除')
      loadData()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch(e) {
    if (e !== 'cancel') ElMessage.error('发生异常: ' + String(e))
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
}
.primary-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
.text-btn {
  background: none;
  border: 1px solid var(--gray-200);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--gray-600);
  cursor: pointer;
  margin-right: 8px;
  transition: all 0.2s;
}
.text-btn:hover {
  background: var(--gray-50);
  color: var(--gray-800);
}
.renew-btn {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}
.renew-btn:hover {
  background: #fde68a;
  transform: translateY(-1px);
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
  color: #334155;
}
.address-text {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  backdrop-filter: blur(10px);
}
</style>
