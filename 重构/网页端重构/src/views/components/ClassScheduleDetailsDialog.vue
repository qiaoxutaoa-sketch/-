<template>
  <el-dialog
    v-model="visible"
    :show-close="false"
    width="400px"
    class="saas-dialog details-dialog"
    destroy-on-close
  >
    <div style="padding: 10px;">
      <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #1e293b; text-align: center;">班级排课详情</h3>
      
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; font-size: 14px; margin-bottom: 12px;">
          <span style="color: #64748b; width: 70px; font-weight: 500;">班级名称</span>
          <span style="color: #0f172a; font-weight: 600;">{{ eventData?.title || '未知' }}</span>
        </div>
        <div style="display: flex; font-size: 14px; margin-bottom: 12px;">
          <span style="color: #64748b; width: 70px; font-weight: 500;">上课时间</span>
          <span style="color: #3b82f6; font-weight: 600;">{{ formatTimeRange(eventData?.start, eventData?.end) }}</span>
        </div>
        <div style="display: flex; font-size: 14px;">
          <span style="color: #64748b; width: 70px; font-weight: 500;">负责老师</span>
          <span style="color: #0f172a; font-weight: 500;">{{ eventData?.extendedProps?.teacherName || '未知' }}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <el-button color="#ef4444" plain :disabled="eventData?.extendedProps?.status === 'consumed'" style="border-radius: 8px; font-weight: 600;" @click="handleCancelClass">取消本节课</el-button>
        <div style="display: flex; gap: 12px;">
          <el-button style="border-radius: 8px; font-weight: 600;" @click="visible = false">关闭</el-button>
          <el-button v-if="eventData?.extendedProps?.status === 'consumed'" type="info" disabled style="border-radius: 8px; font-weight: 600;">已核销完毕</el-button>
          <el-button v-else type="primary" style="border-radius: 8px; font-weight: 600; box-shadow: 0 4px 10px rgba(99,102,241,0.3);" @click="handleGoDeduct">去点名消课</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  eventData: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['update:modelValue', 'go-consume', 'cancel-class'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formatTimeRange = (start, end) => {
  if (!start) return '未知'
  const d = new Date(start)
  const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const startTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  let endTime = ''
  if (end) {
    const d2 = new Date(end)
    endTime = `-${String(d2.getHours()).padStart(2, '0')}:${String(d2.getMinutes()).padStart(2, '0')}`
  }
  return `${dateStr} ${startTime}${endTime}`
}

const handleGoDeduct = () => {
  visible.value = false
  emit('go-consume', props.eventData)
}

const handleCancelClass = () => {
  emit('cancel-class', props.eventData)
}
</script>

<style scoped>
.details-dialog :deep(.el-dialog__header) {
  display: none;
}
.details-dialog :deep(.el-dialog__body) {
  padding: 10px;
}
</style>
