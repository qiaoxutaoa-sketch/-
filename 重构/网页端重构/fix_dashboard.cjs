const fs = require('fs');
let code = fs.readFileSync('src/views/DashboardView.vue', 'utf8');

// I need to find the block containing handleCheckIn and replace it carefully.
// Right now the file is mangled around there.

// Let's just find the start of // === Actions === all the way to // === FullCalendar Config ===
const startMarker = "// === Actions ===";
const endMarker = "// === FullCalendar Config ===";

const newBlock = `// === Actions ===
const handleInvite = () => {
  ElMessage.success('入场码生成链接已复制（模拟）')
}

const handleCheckIn = (cls) => {
  // Use the new active event data flow, format it so Consume dialog accepts it
  activeEventData.value = {
    start: \`\${cls.date}T00:00:00\`,
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

`;

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
  code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
  fs.writeFileSync('src/views/DashboardView.vue', code);
  console.log("Successfully repaired Actions block!");
} else {
  console.log("Could not find markers correctly.");
  console.log("Start:", startIndex, "End:", endIndex);
}
