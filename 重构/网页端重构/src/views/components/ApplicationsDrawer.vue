<template>
  <el-drawer
    v-model="isVisible"
    title="待处理的家长报名申请"
    direction="rtl"
    size="500px"
    destroy-on-close
  >
    <div v-loading="loading" style="padding: 10px;">
      <el-alert
        v-if="!loading && applications.length === 0"
        title="目前没有待审核的报名申请"
        type="info"
        center
        show-icon
        :closable="false"
        style="margin-top: 40px;"
      />
      
      <div 
        v-for="app in applications" 
        :key="app._id"
        class="saas-card"
        style="padding: 16px; margin-bottom: 16px; position: relative"
      >
        <span class="tag" style="position: absolute; top: 16px; right: 16px; background: #fef2f2; color: #ef4444; border: 1px solid #fecaca">
          待审核
        </span>
        <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 8px">
          {{ app.studentName }} <span style="font-size: 12px; color: #94a3b8; font-weight: 500; margin-left: 6px">{{ app.age || '未知' }} / {{ app.gender || '未知' }}</span>
        </div>
        
        <div style="font-size: 13px; color: #475569; margin-bottom: 4px">
          <strong>家长电话：</strong> {{ app.phone }}
        </div>
        <div style="font-size: 13px; color: #475569; margin-bottom: 12px">
          <strong>家庭住址：</strong> {{ app.address || '未填写' }}
        </div>
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 16px">
          提交时间：{{ formatTime(app.timestamp) }}
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end">
          <el-button size="small" type="danger" plain @click="handleReject(app)">驳回申请</el-button>
          <el-button size="small" type="primary" @click="handleApprove(app)">审查补充建档</el-button>
        </div>
      </div>
    </div>

    <!-- 弹窗：重用 AddStudentDialog -->
    <AddStudentDialog 
      v-model="showAdd" 
      :is-edit="false"
      :edit-data="currentAppToApprove" 
      :application-id="currentAppToApprove?._id"
      @refresh="onApproveSuccess" 
    />
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { fetchApplications, manageApplication } from '../../api/students'
import { ElMessage, ElMessageBox } from 'element-plus'
import AddStudentDialog from './AddStudentDialog.vue'

const props = defineProps({
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue', 'refresh'])

const isVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const applications = ref([])
const showAdd = ref(false)
const currentAppToApprove = ref(null)

const loadData = async () => {
  loading.value = true
  try {
    applications.value = await fetchApplications()
  } catch(e) {
    ElMessage.error('拉取申请单失败')
  } finally {
    loading.value = false
  }
}

watch(isVisible, (val) => {
  if (val) loadData()
})

const formatTime = (ts) => {
  if (!ts) return '未知'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const handleApprove = (app) => {
  // 把申请单的信息组装成 AddStudentDialog 期望的样子
  currentAppToApprove.value = {
    name: app.studentName,
    gender: app.gender,
    age: app.age,
    phone: app.phone,
    address: app.address,
    _id: app._id // 这里把申请单 ID 带过去
  }
  showAdd.value = true
}

const onApproveSuccess = () => {
  // AddStudentDialog 内部在建档结束后，会自动调用 manageApplication 改状态
  // 我们这里只需要刷新列表
  showAdd.value = false
  loadData()
  emit('refresh')
}

const handleReject = async (app) => {
  try {
    await ElMessageBox.confirm('确定要驳回该申请吗？该操作不可逆。', '驳回申请', { type: 'warning' })
    const res = await manageApplication(app._id, 'rejected')
    ElMessage.success('已驳回该申请')
    loadData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('发生异常: ' + String(e))
  }
}
</script>

<style scoped>
.saas-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
  transition: all 0.2s;
}
.saas-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}
.tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
}
</style>
