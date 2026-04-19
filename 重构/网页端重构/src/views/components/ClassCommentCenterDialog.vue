<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="520px"
    class="saas-dialog"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div style="display: flex; flex-direction: column; gap: 12px; max-height: 60vh; overflow-y: auto; padding-right: 4px;">
      <!-- Title Area -->
      <div v-if="classSession" style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
        <div style="font-size: 13px; color: var(--gray-500); display: flex; align-items: center; gap: 6px;">
          <el-icon><Clock /></el-icon> {{ classSession.timeSpan }}
        </div>
        <div style="font-size: 13px; color: var(--gray-500); display: flex; align-items: center; gap: 6px;">
          <el-icon><User /></el-icon> 执教：{{ classSession.instructor }}
        </div>
      </div>

      <!-- Empty status -->
      <div v-if="classRecords.length === 0" style="text-align: center; padding: 30px; color: var(--gray-400); font-size: 13px; background: var(--gray-50); border-radius: 8px;">
        <el-icon :size="32" style="margin-bottom: 8px; color: var(--gray-300);"><InfoFilled /></el-icon>
        <div>此班级在当前日期下暂时没有消课生成的学员记录。</div>
      </div>

      <!-- Student Records List -->
      <div 
        v-for="record in classRecords" 
        :key="record._id" 
        style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: white; border: 1px solid var(--gray-200); border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); transition: 0.2s;"
      >
        <div style="display: flex; align-items: center; gap: 12px;">
          <el-avatar :size="40" style="background: var(--primary-50); color: var(--primary); font-weight: bold; border: 1px solid var(--primary-100)">
            {{ record.studentName.charAt(0) }}
          </el-avatar>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <strong style="color: var(--gray-800); font-size: 15px;">{{ record.studentName }}</strong>
            <span v-if="hasComment(record)" style="font-size: 12px; color: var(--success); display: flex; align-items: center; gap: 4px; font-weight: 600;">
              <el-icon><Select /></el-icon> 已点评
            </span>
            <span v-else style="font-size: 12px; color: var(--danger); display: flex; align-items: center; gap: 4px; font-weight: 600;">
              <el-icon><WarningFilled /></el-icon> 待点评
            </span>
          </div>
        </div>

        <button 
          v-if="!hasComment(record)" 
          class="primary-btn" 
          @click="openReview(record)" 
          style="background: var(--primary); color: white; border: none; border-radius: 999px; padding: 6px 16px; font-size: 13px; font-weight: 600; cursor: pointer;"
        >
          写点评
        </button>
        <button 
          v-else 
          class="primary-btn" 
          @click="openReview(record)" 
          style="background: white; color: var(--gray-600); border: 1px solid var(--gray-200); border-radius: 999px; padding: 6px 16px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s;"
        >
          修改点评
        </button>
      </div>

    </div>

    <template #footer>
      <div style="display: flex; justify-content: flex-end;">
        <el-button v-if="isAllCommented && classRecords.length > 0" type="success" @click="visible = false" style="border-radius: 999px; padding: 8px 24px; font-weight: 600;">完成全部点评</el-button>
        <el-button v-else @click="visible = false" style="border-radius: 999px; padding: 8px 24px; font-weight: 600;">以后再说</el-button>
      </div>
    </template>

    <!-- Nested Review Dialog -->
    <ReviewDialog
      v-model="showReviewDialog"
      :record="activeRecord"
      @refresh="handleReviewRefresh"
    />
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Clock, User, InfoFilled, Select, WarningFilled } from '@element-plus/icons-vue'
import ReviewDialog from './ReviewDialog.vue'

const props = defineProps({
  modelValue: Boolean,
  classSession: {
    type: Object,
    default: null
  },
  allRecords: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'refresh'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => {
  if (props.classSession) return `补写班级点评 - ${props.classSession.className}`
  return '补写班级点评'
})

const classRecords = computed(() => {
  if (!props.classSession) return []
  return props.allRecords.filter(r => (r.classId === props.classSession._id || r.course === props.classSession.className) && r.date === props.classSession.date)
})

const hasComment = (record) => {
  return record.comment && record.comment.trim() !== ''
}

const isAllCommented = computed(() => {
  return classRecords.value.length > 0 && classRecords.value.every(r => hasComment(r))
})

// === Nested Review Dialog ===
const showReviewDialog = ref(false)
const activeRecord = ref(null)

const openReview = (record) => {
  activeRecord.value = record
  showReviewDialog.value = true
}

const handleReviewRefresh = () => {
  // When a single review is saved, trigger global Dashboard refresh
  emit('refresh')
}
</script>

<style scoped>
:deep(.el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid var(--gray-100);
  padding-bottom: 20px;
}
:deep(.el-dialog__title) {
  font-weight: 800;
  font-size: 18px;
  color: var(--gray-800);
}
.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
</style>
