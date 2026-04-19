import { app, callAdminOperate } from '../utils/api'

export async function fetchClasses(skip = 0, limit = 100) {
  const db = app.database()
  const res = await db.collection('classes').orderBy('createdTimestamp', 'desc').skip(skip).limit(limit).get()
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
  const db = app.database()
  const _ = db.command
  const res = await db.collection('class_sessions')
    .where({
      date: _.gte(startDateStr).and(_.lte(endDateStr))
    })
    .limit(500)
    .get()
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

