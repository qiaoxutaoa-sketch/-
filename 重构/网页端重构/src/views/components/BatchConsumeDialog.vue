<template>
  <el-dialog
    v-model="visible"
    title="批量核销课时"
    width="800px"
    class="saas-dialog"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading">
      
      <!-- 第一步：筛选学生，加入待消课名单 -->
      <div style="display:flex;gap:16px;margin-bottom:24px;">
        <div style="flex:1">
           <div style="font-weight:600;margin-bottom:8px">1. 选择学员参与核销</div>
           <el-select
             v-model="selectedStudentIds"
             multiple
             filterable
             placeholder="搜索或选择学员"
             style="width: 100%"
           >
             <el-option
               v-for="item in availableStudents"
               :key="item._id"
               :label="`${item.name} ${item.phone ? '(' + item.phone.slice(-4) + ')' : ''} - 剩余${item.remain || 0}课时`"
               :value="item._id"
             >
             </el-option>
           </el-select>
        </div>
      </div>

      <!-- 第二步：批量填写消课信息 -->
      <div v-if="selectedStudentIds.length > 0" style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:24px">
         <div style="font-weight:600;margin-bottom:16px">2. 统一填写消课明细 (应用到所有已选学员)</div>
         <el-form label-width="100px" size="large">
           <el-form-item label="上课日期" required>
             <el-date-picker v-model="batchForm.date" type="date" value-format="YYYY-MM-DD" placeholder="请选择日期" style="width:100%"/>
           </el-form-item>
           <el-form-item label="课程名称" required>
             <el-input v-model="batchForm.course" placeholder="例如：少儿创意美术体验班" />
           </el-form-item>
           <el-form-item label="授课内容">
             <el-input v-model="batchForm.courseContent" type="textarea" placeholder="今天课程的重点和内容" />
           </el-form-item>
           <el-form-item label="授课教师" required>
             <el-select v-model="batchForm.teacher" placeholder="选择授课老师" style="width:100%">
               <el-option v-for="t in teachers" :key="t._id" :label="t.name" :value="t.name" />
             </el-select>
           </el-form-item>
           <el-form-item label="划扣课时" required>
             <el-input-number v-model="batchForm.consumeHours" :min="0.5" :step="0.5" />
           </el-form-item>
         </el-form>
      </div>

      <!-- 第三步：微信通知 -->
      <div style="padding:16px;background:#eff6ff;border-radius:8px;display:flex;align-items:center;justify-content:space-between">
         <div>
            <div style="font-weight:600;color:#1e40af">微信下发核销通知</div>
            <div style="font-size:12px;color:#3b82f6;margin-top:4px">开启后，系统将尝试向已绑定微信的学员家长下发扣课提醒。</div>
         </div>
         <el-switch v-model="sendNotification" />
      </div>

    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submitBatch" :loading="loading" :disabled="selectedStudentIds.length === 0">
          确认核销 ({{ selectedStudentIds.length }}人)
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchStudents } from '../../api/students'
import { fetchTeachers } from '../../api/teachers'
import { batchConsume } from '../../api/records'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'refresh'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const availableStudents = ref([])
const teachers = ref([])
const selectedStudentIds = ref([])
const sendNotification = ref(true)

const batchForm = ref({
  date: new Date().toISOString().split('T')[0],
  course: '',
  courseContent: '',
  teacher: '',
  consumeHours: 1
})

watch(visible, async (newVal) => {
  if (newVal) {
    loading.value = true
    try {
      availableStudents.value = await fetchStudents()
      teachers.value = await fetchTeachers()
      
      // Reset form
      selectedStudentIds.value = []
      const myName = localStorage.getItem('_callerName')
      batchForm.value = {
        date: new Date().toISOString().split('T')[0],
        course: '',
        courseContent: '',
        teacher: myName || '',
        consumeHours: 1
      }
      sendNotification.value = true
    } catch(e) {
      ElMessage.error('加载数据失败')
    } finally {
      loading.value = false
    }
  }
})

const submitBatch = async () => {
  if (!batchForm.value.date || !batchForm.value.course || !batchForm.value.teacher) {
    ElMessage.warning('请完整填写必填的消课明细（日期、课程、老师）')
    return
  }

  loading.value = true
  
  try {
    // 组装 records
    const records = selectedStudentIds.value.map(id => {
      const student = availableStudents.value.find(s => s._id === id)
      return {
        studentId: student._id,
        studentName: student.name,
        date: batchForm.value.date,
        course: batchForm.value.course,
        courseContent: batchForm.value.courseContent,
        teacher: batchForm.value.teacher,
        consumeHours: batchForm.value.consumeHours,
        comment: '' // 默认置空，让老师后续在表格页填写
      }
    })

    const res = await batchConsume(records, sendNotification.value, 'temp')
    if (res.success) {
      ElMessage.success(res.msg || '归档核销成功')
      visible.value = false
      emit('refresh')
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('批量消课请求失败: ' + err.message)
  } finally {
    loading.value = false
  }
}

</script>
<style scoped>
:deep(.el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 20px;
}
:deep(.el-dialog__title) {
  font-weight: 700;
  font-size: 18px;
}
</style>
