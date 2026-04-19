import { app, callAdminOperate } from '../utils/api'

const DEFAULT_COURSES = ['创意美术', '系统国画', '软笔书法', '硬笔书法', '素描色彩']

export async function fetchCourseCategories() {
  try {
    const db = app.database()
    const res = await db.collection('settings').where({ type: 'course_opts' }).get()
    if (res.data && res.data.length > 0 && res.data[0].courses) {
      return res.data[0].courses
    }
  } catch(e) {
    console.warn('Failed to fetch course rules from settings', e)
  }
  return [...DEFAULT_COURSES]
}

export async function addCourseCategory(courseName) {
  const list = await fetchCourseCategories()
  if (list.includes(courseName)) {
    throw new Error('该分类已存在')
  }
  list.push(courseName)
  const res = await callAdminOperate('manageCourseCategories', { courseOpts: list })
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function deleteCourseCategory(courseName) {
  const list = await fetchCourseCategories()
  const newList = list.filter(c => c !== courseName)
  const res = await callAdminOperate('manageCourseCategories', { courseOpts: newList })
  if (!res.success) throw new Error(res.msg)
  return res
}
