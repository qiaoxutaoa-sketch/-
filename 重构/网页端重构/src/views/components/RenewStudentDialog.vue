<template>
  <el-dialog 
    v-model="isVisible" 
    :title="`为学员【${student?.name || '未知'}】办理续费`" 
    width="500px" 
    destroy-on-close 
    custom-class="glass-dialog glass-dialog-warning"
    :close-on-click-modal="false"
  >
    <div style="margin-bottom: 20px; font-size: 13px; color: #64748b; background: #f8fafc; padding: 12px; border-radius: 8px;">
      ℹ️ 续费后，系统将自动生成对应金额的财务流水账单，并直接累加至学员的【剩余课时总数】中。
    </div>

    <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="custom-form">
      <el-form-item label="缴费日期" prop="lastRenewalDate" required>
        <el-date-picker v-model="form.lastRenewalDate" type="date" placeholder="选择续费日期" style="width: 100%" value-format="YYYY-MM-DD" />
      </el-form-item>
      
      <div class="form-grid">
        <el-form-item label="实收金额 (元)" prop="money" required>
          <el-input-number v-model="form.money" :min="0" :controls="false" placeholder="例如：2980" style="width: 100%" />
        </el-form-item>

        <el-form-item label="买入课时数 (节)" prop="buyHours" required>
          <el-input-number v-model="form.buyHours" :min="0" :controls="false" placeholder="例如：48" style="width: 100%" />
        </el-form-item>
      </div>

      <el-form-item label="附赠课时数 (节)" prop="giftHours">
        <el-input-number v-model="form.giftHours" :min="0" :controls="false" placeholder="例如：4" style="width: 100%" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="isVisible = false" class="btn-cancel" round>取消</el-button>
        <el-button color="#d97706" @click="handleSubmit" :loading="submitting" round class="btn-submit-warning">确认续费</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { renewStudent } from '../../api/students'

const props = defineProps({
  modelValue: Boolean,
  student: Object
})
const emit = defineEmits(['update:modelValue', 'refresh'])

const isVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const submitting = ref(false)

const getToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const defaultForm = () => ({
  lastRenewalDate: getToday(),
  money: undefined,
  buyHours: undefined,
  giftHours: undefined
})

const form = reactive(defaultForm())

watch(isVisible, (val) => {
  if (val) {
    Object.assign(form, defaultForm())
    if (formRef.value) formRef.value.clearValidate()
  }
})

const rules = {
  lastRenewalDate: [{ required: true, message: '请选择缴费日期', trigger: 'change' }],
  money: [{ required: true, message: '请输入实收金额', trigger: 'blur' }],
  buyHours: [{ required: true, message: '请输入买入课时数', trigger: 'blur' }]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (!props.student || !props.student._id) {
        ElMessage.error('无法确定学员ID，请刷新页面')
        return
      }
      submitting.value = true
      try {
        const payload = {
          studentId: props.student._id,
          studentName: props.student.name,
          lastRenewalDate: form.lastRenewalDate,
          addHours: (form.buyHours || 0) + (form.giftHours || 0),
          money: form.money || 0
        }
        
        await renewStudent(payload)
        ElMessage.success('续费办理成功')
        isVisible.value = false
        emit('refresh')
      } catch (err) {
        ElMessage.error('续费失败: ' + err.message)
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 20px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.btn-cancel {
  border: none;
  background: var(--gray-100);
  color: var(--gray-600);
}
.btn-cancel:hover {
  background: var(--gray-200);
}
.btn-submit-warning {
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
  font-weight: 600;
}
</style>
