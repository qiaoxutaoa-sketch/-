import { app, callAdminOperate } from '../utils/api'

export async function fetchClasses(skip = 0, limit = 100) {
  const res = await callAdminOperate('fetchClasses', { skip, limit })
  if (!res.success) throw new Error(res.msg)
  return res.data || []
}

export async function addClass(classData) {
  const res = await callAdminOperate('addClass', { classData })
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function updateClass(classId, classData) {
  const res = await callAdminOperate('updateClass', { classId, classData })
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function deleteClass(classId) {
  const res = await callAdminOperate('deleteClass', { classId })
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function fetchClassSessions(startDateStr, endDateStr) {
  const res = await callAdminOperate('fetchClassSessions', { startDateStr, endDateStr })
  if (!res.success) throw new Error(res.msg)
  return res.data || []
}

export async function updateSession(sessionId, date, timeSpan) {
  const res = await callAdminOperate('updateSession', { sessionId, date, timeSpan })
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function deleteSession(sessionId) {
  const res = await callAdminOperate('deleteSession', { sessionId })
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function copyWeekSchedule(payload) {
  // payload: { role: 'admin', mondayDateStr, nextWeekMondayTimestamp, sourceMondayStr }
  const res = await callAdminOperate('copyWeekSchedule', payload)
  if (!res.success) throw new Error(res.msg)
  return res
}

