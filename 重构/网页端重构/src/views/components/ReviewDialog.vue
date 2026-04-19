<template>
  <el-dialog
    v-model="visible"
    title="填写/修改点评"
    width="500px"
    class="saas-dialog"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form label-width="80px" size="large">
        <el-form-item label="学员姓名">
          <div style="font-weight: 600;">{{ record?.studentName || '-' }}</div>
        </el-form-item>
        <el-form-item label="授课内容">
          <div style="color: var(--gray-500); line-height: 1.4;">{{ record?.courseContent || '无记录' }}</div>
        </el-form-item>
        <el-form-item label="教师点评">
          <el-input 
            v-model="form.comment" 
            type="textarea" 
            rows="4" 
            placeholder="写下对学员今天表现的点评吧..." 
          />
        </el-form-item>
        <el-form-item label="作品图片(可选)">
          <div style="width: 100%;">
            <!-- 已经上传的云端图片和本地待传图片的综合预览区 -->
            <div v-if="form.artwork.length > 0 || pendingFiles.length > 0" style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
              
              <!-- 1. 已存云端图片 -->
              <div v-for="(url, idx) in form.artwork" :key="'cloud-'+idx" style="position: relative; width: 64px; height: 64px;">
                <img :src="url" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 1px solid var(--gray-200);" />
                <div @click="removeArtwork(idx)" style="position: absolute; top: -6px; right: -6px; background: white; color: var(--danger); border-radius: 50%; cursor: pointer; padding: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
                  <el-icon><Close /></el-icon>
                </div>
              </div>

              <!-- 2. 本地待传的图片 -->
              <div v-for="(pf, idx) in pendingFiles" :key="'local-'+idx" style="position: relative; width: 64px; height: 64px;">
                <img :src="pf.url" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 2px dashed var(--primary); opacity: 0.8;" />
                <div style="position: absolute; bottom: 2px; width: 100%; text-align: center; font-size: 10px; color: white; background: rgba(0,0,0,0.5); border-radius: 0 0 8px 8px;">待上传</div>
                <div @click="removePending(idx)" style="position: absolute; top: -6px; right: -6px; background: white; color: var(--danger); border-radius: 50%; cursor: pointer; padding: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
                  <el-icon><Close /></el-icon>
                </div>
              </div>

            </div>

            <!-- 上传触发器（无自动上传） -->
            <el-upload
              v-if="(form.artwork.length + pendingFiles.length) < 2"
              class="artwork-uploader"
              action=""
              :auto-upload="false"
              :on-change="handleFileSelect"
              :show-file-list="false"
              accept="image/*"
              style="width: 100%; border: 1px dashed var(--gray-300); border-radius: 8px; text-align: center; padding: 20px 0; cursor: pointer; transition: 0.2s; background: var(--gray-50);"
              :style="{ borderColor: (form.artwork.length + pendingFiles.length) > 0 ? 'var(--primary)' : 'var(--gray-300)' }"
            >
              <div style="color: var(--gray-500); display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <el-icon :size="24"><UploadFilled /></el-icon>
                <span style="font-size: 13px;">点击并选取本地终端文件... (还能上传 {{ 2 - form.artwork.length - pendingFiles.length }} 张)</span>
              </div>
            </el-upload>
          </div>
        </el-form-item>

      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submit" :loading="loading">
          保存点评
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { updateReview } from '../../api/records'
import { app } from '../../utils/api'
import { UploadFilled, Check, Loading, Close } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  record: Object
})

const emit = defineEmits(['update:modelValue', 'refresh'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)

const form = ref({
  comment: '',
  artwork: []
})

watch(() => props.modelValue, (newVal) => {
  if (newVal && props.record) {
    form.value.comment = props.record.comment || ''
    
    if (Array.isArray(props.record.artwork)) {
      form.value.artwork = [...props.record.artwork]
    } else if (typeof props.record.artwork === 'string' && props.record.artwork.trim() !== '') {
      form.value.artwork = [props.record.artwork]
    } else {
      form.value.artwork = []
    }
  }
})

const uploading = ref(false)
const pendingFiles = ref([])

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    pendingFiles.value.forEach(f => URL.revokeObjectURL(f.url)) // clear memory
    pendingFiles.value = []
  }
})

const removeArtwork = (idx) => {
  form.value.artwork.splice(idx, 1)
}

const removePending = (idx) => {
  URL.revokeObjectURL(pendingFiles.value[idx].url)
  pendingFiles.value.splice(idx, 1)
}

const handleFileSelect = (uploadFile) => {
  const file = uploadFile.raw
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return
  }
  
  if (form.value.artwork.length + pendingFiles.value.length >= 2) {
    ElMessage.warning('最多只能选取2张图片')
    return
  }

  pendingFiles.value.push({
    raw: file,
    url: URL.createObjectURL(file)
  })
}

const submit = async () => {
  if (!props.record || !props.record._id) return

  loading.value = true
  try {
    // 1. Upload pending images first
    if (pendingFiles.value.length > 0) {
      for (const pf of pendingFiles.value) {
        const file = pf.raw
        const extension = file.name.split('.').pop() || 'png'
        const cloudPath = `reviews/${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`
        
        try {
          const result = await app.uploadFile({ cloudPath, filePath: file })
          
          // Secure cross-platform compliance: Mini programs sometimes fail to render raw cloud:// IDs across divergent components. Always pull robust HTTPS.
          const tempUrlRes = await app.getTempFileURL({ fileList: [result.fileID] })
          let secureUrl = result.fileID
          if (tempUrlRes.fileList && tempUrlRes.fileList.length > 0 && tempUrlRes.fileList[0].tempFileURL) {
            secureUrl = tempUrlRes.fileList[0].tempFileURL
          }
          
          if (!form.value.artwork) form.value.artwork = []
          form.value.artwork.push(secureUrl)
        } catch (uploadErr) {
          console.error(uploadErr)
          ElMessage.error('图片传输至服务器失败，部分点评可能未保存完整图片')
        }
      }
    }

    // 2. Commit review
    const res = await updateReview(props.record._id, form.value.comment, form.value.artwork)
    if (res.success) {
      ElMessage.success('点评保存成功')
      visible.value = false
      emit('refresh')
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (err) {
    ElMessage.error('网络请求异常: ' + String(err))
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
