<template>
  <el-dialog 
    v-model="isVisible" 
    :title="isEdit ? '编辑班级' : '新建班级'"
    width="800px" 
    destroy-on-close 
    custom-class="glass-dialog"
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="custom-form">
      <div class="form-grid">
        <el-form-item label="班级名称" prop="name" required class="full-width">
          <el-input v-model="form.name" placeholder="如：国画启蒙一班" />
        </el-form-item>

        <el-form-item label="负责老师" prop="teacherName">
          <el-select v-model="form.teacherName" placeholder="-- 可选填 --" style="width: 100%">
            <el-option v-for="t in teachers" :key="t._id" :label="t.name" :value="t.name" />
          </el-select>
        </el-form-item>

        <el-form-item label="默认授课内容 (消课时自动带入)" prop="courseContent">
          <div style="display:grid; grid-template-columns: 1fr auto; gap: 8px; width: 100%;">
            <el-select v-model="form.courseContent" placeholder="-- 请选择 --" style="width: 100%" filterable>
              <el-option v-for="opt in contentOpts" :key="opt" :label="opt" :value="opt" />
            </el-select>
            <el-button v-if="isAdminRole" type="primary" plain @click="showManageCourse = !showManageCourse">{{ showManageCourse ? '收起管理' : '管理选项' }}</el-button>
          </div>
        </el-form-item>

        <el-form-item label="上课星期" prop="scheduleDay" required>
          <el-select v-model="form.scheduleDay" placeholder="周六" style="width: 100%">
            <el-option v-for="d in ['周一','周二','周三','周四','周五','周六','周日']" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间段" prop="scheduleTime" required>
          <el-input v-model="form.scheduleTime" placeholder="如：10:00-11:30" />
        </el-form-item>
      </div>

      <!-- Inline Manager - Moved OUTSIDE form-grid to prevent breaking the 2-column layout -->
      <div v-if="showManageCourse" class="course-manager-panel">
        <div class="panel-title">课程选项管理（全局生效）</div>
        <div class="manager-body">
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
            <el-tag v-for="opt in contentOpts" :key="opt" closable @close="handleDeleteCourse(opt)" type="info" size="large" class="manage-tag">
              {{ opt }}
            </el-tag>
            <span v-if="contentOpts.length === 0" style="color:var(--gray-400);font-size:13px;">无自定义选项</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <el-input v-model="newCourseName" placeholder="输入新类目后按回车或点击添加..." style="flex:1; max-width: 300px;" @keyup.enter="handleAddCourse" />
            <el-button type="primary" color="#0f172a" @click="handleAddCourse" :loading="addingCourse">添加到列表</el-button>
          </div>
        </div>
      </div>

      <el-divider>
        <span style="color:#64748b;font-size:12px;font-weight:500;">排入本班的学员名单（点击右侧即可拉入）</span>
      </el-divider>

      <!-- 双向穿梭框变体设计 -->
      <div class="transfer-container">
        <!-- 左侧：已选 -->
        <div class="transfer-panel">
          <div class="panel-header">已选学员 ({{ form.studentIds.length }}人)</div>
          <div class="panel-body">
            <div v-if="form.studentIds.length === 0" class="empty-state">还没选择任何人</div>
            <div v-else class="student-item" v-for="stu in selectedStudentsObj" :key="stu._id">
              <span>{{ stu.name }}</span>
              <el-button link type="danger" @click="removeStudent(stu._id)">移除</el-button>
            </div>
          </div>
        </div>
        
        <!-- 右侧：候选 -->
        <div class="transfer-panel">
          <div class="panel-header">
            <el-input v-model="studentSearch" placeholder="搜索所有学员..." prefix-icon="Search" size="small" />
          </div>
          <div class="panel-body">
            <div class="student-item" v-for="stu in filteredCandidateStudents" :key="stu._id">
              <span>{{ stu.name }}</span>
              <el-button link type="primary" @click="addStudent(stu._id)">+ 加入</el-button>
            </div>
            <div v-if="filteredCandidateStudents.length === 0" class="empty-state" style="margin-top: 20px;">无匹配结果</div>
          </div>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="isVisible = false" class="btn-cancel" round>取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting" class="btn-submit" round color="#0f172a">{{ isEdit ? '保存修改' : '确定保存' }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { addClass, updateClass } from '../../api/classes'
import { fetchStudents } from '../../api/students'
import { fetchTeachers } from '../../api/teachers'
import { fetchCourseCategories, addCourseCategory, deleteCourseCategory } from '../../api/courses'
import { checkIsAdmin } from '../../utils/api'

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
const teachers = ref([])
const allStudents = ref([])
const contentOpts = ref(['创意美术', '系统国画', '软笔书法', '硬笔书法', '素描色彩'])

const studentSearch = ref('')

const defaultForm = () => ({
  name: '',
  teacherName: '',
  courseContent: '',
  scheduleDay: '周六',
  scheduleTime: '',
  studentIds: []
})

const form = reactive(defaultForm())

watch(isVisible, (val) => {
  if (val) {
    if (props.isEdit && props.editData) {
      Object.assign(form, defaultForm(), props.editData)
    } else {
      Object.assign(form, defaultForm())
    }
    studentSearch.value = ''
    if (formRef.value) formRef.value.clearValidate()
  }
})

const isAdminRole = ref(false)

// 二级弹窗控制
const showManageCourse = ref(false)
const newCourseName = ref('')
const loadingCourses = ref(false)
const addingCourse = ref(false)

const loadCourses = async () => {
  loadingCourses.value = true
  try {
    contentOpts.value = await fetchCourseCategories()
  } catch(e) {
    ElMessage.error('获取课程类目失败')
  } finally {
    loadingCourses.value = false
  }
}

onMounted(() => {
  isAdminRole.value = checkIsAdmin()
})

const handleOpen = async () => {
  try {
    teachers.value = await fetchTeachers(0, 100)
    allStudents.value = await fetchStudents(0, 500)
    await loadCourses()
  } catch(e) {
    ElMessage.error('下拉框数据拉取失败')
  }
}

const handleAddCourse = async () => {
  if (!newCourseName.value.trim()) return
  addingCourse.value = true
  try {
    await addCourseCategory(newCourseName.value.trim())
    ElMessage.success('添加成功')
    newCourseName.value = ''
    await loadCourses()
  } catch(e) {
    ElMessage.error(e.message || '添加失败')
  } finally {
    addingCourse.value = false
  }
}

const handleDeleteCourse = async (name) => {
  try {
    await deleteCourseCategory(name)
    ElMessage.success('已删除')
    await loadCourses()
  } catch(e) {
    ElMessage.error(e.message || '删除失败')
  }
}

const selectedStudentsObj = computed(() => {
  return form.studentIds.map(id => allStudents.value.find(s => s._id === id)).filter(Boolean)
})

const filteredCandidateStudents = computed(() => {
  return allStudents.value.filter(s => {
    // 排除已选
    if (form.studentIds.includes(s._id)) return false;
    // 关键字搜索
    if (studentSearch.value) {
      const q = studentSearch.value.toLowerCase()
      if (!s.name.toLowerCase().includes(q) && !(s.phone && s.phone.includes(q))) return false;
    }
    return true;
  })
})

const addStudent = (id) => {
  form.studentIds.push(id)
}
const removeStudent = (id) => {
  form.studentIds = form.studentIds.filter(v => v !== id)
}

const rules = {
  name: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
  scheduleDay: [{ required: true, message: '请选择上课星期', trigger: 'change' }],
  scheduleTime: [{ required: true, message: '请输入时间段', trigger: 'blur' }]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // Deep clone to prevent Proxy serialization error in Cloud SDK
        const payload = JSON.parse(JSON.stringify(form))
        if (form.teacherName) {
          const t = teachers.value.find(t => t.name === form.teacherName)
          if (t) {
            payload.teacherId = t._id
            payload.teacherPhone = t.phone
          } else {
            payload.teacherId = ''
            payload.teacherPhone = ''
          }
        } else {
          payload.teacherId = ''
          payload.teacherPhone = ''
        }

        if (props.isEdit && props.editData) {
          await updateClass(props.editData._id, payload)
          ElMessage.success('班级修改成功')
        } else {
          await addClass(payload)
          ElMessage.success('班级创建成功')
        }
        isVisible.value = false
        emit('refresh')
      } catch (err) {
        ElMessage.error('保存失败: ' + err.message)
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

.course-manager-panel {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  margin-top: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
}

.course-manager-panel .panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--gray-100);
}

.manage-tag {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  color: var(--gray-700);
  font-weight: 500;
  border-radius: 8px;
}

:deep(.el-tag__close:hover) {
  background-color: var(--danger) !important;
  color: white !important;
}

/* 响应式适配 */
.transfer-container {
  display: flex;
  gap: 20px;
  height: 280px;
}
.transfer-panel {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
}
.panel-header {
  padding: 12px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
}
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.student-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 6px;
  transition: 0.2s;
  background: white;
  margin-bottom: 6px;
  border: 1px solid #e2e8f0;
}
.student-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.empty-state {
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  margin-top: 100px;
}
</style>
