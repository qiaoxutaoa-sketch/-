<template>
  <div style="padding-bottom: 24px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <h2 style="margin:0px;font-size:24px;font-weight:800;color:var(--gray-800);letter-spacing:-0.5px">班级排课管理</h2>
      <div class="toolbar">
        <button class="primary-btn" style="border-radius:999px;padding:10px 24px" @click="() => { isEditMode = false; selectedClass = null; showAddDialog = true }">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:text-bottom">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>新建班级 
        </button>
      </div>
    </div>
    
    <div class="saas-card" style="padding:0px;overflow:hidden" v-loading="loading">
      <table class="data-table">
        <thead>
          <tr>
            <th>班级名称</th>
            <th>任课老师</th>
            <th>上课时间安排</th>
            <th>班级人数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cls in classes" :key="cls._id">
            <td class="bold-text" style="color:var(--primary)!important">{{ cls.name }}</td>
            <td>{{ cls.teacherName || '未分配' }}</td>
            <td>
              <span class="tag"><span class="dot"></span> {{ cls.scheduleDay }} {{ cls.scheduleTime }}</span>
            </td>
            <td>
              <span style="display:inline-flex;align-items:center;height:24px;padding:0 10px;background:var(--gray-200);border-radius:9999px;font-size:13px;color:var(--gray-700)">
                {{ (cls.studentIds && cls.studentIds.length) || 0 }}人
              </span>
            </td>
            <td>
              <button class="text-btn" style="color:var(--primary);margin-right:8px" @click="handleEdit(cls)">编辑班级 / 调整学员</button>
              <button class="text-btn" style="color:var(--danger);border-color:rgba(239,68,68,0.4)" @click="handleDelete(cls)">解散本班</button>
            </td>
          </tr>
          <tr v-if="classes.length === 0 && !loading">
             <td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8">目前没有正在运行的班级</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modals -->
    <AddClassDialog v-model="showAddDialog" :is-edit="isEditMode" :edit-data="selectedClass" @refresh="loadData" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchClasses, deleteClass } from '../api/classes'
import AddClassDialog from './components/AddClassDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const classes = ref([])
const loading = ref(true)
const showAddDialog = ref(false)
const selectedClass = ref(null)
const isEditMode = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const data = await fetchClasses()
    classes.value = data || []
  } catch(e) {
    console.error(e)
    ElMessage.error('获取班级列表失败: ' + (e.message || String(e)))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const handleEdit = (cls) => {
  isEditMode.value = true
  selectedClass.value = cls
  showAddDialog.value = true
}

const handleDelete = async (cls) => {
  try {
    await ElMessageBox.confirm(`确定要解散【${cls.name}】吗？解散后相关学员将被移出本班。`, '解散确认', {
      confirmButtonText: '确定解散',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    // User agreed
    const res = await deleteClass(cls._id)
    if(res && res.success) {
      ElMessage.success('班级已解散')
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
  border: 1px solid var(--gray-200);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.text-btn:hover {
  background: var(--gray-50);
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
  font-size: 14px;
}
.saas-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  color: #475569;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.tag .dot {
  width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;
}
</style>
