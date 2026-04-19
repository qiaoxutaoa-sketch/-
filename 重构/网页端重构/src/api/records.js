import { app, callAdminOperate } from '../utils/api'

export async function fetchRecords(skip = 0, limit = 100) {
  const db = app.database()
  const res = await db.collection('class_records').orderBy('timestamp', 'desc').skip(skip).limit(limit).get()
  return res.data || []
}

export async function batchConsume(records, sendNotification = true, classId = 'temp') {
  const res = await callAdminOperate('batchConsume', {
    records,
    sendNotification,
    classId
  })
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function updateReview(recordId, comment, artwork) {
  const res = await callAdminOperate('updateReview', {
    recordId,
    comment,
    artwork
  })
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function revertConsume(recordId) {
  const res = await callAdminOperate('revertConsume', { recordId })
  if (!res.success) throw new Error(res.msg)
  return res
}

