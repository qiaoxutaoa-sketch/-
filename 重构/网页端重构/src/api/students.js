import { app, callAdminOperate } from '../utils/api'

export async function fetchStudents(skip = 0, limit = 50) {
  const db = app.database()
  const res = await db.collection('students').orderBy('enrollDate', 'desc').skip(skip).limit(limit).get()
  return res.data || []
}

export async function addStudent(studentData, moneyNum) {
  const res = await callAdminOperate('addStudent', { studentData, moneyNum })
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function renewStudent(payload) {
  const res = await callAdminOperate('renewStudent', payload)
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function updateStudent(studentId, studentData) {
  const res = await callAdminOperate('updateStudent', { studentId, studentData })
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function deleteStudent(studentId) {
  const res = await callAdminOperate('deleteStudent', { studentId })
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function fetchApplications() {
  const db = app.database()
  const res = await db.collection('applications').where({ status: 'pending' }).orderBy('timestamp', 'desc').get()
  return res.data || []
}

export async function manageApplication(applicationId, status, studentId = '') {
  const res = await callAdminOperate('manageApplication', { applicationId, status, studentId, operator: localStorage.getItem('_callerPhone') || '超管' })
  if (!res.success) throw new Error(res.msg)
  return res
}

