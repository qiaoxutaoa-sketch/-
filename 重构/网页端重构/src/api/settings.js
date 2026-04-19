import { app, callAdminOperate } from '../utils/api'

export async function fetchRemarkOptions() {
  try {
    const res = await callAdminOperate('fetchRemarkOptions')
    if (res.success && res.data) {
      return res.data
    }
  } catch(e) {
    console.warn('Failed to fetch remark options from settings', e)
  }
  return ['日常课程', '比赛指导', '考级集训', '体验课', '寒暑假集训']
}

export async function addRemarkOption(remarkName) {
  const list = await fetchRemarkOptions()
  if (list.includes(remarkName)) {
    throw new Error('该选项已存在')
  }
  list.push(remarkName)
  const res = await callAdminOperate('updateSettings', {
    type: 'consume_opts',
    remarkOpts: list,
    role: 'admin'
  })
  if (!res.success) throw new Error(res.msg)
  return res
}

export async function deleteRemarkOption(remarkName) {
  const list = await fetchRemarkOptions()
  const newList = list.filter(c => c !== remarkName)
  const res = await callAdminOperate('updateSettings', {
    type: 'consume_opts',
    remarkOpts: newList,
    role: 'admin'
  })
  if (!res.success) throw new Error(res.msg)
  return res
}
