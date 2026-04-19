<template>
  <div style="padding-bottom: 24px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <h2 style="margin:0px;font-size:24px;font-weight:800;color:var(--gray-800);letter-spacing:-0.5px">点评记录</h2>
      <div class="toolbar" style="display:flex;align-items:center;gap:16px">
        <select v-model="filterType" style="padding:6px 12px;border-radius:6px;border:1px solid rgb(226,232,240);color:var(--gray-700);font-size:14px;background:white;outline:none;cursor:pointer">
          <option value="all">🌟 所有点评</option>
          <option value="me">👨‍🏫 我的班级点评</option>
          <option disabled>──────</option>
          <option v-for="t in teachers" :key="t._id" :value="t.name">教师: {{ t.name }}</option>
        </select>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--gray-700);font-size:14px;font-weight:500">
          <input type="checkbox" v-model="onlyUnreviewed" style="width:16px;height:16px;accent-color:var(--primary)" /> 仅看未点评 
        </label>
        <button class="primary-btn" style="border-radius:999px;padding:10px 24px" @click="showBatchDialog = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:text-bottom">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>批量核销 
        </button>
      </div>
    </div>
    
    <div class="saas-card" style="padding:0px;overflow:hidden" v-loading="loading">
      <table class="data-table">
        <thead>
          <tr>
            <th>上课日期</th>
            <th>学员姓名</th>
            <th>课程名称</th>
            <th>授课内容</th>
            <th>授课老师</th>
            <th>扣除课时</th>
            <th>老师点评</th>
            <th>作品(预览)</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in filteredRecords" :key="record._id">
            <td class="date-text">{{ record.date }}</td>
            <td class="bold-text">{{ record.studentName }}</td>
            <td><span class="tag">{{ record.course }}</span></td>
            <td>
              <div style="font-size: 12px; color: #475569; max-width: 180px; line-height: 1.4;">
                <span style="color: #0f172a; font-weight: 500;">[内容]</span> {{ record.courseContent || '无' }}<br/>
                <span style="color: #64748b;">[备注]</span> {{ record.teacherRemark || '无' }}
              </div>
            </td>
            <td>{{ record.teacher }}</td>
            <td style="color:rgb(239,68,68);font-weight:bold">-{{ record.consume || 1 }} 节</td>
            <td style="max-width:200px">
              <div v-if="record.comment" style="display: flex; align-items: center; gap: 6px;">
                <span class="address-text" :title="record.comment" style="flex: 1; min-width: 0;">
                  {{ record.comment }}
                </span>
                <el-button 
                  v-if="record.comment.length > 15" 
                  type="primary" 
                  link 
                  size="small" 
                  @click="showFullComment(record.comment)"
                  style="flex-shrink: 0; font-size: 12px; padding: 0;"
                >
                  全部
                </el-button>
              </div>
              <span v-else style="color: #94a3b8; font-size: 13px;">暂无点评</span>
            </td>
            <td>
              <template v-if="Array.isArray(record.artwork) && record.artwork.length > 0">
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <el-image 
                    v-for="(url, idx) in record.artwork" 
                    :key="idx" 
                    :src="url" 
                    :preview-src-list="record.artwork"
                    :initial-index="idx"
                    preview-teleported
                    style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #e2e8f0; flex-shrink: 0;"
                    fit="cover"
                  />
                </div>
              </template>
              <template v-else-if="typeof record.artwork === 'string' && record.artwork.trim() !== ''">
                  <el-image 
                    :src="record.artwork" 
                    :preview-src-list="[record.artwork]"
                    preview-teleported
                    style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #e2e8f0;"
                    fit="cover"
                  />
              </template>
              <span v-else style="color: #94a3b8; font-size: 12px;">未上传</span>
            </td>
            <td>
              <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, record)">
                <button class="text-btn" style="color:var(--primary); display:flex; align-items:center; gap:4px;">
                  管理操作 <el-icon><ArrowDown /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="editReview">{{ record.comment ? '修改点评' : '填写点评' }}</el-dropdown-item>
                    <el-dropdown-item command="revertReview" divided style="color: var(--warning)">回撤点评</el-dropdown-item>
                    <el-dropdown-item command="revertConsume" style="color: var(--danger)">回撤这条消课</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </td>
          </tr>
          <tr v-if="filteredRecords.length === 0 && !loading">
             <td colspan="9" style="text-align: center; padding: 40px; color: #94a3b8">没有找到相关点评记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modals -->
    <BatchConsumeDialog v-model="showBatchDialog" @refresh="loadData" />
    <ReviewDialog v-model="showReviewDialog" :record="currentReviewRecord" @refresh="loadData" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { fetchRecords, revertConsume, updateReview } from '../api/records'
import { fetchTeachers } from '../api/teachers'
import BatchConsumeDialog from './components/BatchConsumeDialog.vue'
import ReviewDialog from './components/ReviewDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { checkIsAdmin } from '../utils/api'
import { ArrowDown } from '@element-plus/icons-vue'

const records = ref([])
const teachers = ref([])
const loading = ref(true)
const showBatchDialog = ref(false)
const showReviewDialog = ref(false)
const currentReviewRecord = ref(null)

const filterType = ref('all')
const onlyUnreviewed = ref(false)
const isAdmin = ref(false)

const showFullComment = (comment) => {
  ElMessageBox.alert(
    `<div style="line-height: 1.6; font-size: 14px; max-height: 50vh; overflow-y: auto;">${comment.replace(/\n/g, '<br/>')}</div>`, 
    '点评详情', 
    {
      confirmButtonText: '关闭',
      dangerouslyUseHTMLString: true,
      customClass: 'glass-dialog'
    }
  )
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await fetchRecords()
    records.value = data || []
    
    // Also load teachers for the filter
    const tData = await fetchTeachers()
    teachers.value = tData || []
  } catch(e) {
    console.error(e)
    ElMessage.error('获取记录失败: ' + (e.message || String(e)))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  isAdmin.value = checkIsAdmin()
  loadData()
})

const filteredRecords = computed(() => {
  let list = records.value
  
  if (filterType.value === 'me') {
    // 假设当前用户是通过 localStorage 登录的老师
    const myName = localStorage.getItem('_callerName') || '未知'
    list = list.filter(r => r.teacher === myName)
  } else if (filterType.value !== 'all') {
    // Filter by specific teacher
    list = list.filter(r => r.teacher === filterType.value)
  }

  if (onlyUnreviewed.value) {
    list = list.filter(r => !r.comment || r.comment.trim() === '')
  }

  return list
})

const handleCommand = async (cmd, record) => {
  if (cmd === 'editReview') {
    if (!isAdmin.value && record.comment) {
      ElMessage.warning('这条消课记录已固化，仅超管可以修改')
      return
    }
    currentReviewRecord.value = record
    showReviewDialog.value = true
  }
  
  if (cmd === 'revertReview') {
    if (!isAdmin.value) {
      ElMessage.error('权限不足，仅管理员可回撤点评！')
      return;
    }
    try {
      await ElMessageBox.confirm('这将会清空这条消课记录中的文字内容和图片画作，确定要撤回点评吗？', '回撤点评', { type: 'warning' })
      loading.value = true
      const res = await updateReview(record._id, '', [])
      if (res.success) {
        ElMessage.success('点评已被撤销清空')
        await loadData()
      } else {
         ElMessage.error(res.msg)
      }
    } catch(e) { if(e !== 'cancel') ElMessage.error('操作异常') }
    finally { loading.value = false }
  }

  if (cmd === 'revertConsume') {
    if (!isAdmin.value) {
      ElMessage.error('权限不足，仅管理员可撤销消课记录！')
      return;
    }
    try {
      await ElMessageBox.confirm(`撤回消课将会将该记录销毁，并把扣除的 ${record.consume || 1} 课时原封不动退还给学员 ${record.studentName}，是否继续？`, '销课回撤', { type: 'error' })
      loading.value = true
      const res = await revertConsume(record._id)
      if (res.success) {
        ElMessage.success(`课时已退还给 ${record.studentName}`)
        await loadData()
      } else {
         ElMessage.error(res.msg)
      }
    } catch(e) { if(e !== 'cancel') ElMessage.error('网络请求异常') }
    finally { loading.value = false }
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
  display: flex;
  align-items: center;
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
  padding: 16px 12px;
  background: #f8fafc;
  color: #64748b;
  font-weight: 500;
  font-size: 13px;
  border-bottom: 1px solid #e2e8f0;
}
.data-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.data-table tbody tr:hover td {
  background: #f8fafc;
}
.bold-text {
  font-weight: 600;
  font-size: 14px;
  color: #0f172a;
}
.date-text {
  font-family: monospace;
  color: #64748b;
  font-size: 13px;
}
.address-text {
  font-size: 12px;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.saas-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
.tag {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
</style>
