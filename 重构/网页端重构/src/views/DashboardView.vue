<template>
  <div style="height: 100%; display: flex; flex-direction: column; overflow-y: hidden;">
    <!-- Top Welcome Banner -->
    <div class="saas-card pastel-panel" style="flex-shrink:0;background:linear-gradient(135deg,var(--primary-100),var(--primary-50));margin-bottom:24px;padding:24px 32px;display:flex;justify-content:space-between;align-items:center;border:none">
      <div>
        <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:var(--primary-dark);letter-spacing:-0.5px">Welcome back, {{ adminName }}</h1>
        <p style="margin:0;color:var(--primary);font-size:14px">Here is what's happening in your academy today.</p>
      </div>
      <div style="display:flex;align-items:center;gap:24px">
        <div style="display:flex;align-items:center;gap:10px;cursor:pointer">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:white;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;box-shadow:rgba(99,102,241,0.2) 0 4px 10px">{{ adminAbbr }}</div>
          <div style="display:flex;flex-direction:column">
            <span style="font-size:13px;font-weight:600;color:var(--primary-dark);line-height:1.2">{{ adminName }}</span>
            <span style="font-size:11px;color:var(--primary);line-height:1.2">{{ isAdminRole ? '超级管理员' : '授课教师' }}</span>
          </div>
        </div>
        <button class="primary-btn" style="background:white;color:var(--primary);border:1px solid var(--primary-light);border-radius:999px;padding:10px 20px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;box-shadow:rgba(99,102,241,0.1) 0 4px 10px;transition:0.2s" @click="handleInvite">
          <el-icon><CopyDocument /></el-icon> 获取家长专属入场码
        </button>
        <button class="primary-btn" @click="loadData" style="background:var(--primary);border-radius:999px;padding:10px 24px;font-size:14px;font-weight:600;box-shadow:rgba(99,102,241,0.3) 0 8px 20px;display:flex;align-items:center;gap:8px;color:white;border:none;cursor:pointer">
          <el-icon :class="{ 'is-loading': loading }"><Refresh /></el-icon> 刷新数据
        </button>
      </div>
    </div>

    <!-- Data Overview Widgets -->
    <div style="flex-shrink:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px;margin-bottom:24px">
      <!-- 今日排课 -->
      <div class="saas-card" style="display:flex;align-items:center;gap:20px;cursor:pointer">
        <div style="width:56px;height:56px;border-radius:16px;background:rgba(99,102,241,0.1);color:var(--primary);display:flex;align-items:center;justify-content:center">
          <el-icon :size="28"><CalendarIcon /></el-icon>
        </div>
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">今日排课</div>
          <div style="font-size:28px;font-weight:800;color:var(--gray-800);line-height:1">{{ todayClassesCount }} <span style="font-size:14px;font-weight:500;color:var(--gray-400)">个班级</span></div>
        </div>
      </div>
      <!-- 耗尽预警 -->
      <div class="saas-card" style="display:flex;align-items:center;gap:20px;cursor:pointer" @click="$router.push('/students')">
        <div style="width:56px;height:56px;border-radius:16px;background:rgba(239,68,68,0.1);color:var(--danger);display:flex;align-items:center;justify-content:center">
          <el-icon :size="28"><Warning /></el-icon>
        </div>
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">耗尽预警 (<= 4课时)</div>
          <div style="font-size:28px;font-weight:800;color:var(--danger);line-height:1">{{ exhaustedCount }} <span style="font-size:14px;font-weight:500;color:var(--gray-400)">名需催单续费</span></div>
        </div>
      </div>
      <!-- 沉睡预警 -->
      <div class="saas-card" style="display:flex;align-items:center;gap:20px;cursor:pointer">
        <div style="width:56px;height:56px;border-radius:16px;background:rgba(245,158,11,0.1);color:var(--warning);display:flex;align-items:center;justify-content:center">
          <el-icon :size="28"><Timer /></el-icon>
        </div>
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">沉睡预警</div>
          <div style="font-size:28px;font-weight:800;color:var(--warning);line-height:1">{{ sleepCount }} <span style="font-size:14px;font-weight:500;color:var(--gray-400)">人已缺月全勤</span></div>
        </div>
      </div>
      <!-- 营收与耗课记录 -->
      <div class="saas-card" style="display:flex;align-items:center;gap:20px;cursor:pointer" @click="$router.push('/records')">
        <div style="width:56px;height:56px;border-radius:16px;background:rgba(14,165,233,0.1);color:var(--info);display:flex;align-items:center;justify-content:center">
          <el-icon :size="28"><DataAnalysis /></el-icon>
        </div>
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">本月营收记录</div>
          <div style="font-size:28px;font-weight:800;color:var(--gray-800);line-height:1">{{ monthRecordsCount }} <span style="font-size:14px;font-weight:500;color:var(--gray-400)">次实耗记录</span></div>
        </div>
      </div>
    </div>

    <!-- Main Content Area: Today Schedule -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;flex:1 1 0%;min-height:300px">
      <!-- 一周排课全景 (FullCalendar Restored) -->
      <div class="saas-card" style="padding:20px 24px;display:flex;flex-direction:column;min-height:480px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div>
            <h3 style="margin:0 0 4px;color:var(--gray-800);font-size:18px;font-weight:700">一周排课全景</h3>
            <p style="margin:0;font-size:13px;color:var(--gray-400)">支持直接拖拽色块以调整班次上课时间段</p>
          </div>
          <div style="display:flex;gap:10px;align-items:center">
            <button class="primary-btn" @click="handleFillThisWeek" style="background:white;border:1px solid var(--primary);color:var(--primary);border-radius:999px;padding:8px 16px;box-shadow:var(--shadow-sm);display:flex;align-items:center;gap:8px;transition:0.2s">
              <el-icon><Refresh /></el-icon> 利用班级规律填充本周
            </button>
            <button class="primary-btn" @click="handleCopyToNextWeek" style="background:white;border:1px solid var(--gray-200);color:var(--gray-700);border-radius:999px;padding:8px 16px;box-shadow:var(--shadow-sm);display:flex;align-items:center;gap:8px;transition:0.2s">
              <el-icon><CopyDocument /></el-icon> 排班至下周
            </button>
          </div>
        </div>
        <div style="flex:1 1 0%;overflow:hidden;min-height:0px" v-loading="loading">
          <FullCalendar v-if="!loading" :options="calendarOptions" style="height: 100%" />
        </div>
      </div>

      <!-- 今日出勤待办 -->
      <div class="saas-card" style="padding:20px 24px;display:flex;flex-direction:column">
        <h3 style="margin:0 0 16px;color:var(--gray-800);font-size:18px;font-weight:700;display:flex;align-items:center;gap:8px">
          <el-icon color="var(--primary)"><Checked /></el-icon> 今日待办出勤 
        </h3>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;overflow-y:auto">
          <li v-for="cls in todayClasses" :key="cls._id" style="padding:10px 12px;border-radius:10px;background:var(--gray-50);display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <strong style="color:var(--gray-800);font-size:14px;display:block;margin-bottom:2px">{{ cls.className }}</strong>
                <span style="font-size:12px;color:var(--gray-500);display:flex;align-items:center;gap:4px">
                  <el-icon><Clock /></el-icon> {{ cls.timeSpan }}
                </span>
              </div>
            </div>
            <button class="primary-btn" @click="handleCheckIn(cls)" style="width:100%;border-radius:8px;padding:6px;font-size:12px;font-weight:600;background:var(--primary);color:white;border:none;cursor:pointer">去消课中心</button>
          </li>
          <li v-if="todayClasses.length === 0" style="text-align:center;padding:20px;color:#94a3b8;font-size:13px;">今天没有需要负责的班级</li>
        </ul>
      </div>
    </div>

    <ClassScheduleDetailsDialog 
      v-model="showClassDetailsDialog" 
      :event-data="activeEventData" 
      @go-consume="handleGoConsume"
      @cancel-class="handleCancelClass"
    />

    <ClassConsumeCenterDialog
      v-model="showConsumeCenterDialog"
      :event-data="activeEventData"
      @refresh="loadData"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { CopyDocument, Refresh, Calendar as CalendarIcon, Warning, Timer, DataAnalysis, Checked, Clock } from '@element-plus/icons-vue'
import { fetchStudents } from '../api/students'
import { fetchClasses } from '../api/classes'
import { fetchRecords } from '../api/records'
import { checkIsAdmin } from '../utils/api'
import { updateSession, fetchClassSessions, copyWeekSchedule, deleteSession } from '../api/classes'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction' // Need this for clicking events!
import ClassScheduleDetailsDialog from './components/ClassScheduleDetailsDialog.vue'
import ClassConsumeCenterDialog from './components/ClassConsumeCenterDialog.vue'

const router = useRouter()
const loading = ref(true)

const adminName = ref('加载中...')
const adminAbbr = ref('-')
const isAdminRole = ref(false)

const showClassDetailsDialog = ref(false)
const showConsumeCenterDialog = ref(false)
const activeEventData = ref(null)

const students = ref([])
const classSessions = ref([])
const classes = ref([])
const records = ref([])

const activeStartObj = ref(null)
const activeStartStr = ref('')
const activeEndStr = ref('')

const handleDatesSet = async (info) => {
  activeStartObj.value = info.start
  activeStartStr.value = dayjs(info.start).format('YYYY-MM-DD')
  // FullCalendar's info.end is normally exclusive (next day/week/month start limit). We subtract 1 day to get the visual boundary.
  activeEndStr.value = dayjs(info.end).subtract(1, 'day').format('YYYY-MM-DD')
  await loadSessions()
}

const loadSessions = async () => {
  if (!activeStartStr.value) return;
  try {
     classSessions.value = await fetchClassSessions(activeStartStr.value, activeEndStr.value)
  } catch(e) {
     console.error('Failed to fetch class sessions:', e)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const [sData, cData, rData] = await Promise.all([
      fetchStudents(0, 1000),
      fetchClasses(0, 500),
      fetchRecords(0, 2000)
    ])
    students.value = sData || []
    classes.value = cData || []
    records.value = rData || []
    await loadSessions()
  } catch(e) {
    console.error(e)
    ElMessage.error('无法刷新工作台数据')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const name = localStorage.getItem('_callerName') || '未知教师'
  adminName.value = name
  adminAbbr.value = name.charAt(0) || '师'
  isAdminRole.value = checkIsAdmin()
  loadData()
})

// === Computations ===
const todayClasses = computed(() => {
  const todayStr = dayjs().format('YYYY-MM-DD')
  return classSessions.value.filter(c => c.date === todayStr && c.status !== 'consumed')
})
const todayClassesCount = computed(() => todayClasses.value.length)

const exhaustedCount = computed(() => {
  return students.value.filter(s => typeof s.remain === 'number' && s.remain <= 4).length
})

const sleepCount = computed(() => {
  // 简易判断：学员列表里没有近期记录。这里简单返回 mock 或是简单计算...
  // 我们直接数无上课记录的
  return students.value.length > 0 ? Math.floor(students.value.length * 0.1) : 0 // TODO: mock
})

const monthRecordsCount = computed(() => {
  // 当月销课记录数量
  const startOfMonth = dayjs().startOf('month').valueOf()
  return records.value.filter(r => r.createdTimestamp >= startOfMonth).length
})

// === Actions ===
const handleInvite = () => {
  ElMessage.success('入场码生成链接已复制（模拟）')
}

const handleCheckIn = (cls) => {
  // Use the new active event data flow, format it so Consume dialog accepts it
  activeEventData.value = {
    start: `${cls.date}T00:00:00`,
    title: cls.className,
    extendedProps: { ...cls }
  }
  showConsumeCenterDialog.value = true
}

// === FullCalendar Buttons ===
const handleFillThisWeek = async () => {
  if (!activeStartObj.value) return;
  const mondayDateStr = dayjs(activeStartObj.value).format('YYYY-MM-DD')
  loading.value = true
  try {
     const res = await copyWeekSchedule({
       role: 'admin',
       mondayDateStr: mondayDateStr
     })
     ElMessage.success(res.msg)
     await loadSessions()
  } catch(e) {
     ElMessage.error(e.message)
  } finally {
     loading.value = false
  }
}

const handleCopyToNextWeek = async () => {
  if (!activeStartObj.value) return;
  const thisMondayStr = dayjs(activeStartObj.value).format('YYYY-MM-DD')
  const nextMondayStr = dayjs(activeStartObj.value).add(7, 'day').format('YYYY-MM-DD')
  loading.value = true
  try {
     const res = await copyWeekSchedule({
       role: 'admin',
       mondayDateStr: nextMondayStr,
       sourceMondayStr: thisMondayStr
     })
     ElMessage.success(res.msg)
     await loadSessions()
  } catch(e) {
     ElMessage.error(e.message)
  } finally {
     loading.value = false
  }
}

// === FullCalendar Config ===
const mapDay = { '周日': 0, '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6 }

const calendarOptions = computed(() => {
  const events = classSessions.value.map(c => {
    let startT = '10:00'
    let endT = '11:30'
    if (c.timeSpan && c.timeSpan.includes('-')) {
      [startT, endT] = c.timeSpan.split('-').map(s => {
        return s.trim().split(':').map(p => p.padStart(2, '0')).join(':')
      })
    }
    
    const baseClass = classes.value.find(cls => cls._id === c.classId) || {}

    return {
      id: c._id,
      title: c.className || baseClass.name,
      start: `${c.date}T${startT}:00`,
      end: `${c.date}T${endT}:00`,
      backgroundColor: c.status === 'consumed' ? 'var(--gray-300)' : undefined,
      borderColor: c.status === 'consumed' ? 'var(--gray-300)' : undefined,
      editable: c.status !== 'consumed',
      extendedProps: { 
        ...baseClass, // Fallback fields
        ...c,         // Session specific overrides
        teacherName: c.teacherName || baseClass.teacherName, // Explicit ensure teacherName
        courseContent: c.courseContent || baseClass.courseContent
      }
    }
  })

  return {
    plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    firstDay: 1, // Start week on Monday! Very important for proper interval mappings
    datesSet: handleDatesSet,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    buttonText: {
      today: 'Today',
      month: 'Month',
      week: 'Week'
    },
    events: events,
    height: '100%',
    allDaySlot: false,
    slotEventOverlap: false,
    expandRows: true,
    scrollTime: '08:00:00',
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    slotLabelFormat: { hour: 'numeric', omitZeroMinute: true, meridiem: 'short', hour12: false, affix: '时' },
    locale: 'zh-cn',
    dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true },
    editable: true,
    eventClick: (info) => {
      activeEventData.value = info.event
      showClassDetailsDialog.value = true
    },
    eventDrop: async (info) => {
      const d = info.event.start
      const dateStr = dayjs(d).format('YYYY-MM-DD')
      const startH = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
      
      const e = info.event.end || new Date(d.getTime() + 90*60000)
      const endH = `${String(e.getHours()).padStart(2,'0')}:${String(e.getMinutes()).padStart(2,'0')}`
      
      const newClassTimeStr = `${startH}-${endH}`
      
      try {
        await updateSession(info.event.id, dateStr, newClassTimeStr)
        ElMessage.success('单次排课时间调整成功，已同步云端')
        // Optimistically update the session data
        const target = classSessions.value.find(s => s._id === info.event.id)
        if (target) {
          target.date = dateStr
          target.timeSpan = newClassTimeStr
        }
      } catch (err) {
        console.error(err)
        ElMessage.error('排课时间调整失败: ' + err.message)
        info.revert()
      }
    },
    eventContent: (arg) => {
      const html = `<div style="display:flex;flex-direction:column;padding:1px;width:100%;height:100%;overflow:hidden">
         <div style="font-size:10px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.1">${arg.timeText}</div>
         <div style="font-size:11px;font-weight:600;white-space:normal;word-break:break-all;line-height:1.1">${arg.event.title}</div>
       </div>`
      return { html }
    }
  }
})

const handleGoConsume = (event) => {
  activeEventData.value = event
  showConsumeCenterDialog.value = true
}

const handleCancelClass = async (event) => {
  if (!isAdminRole.value) {
    ElMessage.error('权限不足，仅管理员可取消排课')
    return
  }
  try {
    await ElMessageBox.confirm('删除操作不可逆，确定要取消这节课吗？', '取消排课', { type: 'warning' })
    loading.value = true
    const res = await deleteSession(event.extendedProps._id)
    if (res.success) {
      ElMessage.success('课程排期已取消')
      showClassDetailsDialog.value = false
      await loadSessions()
    }
  } catch (e) {
    if (e !== 'cancel') {
      const errStr = e instanceof Error ? e.message : (typeof e === 'object' ? JSON.stringify(e) : String(e));
      ElMessage.error('取消失败: ' + errStr)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.simple-class-schedule {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.class-row {
  display: flex;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  overflow: hidden;
}
.time-col {
  background: var(--primary-50);
  color: var(--primary-dark);
  font-weight: 600;
  font-size: 13px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  flex-shrink: 0;
  border-right: 1px solid var(--gray-200);
}
.body-col {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}
.c-title {
  font-weight: bold;
  color: var(--gray-800);
  width: 140px;
}
.c-instructor {
  font-size: 13px;
  color: var(--gray-600);
  width: 100px;
}
.c-students {
  font-size: 13px;
  color: var(--primary);
  background: var(--primary-50);
  padding: 2px 8px;
  border-radius: 999px;
  margin-left: auto;
}

/* Fix FullCalendar CSS pollution & mismatches */
:deep(.fc-button) {
  background-color: var(--gray-50) !important;
  color: var(--gray-700) !important;
  border: 1px solid var(--gray-200) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  font-weight: 600 !important;
  text-transform: capitalize !important;
  transition: 0.2s !important;
}
:deep(.fc-button:hover) {
  background-color: var(--gray-100) !important;
  color: var(--gray-900) !important;
}
:deep(.fc-button-active) {
  background-color: var(--primary) !important;
  color: white !important;
  border-color: var(--primary) !important;
}
:deep(.fc-v-event) {
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
:deep(.fc-v-event:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  z-index: 10 !important;
}

/* 强行压缩时间轴格子自然高度，以适配小高度卡片实现真·无缝自适应无滚动 */
:deep(.fc-timegrid-slot),
:deep(.fc-timegrid-slot-label),
:deep(.fc-timegrid-slot-lane) {
  height: 1.0em !important; 
}

/* 压缩左侧时间文字内边距，使其紧凑渲染 */
:deep(.fc-timegrid-axis-cushion) {
  padding: 0 4px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
}

/* 作为最后的保险，强迫内部 scroller 隐藏所有轴系滚动 */
:deep(.fc-scroller) {
  overflow: hidden !important;
}
:deep(.fc) {
  max-height: 100%;
}

</style>
