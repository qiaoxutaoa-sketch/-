<template>
  <el-dialog v-model="isVisible" title="VipQrCodeDialog.vue">
    <p>VipQrCodeDialog.vue Content</p>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps(['visible'])
const emit = defineEmits(['update:visible'])
const isVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})
</script>
