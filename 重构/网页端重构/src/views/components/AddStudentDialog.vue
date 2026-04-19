<template>
  <el-dialog 
    v-model="isVisible" 
    :title="isEdit ? '编辑学员资料' : '录入新学员'" 
    width="600px" 
    destroy-on-close 
    custom-class="glass-dialog"
    :close-on-click-modal="false"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="custom-form">
      <!-- 基础信息区 -->
      <div class="form-grid">
        <el-form-item label="学号 (系统唯一标识)" prop="studentNo">
          <el-input v-model="form.studentNo" disabled placeholder="保存后自动生成顺延号" />
        </el-form-item>
        <el-form-item label="学员姓名" prop="name" required>
          <el-input v-model="form.name" placeholder="输入姓名" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio label="男孩">男孩</el-radio>
            <el-radio label="女孩">女孩</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄 / 出生年月" prop="age">
          <el-input v-model="form.age" placeholder="例如：8岁 / 2015-05" />
        </el-form-item>

        <el-form-item label="家长联系电话" prop="phone" required>
          <el-input v-model="form.phone" placeholder="用于接收通知和联系" />
        </el-form-item>
        <el-form-item label="报名课程系列" prop="course">
          <el-select v-model="form.course" placeholder="请选择课程分类" style="width: 100%" filterable>
            <el-option v-for="opt in contentOpts" :key="opt" :label="opt" :value="opt" />
          </el-select>
        </el-form-item>

        <el-form-item label="家庭住址/小区" prop="address" class="full-width">
          <el-input v-model="form.address" placeholder="选填，方便接送沟通" />
        </el-form-item>
      </div>

      <el-divider v-if="!isEdit">
        <span style="color:#64748b;font-size:12px;font-weight:500;">首充财务数据配置（创建后作为基础不可更改，只能通过续费叠加）</span>
      </el-divider>

      <!-- 财务信息区 -->
      <div class="form-grid" v-if="!isEdit">
        <el-form-item label="系统录入日期" prop="enrollDate" required>
          <el-date-picker v-model="form.enrollDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="实际支付金额 (元, 选填)" prop="actualPay">
          <el-input-number v-model="form.actualPay" :min="0" :controls="false" placeholder="如：3980" style="width: 100%" />
        </el-form-item>

        <el-form-item label="购买课时包 (节)" prop="buyHours" required>
          <el-input-number v-model="form.buyHours" :min="0" :controls="false" placeholder="如：48" style="width: 100%" />
        </el-form-item>
        <el-form-item label="额外赠送课时 (节)" prop="giftHours">
          <el-input-number v-model="form.giftHours" :min="0" :controls="false" placeholder="如：4" style="width: 100%" />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="isVisible = false" class="btn-cancel" round>取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting" class="btn-submit" round color="#0f172a">{{ isEdit ? '保存修改' : '提交档案' }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { addStudent, updateStudent } from '../../api/students'
import { fetchCourseCategories } from '../../api/courses'

const props = defineProps({
  modelValue: Boolean,
  isEdit: Boolean,
  editData: Object,
  applicationId: String
})
const emit = defineEmits(['update:modelValue', 'refresh'])

const isVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const submitting = ref(false)
const contentOpts = ref(['创意美术', '系统国画', '软笔书法', '硬笔书法', '素描色彩'])

const getToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const defaultForm = () => ({
  studentNo: '',
  name: '',
  gender: '男孩',
  age: '',
  phone: '',
  course: '',
  address: '',
  enrollDate: getToday(),
  actualPay: undefined,
  buyHours: undefined,
  giftHours: undefined
})

const form = reactive(defaultForm())

const handleOpen = async () => {
  if (formRef.value) formRef.value.clearValidate()
  try {
    contentOpts.value = await fetchCourseCategories()
  } catch (e) {
    console.warn('下拉框数据拉取失败', e)
  }
}

watch(isVisible, (val) => {
  if (val) {
    handleOpen()
    if (props.editData) {
      Object.assign(form, defaultForm(), props.editData)
    } else {
      Object.assign(form, defaultForm())
    }
  }
})

const rules = {
  name: [{ required: true, message: '请输入学员姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入家长联系电话', trigger: 'blur' }],
  enrollDate: [{ required: true, message: '请选择录入日期', trigger: 'change' }],
  buyHours: [{ required: true, message: '请输入购买课时', trigger: 'blur' }]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const payload = JSON.parse(JSON.stringify(form))
        if (props.isEdit && props.editData) {
          const updateData = {
            name: payload.name,
            gender: payload.gender,
            age: payload.age,
            phone: payload.phone,
            course: payload.course,
            address: payload.address,
            timestamp: Date.now()
          }
          await updateStudent(props.editData._id, updateData)
          ElMessage.success('学员资料更新成功')
        } else {
          const studentData = {
            studentNo: 'QJ' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
            name: form.name,
            gender: form.gender,
            age: form.age,
            phone: form.phone,
            course: form.course,
            address: form.address,
            enrollDate: form.enrollDate,
            initialHours: form.buyHours || 0,
            bonusHours: form.giftHours || 0,
            totalHours: (form.buyHours || 0) + (form.giftHours || 0),
            remain: (form.buyHours || 0) + (form.giftHours || 0),
            money: form.actualPay || 0,
            lastRenewalDate: form.enrollDate,
            creator: '超管录入',
            avatar: '/images/avatar_p6.jpg', // 默认占位图
            timestamp: Date.now()
          }
          const res = await addStudent(studentData, form.actualPay || 0)
          
          // 如果是来自报名申请的建档，顺便将申请单状态置为 approved
          if (props.applicationId && res.id) {
            const { manageApplication } = await import('../../api/students.js');
            await manageApplication(props.applicationId, 'approved', res.id);
          }
          
          ElMessage.success('学员建档成功')
        }
        isVisible.value = false
        emit('refresh')
      } catch (err) {
        ElMessage.error((props.isEdit ? '更新' : '建档') + '失败: ' + err.message)
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>

<style scoped>
/* Imitating the user's high-fidelity glass dialog design */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 20px;
}
.full-width {
  grid-column: span 2;
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
</style>

<style>
/* Global overrides to make element plus dialog glassy */
.glass-dialog {
  border-radius: 16px !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(20px) !important;
  background: rgba(255, 255, 255, 0.95) !important;
}
.glass-dialog .el-dialog__header {
  border-bottom: 1px solid rgba(0,0,0,0.04);
  margin-right: 0;
  padding: 20px 24px;
}
.glass-dialog .el-dialog__title {
  font-weight: 800;
  color: #1e293b;
  font-size: 18px;
}
.custom-form .el-form-item__label {
  font-weight: 600;
  color: #475569;
  padding-bottom: 4px;
}
.custom-form .el-input__wrapper {
  background: #f8fafc;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
}
.custom-form .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 2px #3b82f6 inset;
}
</style>
