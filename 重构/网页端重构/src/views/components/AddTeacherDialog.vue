<template>
  <el-dialog 
    v-model="isVisible" 
    :title="isEdit ? '编辑教师档案' : '创建新教师账号'"
    width="550px" 
    destroy-on-close 
    custom-class="glass-dialog"
    :close-on-click-modal="false"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="custom-form">
      <!-- 基础信息区 -->
      <div class="form-grid">
        <el-form-item label="教师姓名" prop="name" required>
          <el-input v-model="form.name" placeholder="输入姓名，如：周老师" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio label="先生">先生</el-radio>
            <el-radio label="女士">女士</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="登录账号(手机号)" prop="phone" required class="full-width">
          <el-input v-model="form.phone" placeholder="用于登录系统，须保持唯一性" />
        </el-form-item>

        <el-form-item label="年龄/出生大年" prop="birthYear">
          <el-input v-model="form.birthYear" placeholder="例如：28岁 / 1996年" />
        </el-form-item>
        <el-form-item label="毕业院校及专业" prop="university" required>
          <el-input v-model="form.university" placeholder="例如：中央美院 - 国画系" />
        </el-form-item>

        <el-form-item v-if="!isEdit" label="独立登录密码" prop="password" required class="full-width">
          <el-input v-model="form.password" placeholder="请输入初始密码" show-password />
          <div style="font-size: 12px; color: #94a3b8; line-height: 1.4; margin-top: 4px;">由系统管理员统一预设分配，此密码将在第一次登录时生效。</div>
        </el-form-item>
      </div>

      <el-divider>
        <span style="color:#64748b;font-size:12px;font-weight:500;">系统角色设置与数字权限分配（关键操作）</span>
      </el-divider>

      <!-- 角色权限区 -->
      <el-form-item label="系统角色设定" prop="role" required>
        <el-radio-group v-model="form.role" class="block-radio-group">
          <div class="role-option" :class="{ active: form.role === 'teacher' }" @click="form.role = 'teacher'">
            <div class="role-title">授课教师</div>
            <div class="role-desc">常规岗位，仅拥有学生班级管理与签到消课权限，无核心经营数据查看权限。</div>
          </div>
          <div class="role-option danger-role" :class="{ active: form.role === 'admin' }" @click="form.role = 'admin'">
            <div class="role-title">超级管理员（校长/大区主管）</div>
            <div class="role-desc">拥有所有模块的生杀大权，包含全局系统配置更新、经营流水大盘查看与账号发配。</div>
          </div>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="isVisible = false" class="btn-cancel" round>取消放弃</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting" class="btn-submit" round color="#0f172a">{{ isEdit ? '保存修改' : '确认发布' }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { addTeacher, updateTeacher } from '../../api/teachers'

const props = defineProps({
  modelValue: Boolean,
  isEdit: Boolean,
  editData: Object
})
const emit = defineEmits(['update:modelValue', 'refresh'])

const isVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const submitting = ref(false)

const defaultForm = () => ({
  name: '',
  gender: '女士',
  phone: '',
  birthYear: '',
  university: '',
  password: '',
  role: 'teacher',
  avatar: ''
})

const form = reactive(defaultForm())

watch(isVisible, (val) => {
  if (val) {
    if (props.isEdit && props.editData) {
      Object.assign(form, defaultForm(), props.editData)
    } else {
      Object.assign(form, defaultForm())
      form.password = Math.random().toString().slice(2, 8) 
    }
    if (formRef.value) formRef.value.clearValidate()
  }
})

const rules = {
  name: [{ required: true, message: '请输入教师姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入登录手机号', trigger: 'blur' }],
  university: [{ required: true, message: '请输入毕业院校信息', trigger: 'blur' }],
  password: [{ required: false, message: '请输入初始密码', trigger: 'blur' }]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const itemData = {
          name: form.name,
          gender: form.gender,
          phone: form.phone,
          birthYear: form.birthYear,
          university: form.university,
          password: form.password,
          role: form.role,
          avatar: form.avatar || 'https://636c-cloud1-1gh9yp0ib85d4b4b-1411986206.tcb.qcloud.la/avatars/default.jpg'
        }

        if (props.isEdit && props.editData) {
          itemData._id = props.editData._id
          await updateTeacher(itemData)
          ElMessage.success('档案更新成功')
        } else {
          await addTeacher(itemData)
          ElMessage.success('教师账号签发成功')
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
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 20px;
}
.full-width {
  grid-column: span 2;
}

.block-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.role-option {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
}
.role-option:hover {
  border-color: #cbd5e1;
}
.role-option.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.role-option.danger-role.active {
  border-color: #ef4444;
  background: #fef2f2;
}

.role-title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 4px;
}
.role-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
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
