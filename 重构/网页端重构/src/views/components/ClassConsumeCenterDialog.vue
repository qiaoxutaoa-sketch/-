<template>
  <el-dialog
    v-model="visible"
    width="900px"
    class="saas-dialog consume-center-dialog"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <template #header>
      <div style="color: var(--primary); font-size: 18px; font-weight: 700;">班级群发与消课中心</div>
    </template>

    <div v-loading="loading" style="padding: 10px 20px;">
      
      <!-- Section 1: Default Info -->
      <div style="margin-bottom: 24px;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 12px; color: #1e293b;">
          1. 快速拉取随读名单 (可选)
        </div>
        <el-select disabled v-model="className" style="width: 100%; margin-bottom: 16px;" placeholder="班级名单">
           <el-option :label="className" :value="className"></el-option>
        </el-select>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">上课日期 <span style="color:red">*</span></div>
            <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </div>
          <div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">上课时间 (提醒用) <span style="color:red">*</span></div>
            <el-time-picker v-model="form.time" format="HH:mm" value-format="HH:mm" style="width:100%" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">授课老师 (统一)</div>
            <el-select v-model="form.teacher" style="width:100%">
              <el-option v-for="t in teachers" :key="t._id" :label="t.name" :value="t.name" />
            </el-select>
          </div>
          <div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">授课内容 (统一默认项)</div>
            <div style="display:flex; gap:8px;">
               <el-select filterable v-model="form.courseContent" placeholder="-- 请选择或新增 --" style="width:100%">
                 <el-option v-for="c in courseOptions" :key="c" :label="c" :value="c" />
               </el-select>
               <el-button v-if="isAdminRole" type="primary" color="#4f46e5" @click="showManageCourse = !showManageCourse">管理</el-button>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 8px;">
           <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">课堂备注 (统一默认项)</div>
           <div style="display:flex; gap:8px;">
             <el-select filterable v-model="form.remark" placeholder="-- 请选择或新增 --" style="width:100%">
               <el-option v-for="r in remarkOptions" :key="r" :label="r" :value="r" />
             </el-select>
             <el-button v-if="isAdminRole" type="primary" color="#4f46e5" @click="showManageRemark = !showManageRemark">管理</el-button>
           </div>
        </div>

        <!-- Inline Managers -->
        <div v-if="showManageCourse" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:16px;">
          <div style="font-weight:600; font-size:13px; margin-bottom:12px; color:#1e293b;">授课内容管理 (全局生效)</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <el-tag v-for="opt in courseOptions" :key="opt" closable @close="dropCourse(opt)" type="info">{{ opt }}</el-tag>
          </div>
          <div style="display:flex; gap:8px;">
            <el-input v-model="newCourseName" placeholder="输入新内容..." size="small" style="max-width:200px" @keyup.enter="handlePushCourse" />
            <el-button type="primary" size="small" @click="handlePushCourse" :loading="workingCourse">添加</el-button>
          </div>
        </div>

        <div v-if="showManageRemark" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:16px;">
          <div style="font-weight:600; font-size:13px; margin-bottom:12px; color:#1e293b;">课堂备注项管理 (全局生效)</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <el-tag v-for="opt in remarkOptions" :key="opt" closable @close="dropRemark(opt)" type="info">{{ opt }}</el-tag>
          </div>
          <div style="display:flex; gap:8px;">
            <el-input v-model="newRemarkName" placeholder="输入新备注..." size="small" style="max-width:200px" @keyup.enter="handlePushRemark" />
            <el-button type="primary" size="small" @click="handlePushRemark" :loading="workingRemark">添加</el-button>
          </div>
        </div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1e293b;">
            2. 临时拉取其他学员 <span style="font-weight: normal; color: #64748b;">(如：请假补课)</span>
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">临时学员不触发上方统一设置修改，可在下方单列独指定内容与备注</div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <el-select filterable v-model="tempStudentId" placeholder="-- 支持输入姓名或手机尾号搜索 --" style="flex:1">
               <el-option v-for="s in allStudents" :key="s._id" :label="`${s.name} ${s.phone ? '(' + s.phone.slice(-4) + ')' : ''} - 剩余${s.remain || 0}课时`" :value="s._id"></el-option>
            </el-select>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size: 12px; color:#64748b;">默认扣</span>
              <el-input-number v-model="tempDeduct" :min="0.5" :step="0.5" size="small" style="width: 100px" />
              <span style="font-size: 12px; color:#64748b;">节</span>
            </div>
            <el-button color="#4f46e5" @click="handleAddTempStudent">加入名单往下看 ↓</el-button>
          </div>
        </div>
      </div>

      <!-- Section 3: Table -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-weight: 600; font-size: 14px; color: #1e293b;">
            3. 本次出勤审核 <span style="color:red; font-size:12px; font-weight:normal; margin-left:8px;">* 取消勾选代表请假/缺勤。下方划扣课时可单独修改。</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; background: #fef08a; padding: 4px 12px; border-radius: 4px; border: 1px solid #fde047;">
             批量将划扣课时改为: <el-input-number v-model="batchDeductVal" :min="0" :step="0.5" size="small" style="width: 100px" @change="applyBatchDeduct" />
          </div>
        </div>

        <el-table :data="tableData" style="width: 100%; border: 1px solid #e2e8f0; border-radius: 8px;" @selection-change="handleSelectionChange" ref="attendTable">
           <el-table-column type="selection" width="50" align="center" />
           <el-table-column prop="name" label="姓名" width="100" />
           <el-table-column label="原定课程" min-width="120">
             <template #default="scope">
               <span style="color:#64748b">{{ scope.row.courseName }}</span>
             </template>
           </el-table-column>
           <el-table-column label="剩余/划扣(节)" width="150" align="center">
             <template #default="scope">
               <div style="display:flex; align-items:center; gap:4px; justify-content:center;">
                  <span style="font-size:12px; color:#3b82f6;">余{{ scope.row.remain }}</span>
                  <span>/</span>
                  <el-input-number v-model="scope.row.deduct" :min="0" :step="0.5" size="small" style="width:80px" />
               </div>
             </template>
           </el-table-column>
           <el-table-column label="本次授课内容" min-width="150">
             <template #default="scope">
                <el-input size="small" v-model="scope.row.content" :placeholder="form.courseContent || '默认内容'" />
             </template>
           </el-table-column>
           <el-table-column label="本次备注" min-width="150">
             <template #default="scope">
                <el-input size="small" v-model="scope.row.remark" :placeholder="form.remark || '无'" />
             </template>
           </el-table-column>
           <el-table-column label="操作" width="80" align="center">
             <template #default="scope">
                <el-button type="danger" text size="small" @click="removeRow(scope.$index)">移除</el-button>
             </template>
           </el-table-column>
           <template #empty>
             <div style="padding: 40px; color:#94a3b8;">名单暂无学员，请在上方选择或检查班级绑定</div>
           </template>
        </el-table>
      </div>

    </div>

    <template #footer>
      <div style="display:flex; justify-content:space-between; align-items:center; padding: 0 20px 20px 20px;">
        <div style="background: #f1f5f9; padding: 8px 16px; border-radius: 8px; display:flex; align-items:center;">
          <el-checkbox v-model="sendNotification" style="margin-right:0; font-weight:600; color:#1e40af;">同时推送扣课通知 (对家长微信)</el-checkbox>
        </div>
        <div style="display: flex; gap: 12px;">
          <el-button @click="visible = false" style="border-radius: 8px;">取消</el-button>
          <el-button type="primary" color="#10b981" style="border-radius: 8px; font-weight: 600;" :loading="loading" @click="handleSubmit">
            确认核销点名 ({{ selectedRows.length }}人)
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchStudents } from '../../api/students'
import { fetchTeachers } from '../../api/teachers'
import { fetchCourseCategories, addCourseCategory, deleteCourseCategory } from '../../api/courses'
import { fetchRemarkOptions, addRemarkOption, deleteRemarkOption } from '../../api/settings'
import { batchConsume } from '../../api/records'
import { checkIsAdmin } from '../../utils/api'

const props = defineProps({
  modelValue: Boolean,
  eventData: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['update:modelValue', 'refresh'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const className = ref('')
const teachers = ref([])
const courseOptions = ref([])
const remarkOptions = ref([])
const allStudents = ref([])
const isAdminRole = ref(false)

const form = ref({
  date: '',
  time: '',
  teacher: '',
  courseContent: '',
  remark: ''
})

const tempStudentId = ref('')
const tempDeduct = ref(1)
const batchDeductVal = ref(1)
const sendNotification = ref(true)

const tableData = ref([])
const selectedRows = ref([])
const attendTable = ref(null)

const showManageCourse = ref(false)
const newCourseName = ref('')
const workingCourse = ref(false)

const showManageRemark = ref(false)
const newRemarkName = ref('')
const workingRemark = ref(false)

const handlePushCourse = async () => {
  if (!newCourseName.value.trim()) return
  workingCourse.value = true
  try {
    await addCourseCategory(newCourseName.value.trim())
    courseOptions.value = await fetchCourseCategories()
    newCourseName.value = ''
    ElMessage.success('添加成功')
  } catch(e) {
    ElMessage.error(e.message || '添加失败')
  } finally {
    workingCourse.value = false
  }
}

const dropCourse = async (name) => {
  try {
    await deleteCourseCategory(name)
    courseOptions.value = await fetchCourseCategories()
    ElMessage.success('删除成功')
  } catch(e) {
    ElMessage.error(e.message || '删除失败')
  }
}

const handlePushRemark = async () => {
  if (!newRemarkName.value.trim()) return
  workingRemark.value = true
  try {
    await addRemarkOption(newRemarkName.value.trim())
    remarkOptions.value = await fetchRemarkOptions()
    newRemarkName.value = ''
    ElMessage.success('添加成功')
  } catch(e) {
    ElMessage.error(e.message || '添加失败')
  } finally {
    workingRemark.value = false
  }
}

const dropRemark = async (name) => {
  try {
    await deleteRemarkOption(name)
    remarkOptions.value = await fetchRemarkOptions()
    ElMessage.success('删除成功')
  } catch(e) {
    ElMessage.error(e.message || '删除失败')
  }
}

const applyBatchDeduct = (val) => {
  tableData.value.forEach(row => {
    row.deduct = val
  })
}

const handleSelectionChange = (val) => {
  selectedRows.value = val
}

const removeRow = (index) => {
  tableData.value.splice(index, 1)
}

const handleAddTempStudent = () => {
  if (!tempStudentId.value) return
  
  // Check if already in table
  if (tableData.value.find(r => r.studentId === tempStudentId.value)) {
    ElMessage.warning('该学员已在下方名单中')
    return
  }

  const s = allStudents.value.find(x => x._id === tempStudentId.value)
  if (s) {
    tableData.value.push({
      studentId: s._id,
      name: s.name,
      courseName: s.course || '暂未分类',
      remain: s.remain || 0,
      deduct: tempDeduct.value,
      content: '',
      remark: ''
    })

    // auto select
    nextTick(() => {
      if (attendTable.value) {
        attendTable.value.toggleRowSelection(tableData.value[tableData.value.length - 1], true)
      }
    })
  }

  tempStudentId.value = ''
}

watch(visible, async (newVal) => {
  if (newVal && props.eventData) {
    loading.value = true
    try {
      className.value = props.eventData.title
      
      const d = props.eventData.start ? new Date(props.eventData.start) : new Date()
      form.value.date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      form.value.time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      
      const ep = props.eventData.extendedProps || {}
      form.value.teacher = ep.teacherName || localStorage.getItem('_callerName') || ''
      form.value.courseContent = ep.courseContent || ''
      form.value.remark = ''
      
      isAdminRole.value = checkIsAdmin()
      teachers.value = await fetchTeachers()
      courseOptions.value = await fetchCourseCategories() || []
      remarkOptions.value = await fetchRemarkOptions() || []
      const studentsRaw = await fetchStudents()
      allStudents.value = studentsRaw

      // Populate table with enrolled students
      const enrolledIds = ep.studentIds || [] // Array of string IDs
      tableData.value = []
      
      for (const id of enrolledIds) {
        const matchingS = studentsRaw.find(x => x._id === id)
        if (matchingS) {
          tableData.value.push({
            studentId: matchingS._id,
            name: matchingS.name,
            courseName: className.value,
            remain: matchingS.remain || 0,
            deduct: 1, // default
            content: '',
            remark: ''
          })
        }
      }

      // Default to picking everyone in the list
      nextTick(() => {
        if (attendTable.value) {
          tableData.value.forEach(row => {
            attendTable.value.toggleRowSelection(row, true)
          })
        }
      })

    } catch(e) {
      console.error(e)
      ElMessage.error('加载所需数据失败')
    } finally {
      loading.value = false
    }
  }
})

const handleSubmit = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少勾选一位出勤学员')
    return
  }

  if (!form.value.date || !form.value.time || !form.value.teacher) {
    ElMessage.warning('请完整填写上课日期、时间及授课教师')
    return
  }

  loading.value = true
  try {
    const finalRecords = selectedRows.value.map(row => {
      return {
        studentId: row.studentId,
        studentName: row.name,
        date: form.value.date,
        course: row.courseName, // Keep original or temp course name
        courseContent: row.content || form.value.courseContent || '',
        teacher: form.value.teacher,
        consumeHours: row.deduct,
        teacherRemark: row.remark || form.value.remark || '',
        comment: '' // 留空等待后续评价
      }
    })

    const classSessionId = props.eventData?.extendedProps?._id || 'temp'
    const res = await batchConsume(finalRecords, sendNotification.value, classSessionId)
    if (res.success) {
      ElMessage.success(`成功为 ${selectedRows.value.length} 名学员核销课时！`)
      visible.value = false
      emit('refresh')
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch(e) {
    console.error(e)
    ElMessage.error('核销失败: ' + e.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.consume-center-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 10px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  margin-right: 0;
}
.consume-center-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: white;
}
.consume-center-dialog :deep(.el-dialog__footer) {
  padding: 0;
  border-top: 1px solid #e2e8f0;
}
</style>
