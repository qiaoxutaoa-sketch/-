import { app, callAdminOperate } from '../utils/api'
import { ElMessageBox } from 'element-plus'

const getAdminPwd = async () => {
  let pwd = localStorage.getItem('adminPassword_cache')
  if (!pwd) {
    const { value } = await ElMessageBox.prompt('该操作属于系统核心高危权限，请输入超管二次密码（非登录密码）以解锁操作', '安全验证', {
      inputType: 'password',
      confirmButtonText: '验证',
      cancelButtonText: '取消'
    })
    pwd = value
    localStorage.setItem('adminPassword_cache', pwd)
  }
  return pwd
}

export async function fetchTeachers(skip = 0, limit = 50) {
  const db = app.database()
  const res = await db.collection('teachers').orderBy('_id', 'desc').skip(skip).limit(limit).get()
  return res.data || []
}

export async function addTeacher(teacherItem) {
  const pwd = await getAdminPwd()
  const res = await callAdminOperate('manageTeacher', { 
    subAction: 'add',
    adminPassword: pwd,
    teacherItem,
    role: 'admin' 
  })
  if (!res.success) {
    if (res.msg.includes('密码')) localStorage.removeItem('adminPassword_cache')
    throw new Error(res.msg)
  }
  return res
}

export async function deleteTeacher(teacherItem) {
  const pwd = await getAdminPwd()
  const res = await callAdminOperate('manageTeacher', {
    subAction: 'delete',
    adminPassword: pwd,
    teacherItem,
    role: 'admin'
  })
  if (!res.success) {
    if (res.msg.includes('密码')) localStorage.removeItem('adminPassword_cache')
    throw new Error(res.msg)
  }
  return res
}

export async function updateTeacher(teacherItem) {
  const pwd = await getAdminPwd()
  const res = await callAdminOperate('manageTeacher', {
    subAction: 'update',
    adminPassword: pwd,
    teacherItem,
    role: 'admin'
  })
  if (!res.success) {
    if (res.msg.includes('密码')) localStorage.removeItem('adminPassword_cache')
    throw new Error(res.msg)
  }
  return res
}

export async function resetTeacherPassword(teacherItem, manualPwd) {
  const pwd = manualPwd || await getAdminPwd()
  const res = await callAdminOperate('manageTeacher', {
    subAction: 'resetPwd',
    adminPassword: pwd,
    teacherItem,
    role: 'admin'
  })
  if (!res.success) {
    if (res.msg.includes('密码')) localStorage.removeItem('adminPassword_cache')
    throw new Error(res.msg)
  }
  return res
}

