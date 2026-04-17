// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const action = event.action;
  // Web SDK 和 小程序端传递 data 的层级可能不同，做兼容处理
  const payload = event.data || event;

  const { _callerPhone, _callerPassword } = payload;
  let callerRole = 'guest';

  const parentActions = ['getMyStudents', 'getMyTeachers', 'getMyRecords', 'bindStudent', 'login', 'submitLeave', 'updateStudentAvatar', 'activateVIP', 'checkVIP'];

  if (!parentActions.includes(action)) {
    // It's an admin/teacher action, verify credentials!
    if (!_callerPhone || !_callerPassword) {
      return { success: false, msg: '无权调用：未提供鉴权凭证' };
    }
    const teacherRes = await db.collection('teachers').where({ phone: _callerPhone, password: _callerPassword }).get()
    if (!teacherRes.data || teacherRes.data.length === 0) {
      return { success: false, msg: '操作被拒：非法的调用身份或凭证已失效' };
    }
    callerRole = teacherRes.data[0].role;
    
    // Some sensitive actions explicitly check role 'admin', we inject the *real verified* role into the payload
    // to override any untrusted `role` field sent by the client frontend.
    payload.role = callerRole;
  }

  try {
    switch (action) {
      // 🛡️ 0. 安全登录 (前端不再直查 teachers 表)
      case 'login': {
        const { phone, password } = payload;
        if (!phone || !password) return { success: false, msg: '请输入账号和密码' };
        const loginRes = await db.collection('teachers').where({ phone, password }).get();
        if (!loginRes.data || loginRes.data.length === 0) {
          return { success: false, msg: '账号或密码错误，请重试！' };
        }
        // 🛡️ 返回用户信息时剥离密码字段
        const user = { ...loginRes.data[0] };
        delete user.password;
        return { success: true, user };
      }

      // 1. 删除学员
      case 'deleteStudent': {
        const { studentId } = payload;
        if (!studentId) return { success: false, msg: '缺少学生ID' }
        await db.collection('students').doc(studentId).remove()
        return { success: true, msg: '删除成功' }
      }

      // 2. 学员续费 (BUG-6修复：使用原子递增代替前端覆写)
      case 'renewStudent': {
        const { studentId, studentName, lastRenewalDate, addHours, money } = payload
        if (!studentId) return { success: false, msg: '缺少学生ID' }
        await db.collection('students').doc(studentId).update({
          data: {
            totalHours: _.inc(addHours),
            remain: _.inc(addHours),
            lastRenewalDate: lastRenewalDate
          }
        })
        
        // 记录财务流水
        if (money > 0) {
          await db.collection('finance_records').add({
            data: {
              studentId,
              studentName: studentName || '未知学员',
              type: 'renew',
              amount: money,
              hours: addHours,
              date: lastRenewalDate,
              timestamp: Date.now()
            }
          })
        }

        return { success: true, msg: '续费成功' }
      }

      // 3. 解散班级
      case 'deleteClass': {
        const { classId } = payload
        if (!classId) return { success: false, msg: '缺少班级ID' }
        await db.collection('classes').doc(classId).remove()
        return { success: true, msg: '班级已解散' }
      }

      // 4. 批量消课 (新增功能核心)
      case 'batchConsume': {
        const { records, sendNotification, classId } = payload
        if (!records || !Array.isArray(records) || records.length === 0) return { success: false, msg: '没有需要消课的学员' }

        let successCount = 0
        let pushCount = 0
        const consumeDate = records[0]?.date || new Date().toISOString().split('T')[0]

        // 对于每一个勾选的学生，扣除课时，并增加一条消课记录
        for (let i = 0; i < records.length; i++) {
          const record = records[i]
          const hours = Number(record.consumeHours) || 1
          
          try {
            // 插入消课记录
            await db.collection('class_records').add({
              data: {
                studentId: record.studentId || '未知ID',
                studentName: record.studentName || '未知姓名',
                course: record.course || '未分配课程',
                date: record.date || new Date().toISOString().split('T')[0],
                consume: hours,
                teacher: record.teacher || '未填写',
                comment: record.comment || '', // 坚决不使用默认文本污染点评字段
                courseContent: record.courseContent || '', // 确保授课内容被独立存储
                artwork: record.artwork || '', // 接收前端统一上传的课堂风采照片
                classId: classId && classId !== 'temp' ? classId : '',
                timestamp: Date.now()
              }
            })

            // 扣减对应学生的剩余课时
            // 使用 db.command.inc 原子操作直接在云端减去课时，最安全
            await db.collection('students').doc(record.studentId).update({
              data: {
                remain: _.inc(-hours)
              }
            })
            
            // 如果开启了发送微信通知
            if (sendNotification) {
              const stuRes = await db.collection('students').doc(record.studentId).get()
              const stuData = stuRes.data
              if (stuData && stuData._openid) {
                try {
                  await cloud.openapi.subscribeMessage.send({
                    touser: stuData._openid,
                    page: 'pages/index/index',
                    lang: 'zh_CN',
                    data: {
                      thing1: { value: record.studentName },       // 假设 thing1 是姓名
                      thing2: { value: record.course },            // 假设 thing2 是课程
                      number3: { value: hours },                   // 假设 number3 是扣除课时
                      number4: { value: stuData.remain - hours }   // 假设 number4 是剩余课时
                    },
                    templateId: 'ab4rDbmy3a5LOR76YVhZVqIGkxocMbZrkrZQXj2r37U' // 需要在微信后台申请替换
                  })
                  pushCount++
                } catch (pushErr) {
                  console.error(`云推扣课通知给 ${record.studentName} 失败:`, pushErr)
                }
              }
            }

            successCount++
          } catch (itemErr) {
            console.error(`处理学员 ${record.studentName} 划扣时出错:`, itemErr)
            // 继续执行下一个，不中断整个循环
          }
        }
        
        // 更新班级/排课的消课状态
        if (classId && classId !== 'temp') {
          try {
            await db.collection('classes').doc(classId).update({
              data: { lastConsumeDate: consumeDate }
            })
          } catch(e) {}
          try {
            await db.collection('class_sessions').doc(classId).update({
              data: { status: 'consumed' }
            })
          } catch(e) {}
        }
        
        return { success: true, msg: `成功完成 ${successCount} 名学员的划扣单据。${sendNotification ? `(并尝试发出了 ${pushCount} 条微信下行通知)` : ''}` }
      }

      // 5. 更新系统配置选项 (新增)
      case 'updateSettings': {
        const { type, contentOpts, remarkOpts, role } = payload
        if (role !== 'admin') return { success: false, msg: '权限不足：仅管理员可以修改底层配置模板' }
        if (!type) return { success: false, msg: '缺少配置类型' }
        
        const existRes = await db.collection('settings').where({ type }).get()
        if (existRes.data && existRes.data.length > 0) {
          await db.collection('settings').doc(existRes.data[0]._id).update({
            data: { contentOpts, remarkOpts, timestamp: Date.now() }
          })
        } else {
          await db.collection('settings').add({
            data: { type, contentOpts, remarkOpts, timestamp: Date.now() }
          })
        }
        return { success: true, msg: '配置已更新' }
      }

      // 6. 教师权限档案管理 (二期新增)
      case 'manageTeacher': {
        const { subAction, adminPassword, teacherItem, role } = payload
        
        // 1. 角色阻断 (从云端做二度校验，防止前端篡改)
        if (role !== 'admin') return { success: false, msg: '越权操作：仅超管可管理教师档案' }
        
        // 2. 密码二次验证 (从云端 settings 集合读取超管密码)
        const sysSettings = await db.collection('settings').where({ type: 'system_auth' }).get();
        // 🛡️ 安全加固：不再提供兜底默认密码，如果未配置则直接拒绝
        if (!sysSettings.data || sysSettings.data.length === 0 || !sysSettings.data[0].adminPassword) {
          return { success: false, msg: '系统安全授权码尚未配置！请先在云数据库 settings 集合中添加 system_auth 记录并设置 adminPassword 字段。' };
        }
        const realAdminPwd = sysSettings.data[0].adminPassword;

        if (adminPassword !== realAdminPwd) return { success: false, msg: '超管操作密码验证失败！' }

        if (subAction === 'add') {
          const itemToSave = { ...teacherItem, role: 'teacher', timestamp: Date.now() }
          delete itemToSave._id // 极其关键：防止前端传来的空字符串 '' 作为真正的 ID 写入数据库
          const res = await db.collection('teachers').add({ 
            data: itemToSave 
          })
          return { success: true, msg: '教师账号签发成功', id: res.id }
        } 
        else if (subAction === 'update') {
          const id = teacherItem._id
          delete teacherItem._id
          await db.collection('teachers').doc(id).update({ data: teacherItem })
          return { success: true, msg: '教师基本档案已更新' }
        } 
        else if (subAction === 'delete') {
          if (!teacherItem._id) return { success: false, msg: '缺失记录ID' }
          await db.collection('teachers').doc(teacherItem._id).remove()
          return { success: true, msg: '教师账号已注销' }
        } 
        else if (subAction === 'resetPwd') {
          if (!teacherItem._id || !teacherItem.password) return { success: false, msg: '缺失验证信息' }
          await db.collection('teachers').doc(teacherItem._id).update({ 
            data: { password: teacherItem.password } 
          })
          return { success: true, msg: '密码重置成功' }
        }
        return { success: false, msg: '未知的子操作' }
      }

      // 7. 复制课表至指定周 (优先克隆来源周的实体课表，若来源周为空，则退化使用全局模板)
      case 'copyWeekSchedule': {
        const { role, mondayDateStr, nextWeekMondayTimestamp, sourceMondayStr } = payload
        if (role !== 'admin') return { success: false, msg: '权限不足：仅管理员可以执行复制课表操作' }
        
        let targetMondayStr = mondayDateStr
        if (!targetMondayStr && nextWeekMondayTimestamp) {
          const d = new Date(nextWeekMondayTimestamp)
          targetMondayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        }
        if (!targetMondayStr) return { success: false, msg: '缺少目标周一日期参数' }

        // 目标周的时间边界解析
        const [mY, mM, mD] = targetMondayStr.split('-').map(Number)
        const targetSundayDate = new Date(mY, mM - 1, mD + 6, 12, 0, 0)
        const targetSundayStr = `${targetSundayDate.getFullYear()}-${String(targetSundayDate.getMonth()+1).padStart(2,'0')}-${String(targetSundayDate.getDate()).padStart(2,'0')}`

        // 是否具有来源周 (新版前端会传入 sourceMondayStr)
        let sourceSessions = []
        if (sourceMondayStr) {
          const [sY, sM, sD] = sourceMondayStr.split('-').map(Number)
          const sourceSundayDate = new Date(sY, sM - 1, sD + 6, 12, 0, 0)
          const sourceSundayStr = `${sourceSundayDate.getFullYear()}-${String(sourceSundayDate.getMonth()+1).padStart(2,'0')}-${String(sourceSundayDate.getDate()).padStart(2,'0')}`

          const sourceSessionsRes = await db.collection('class_sessions').where({
            date: _.gte(sourceMondayStr).and(_.lte(sourceSundayStr))
          }).limit(500).get()
          sourceSessions = sourceSessionsRes.data || []
        }

        // 先清空目标周(新周)原来可能有的所有 sessions
        let deletedCount = 0
        const oldSessionsRes = await db.collection('class_sessions').where({
          date: _.gte(targetMondayStr).and(_.lte(targetSundayStr))
        }).limit(500).get()
        for (const old of (oldSessionsRes.data || [])) {
          await db.collection('class_sessions').doc(old._id).remove()
          deletedCount++
        }

        let generatedCount = 0

        // 根据来源数据生成目标周
        if (sourceSessions.length > 0) {
          // 策略 A：来源周有物理排课，严格克隆实况！将日期间隔延后7天
          for (let ses of sourceSessions) {
            const [sesY, sesM, sesD] = ses.date.split('-').map(Number)
            const clonedDateObj = new Date(sesY, sesM - 1, sesD + 7, 12, 0, 0)
            const clonedDateStr = `${clonedDateObj.getFullYear()}-${String(clonedDateObj.getMonth()+1).padStart(2,'0')}-${String(clonedDateObj.getDate()).padStart(2,'0')}`
            
            try {
              await db.collection('class_sessions').add({
                data: {
                  classId: ses.classId,
                  className: ses.className,
                  date: clonedDateStr,
                  timeSpan: ses.timeSpan,
                  studentIds: ses.studentIds || [],
                  teacherId: ses.teacherId || '',
                  status: 'pending',
                  timestamp: Date.now()
                }
              })
              generatedCount++
            } catch(e) {}
          }
        } else {
          // 策略 B：来源周是绝对空荡荡的，回退到降级逻辑，读取全局 class 模板
          const classesRes = await db.collection('classes').get()
          const classes = classesRes.data || []
          const dayMap = { '周一': 0, '周二': 1, '周三': 2, '周四': 3, '周五': 4, '周六': 5, '周日': 6 }

          for (let cls of classes) {
            if (!cls.scheduleDay || !cls.scheduleTime) continue
            const offsetDays = dayMap[cls.scheduleDay]
            if (offsetDays === undefined) continue

            const sessionDateObj = new Date(mY, mM - 1, mD + offsetDays, 12, 0, 0)
            const dateStr = `${sessionDateObj.getFullYear()}-${String(sessionDateObj.getMonth() + 1).padStart(2, '0')}-${String(sessionDateObj.getDate()).padStart(2, '0')}`

            try {
              await db.collection('class_sessions').add({
                data: {
                  classId: cls._id,
                  className: cls.name,
                  date: dateStr,
                  timeSpan: cls.scheduleTime,
                  studentIds: cls.studentIds || [],
                  teacherId: '',
                  status: 'pending',
                  timestamp: Date.now()
                }
              })
              generatedCount++
            } catch(e) {}
          }
        }

        return { success: true, msg: `已成功${sourceSessions.length > 0 ? '克隆来源周实况排课' : '由全局班级模板派发'}至下周，新落成 ${generatedCount} 节实体课${deletedCount > 0 ? '（覆盖去除了 ' + deletedCount + ' 节废弃排班）' : ''}` }
      }

      // 7.5 更新单节实体课的日期/时间（日历拖拽）
      case 'updateSession': {
        const { sessionId, date: sesDate, timeSpan } = payload;
        if (!sessionId) return { success: false, msg: '缺少课程ID' };
        const sesUpdate = {};
        if (sesDate) sesUpdate.date = sesDate;
        if (timeSpan) sesUpdate.timeSpan = timeSpan;
        await db.collection('class_sessions').doc(sessionId).update({ data: sesUpdate });
        return { success: true, msg: '课程时间已更新' };
      }

      // 处理模板日历取消排课
      case 'cancelTemplateBlock': {
        const { classId, className, date, timeSpan } = payload;
        if (!classId || !date) return { success: false, msg: '缺少关键参数' };
        await db.collection('class_sessions').add({
          data: {
            classId,
            className,
            date,
            timeSpan: timeSpan || '00:00-00:00',
            status: 'cancelled',
            timestamp: Date.now()
          }
        });
        return { success: true, msg: '课节已取消' };
      }

      // 7.6 删除单节实体课
      case 'deleteSession': {
        const { sessionId } = payload;
        if (!sessionId) return { success: false, msg: '缺少课程ID' };
        await db.collection('class_sessions').doc(sessionId).remove();
        return { success: true, msg: '课程已取消' };
      }

      // 7.7 添加单节临时课/加课 (点击日历空白格)
      case 'addSession': {
        const { classId, className, date, timeSpan } = payload;
        if (!classId || !date || !timeSpan) return { success: false, msg: '缺少排课关键参数' };
        await db.collection('class_sessions').add({
          data: {
            classId,
            className,
            date,
            timeSpan,
            status: 'pending',
            timestamp: Date.now()
          }
        });
        return { success: true, msg: '单次课节已添加' };
      }

      // 8. 处理家长端报名申请 (Approve/Reject)
      case 'manageApplication': {
        const { applicationId, status, studentId, operator } = payload
        if (!applicationId || !status) return { success: false, msg: '缺少必要参数' }
        
        const updateData = { status }
        if (status === 'approved') {
          updateData.studentId = studentId
          updateData.operator = operator
          updateData.processTime = Date.now()
        }

        await db.collection('applications').doc(applicationId).update({
          data: updateData
        })
        return { success: true, msg: '申请状态更新成功' }
      }

      // 8.5 添加新学员及财务流水
      case 'addStudent': {
        const { studentData, moneyNum } = payload
        
        // 1. 写入学生表
        const res = await db.collection('students').add({
          data: studentData
        });

        // 2. 如果实收金额大于0，写入财务表
        if (moneyNum > 0) {
          await db.collection('finance_records').add({
            data: {
              studentId: res._id,
              studentName: studentData.name,
              type: 'enroll',
              amount: moneyNum,
              hours: studentData.totalHours,
              date: studentData.enrollDate,
              timestamp: Date.now()
            }
          })
        }

        return { success: true, msg: '添加学员成功', id: res._id }
      }

      // 10. Epic 7: 家长获取名下绑定的所有学生档案
      case 'getMyStudents': {
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID

        if (!openid) return { success: false, msg: '无法获取微信授权信息' }

        const res = await db.collection('students').where({
          _openid: openid
        }).get()
        
        return { success: true, data: res.data }
      }

      // 10.5 Epic 10: 家长获取专属负责老师们的联系方式
      case 'getMyTeachers': {
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID
        console.log('[getMyTeachers] called with openid:', openid)

        if (!openid) return { success: false, msg: '未授权' }

        // 1. 获取该家长名下的所有学员
        const stuRes = await db.collection('students').where({ _openid: openid }).get()
        const stuIds = stuRes.data.map(s => s._id)
        console.log('[getMyTeachers] Found students for openid:', stuIds)
        if (stuIds.length === 0) return { success: true, data: [] }

        // 2. 查找所有的班级并在代码中做数组求交集过滤，避免云开发使用 _.in 处理双数组的局限性
        const classRes = await db.collection('classes').get()
        const myClasses = classRes.data.filter(cls => {
          if (!cls.studentIds || !Array.isArray(cls.studentIds)) return false;
          // 只要该班级里包含家长名下的任何一个孩子，该负责老师就属于该家长
          return cls.studentIds.some(id => stuIds.includes(id));
        });
        
        console.log('[getMyTeachers] Filtered matched classes:', myClasses)

        // 3. 提取老师的去重联系方式
        const teachers = [];
        const seenPhones = new Set();
        myClasses.forEach(cls => {
           if (cls.teacherName && cls.teacherPhone && !seenPhones.has(cls.teacherPhone)) {
              teachers.push({ name: cls.teacherName, phone: cls.teacherPhone, className: cls.name });
              seenPhones.add(cls.teacherPhone);
           }
        });

        console.log('[getMyTeachers] Final teachers list:', teachers)
        return { success: true, data: teachers }
      }

      // 11. Epic 7: 家长获取某位学生的历史消课/点评记录
      case 'getMyRecords': {
        const { studentId, limit = 20 } = payload
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID
        
        if (!studentId || !openid) return { success: false, msg: '缺少参数或授权信息' }

        // 做一层鉴权：为了防止抓包脱库，验证请求的这个 studentId 是不是真的属于这个 openid
        const stuRes = await db.collection('students').doc(studentId).get()
        if (!stuRes.data || stuRes.data._openid !== openid) {
          return { success: false, msg: '越权访问：该学员未绑定至您的微信' }
        }

        const res = await db.collection('class_records')
          .where({ studentId })
          .orderBy('timestamp', 'desc')
          .limit(limit)
          .get()

        const records = res.data

        // 核心重构 13-2: Storage Protocol Normalization
        // 把所有的 cloud:// 协议直接在上帝视角(云函数后台)转换为临时 https 链接，彻底绕过小程序端可能出现的任何图片白名单/渲染兼容问题。
        try {
          const fileIDsToConvert = records
            .filter(r => r.artwork && r.artwork.startsWith('cloud://'))
            .map(r => r.artwork)
            
          if (fileIDsToConvert.length > 0) {
            const urlRes = await cloud.getTempFileURL({ fileList: fileIDsToConvert })
            
            // 将拿到的真实 HTTPS 链接回填给对应的 record
            const urlMap = {}
            urlRes.fileList.forEach(f => {
              if (f.tempFileURL) {
                urlMap[f.fileID] = f.tempFileURL
              }
            })
            
            records.forEach(r => {
              if (r.artwork && urlMap[r.artwork]) {
                r.artwork = urlMap[r.artwork]
              }
            })
          }
        } catch (convertErr) {
          console.error('[getMyRecords] 转换图片链接失败:', convertErr)
          // 哪怕报错了，也把原始数据丢回给小程序（小程序端底层其实也是支持直接渲染 cloud:// 的，这只是一层兜底保障）
        }

        return { success: true, data: records }
      }

      // 12. Epic 8: 老生账号找回与微信一对一绑定
      case 'bindStudent': {
        const { studentName, phone } = payload
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID

        if (!studentName || !phone || !openid) return { success: false, msg: '缺少校验参数' }

        // 查找是否匹配
        const res = await db.collection('students').where({
          name: studentName,
          phone: phone
        }).get()

        if (!res.data || res.data.length === 0) {
          return { success: false, msg: '未找到匹配的学员档案，请检查姓名与当时预留的手机号' }
        }

        const targetStudent = res.data[0]

        // 如果该学员已经被绑定过了（且绑定的不是当前微信号）
        if (targetStudent._openid && targetStudent._openid !== openid) {
          return { success: false, msg: '该学员已被其他微信号绑定，如需解绑请联系机构老师' }
        }

        // 把当前家长的 openid 写进去
        await db.collection('students').doc(targetStudent._id).update({
          data: {
            _openid: openid
          }
        })

        return { success: true, msg: '认领绑定成功！' }
      }

      // 🛡️ 13. 教师端点评内容写回 (前端不再直写 class_records)
      case 'updateReview': {
        const { recordId, comment, artwork } = payload;
        if (!recordId) return { success: false, msg: '缺少消课记录ID' };
        const updateData = { reviewTimestamp: Date.now() };
        if (comment !== undefined) updateData.comment = comment;
        if (artwork !== undefined) updateData.artwork = artwork;
        await db.collection('class_records').doc(recordId).update({ data: updateData });
        return { success: true, msg: '点评已保存' };
      }

      // 13.5 家长端及教师端自主重置学员个人头像
      case 'updateStudentAvatar': {
        const { studentId, avatarUrl } = payload;
        const wxContext = cloud.getWXContext();
        const openid = wxContext.OPENID;

        if (!studentId || !avatarUrl || !openid) return { success: false, msg: '缺少参数或授权信息缺失' };

        // 鉴权：只有绑定了该家长的学生，才能被该家长修改头像
        const stuRes = await db.collection('students').doc(studentId).get();
        if (!stuRes.data || stuRes.data._openid !== openid) {
          return { success: false, msg: '越权操作：只能修改自己关联绑定的学员头像' };
        }

        await db.collection('students').doc(studentId).update({
          data: { avatar: avatarUrl }
        });

        return { success: true, msg: '更换成功' };
      }

      // 13.6 教师端自主重置个人头像 (教师专属机制)
      case 'updateTeacherAvatar': {
        const { teacherId, avatarUrl, _callerPhone, _callerPassword } = payload;
        if (!teacherId || !avatarUrl) return { success: false, msg: '缺少参数' };
        
        // 鉴权把关：确保当前操作的教师 _id 确实匹配于其上传的登录凭证
        const tRes = await db.collection('teachers').where({ phone: _callerPhone, password: _callerPassword }).get();
        if(!tRes.data || tRes.data.length === 0 || tRes.data[0]._id !== teacherId) {
          return { success: false, msg: '越权操作：只能修改属于自己账号的头像' };
        }

        // 修改云数据库
        await db.collection('teachers').doc(teacherId).update({
          data: { avatar: avatarUrl }
        });

        return { success: true, msg: '教师头像更换成功' };
      }

      // 🛡️ 14. 编辑学员档案 (BUG-3修复：前端不再直写 students)
      case 'updateStudent': {
        const { studentId, updateData } = payload;
        if (!studentId) return { success: false, msg: '缺少学生ID' };
        // 安全过滤：只允许更新这些字段
        const allowed = ['name', 'gender', 'age', 'phone', 'address', 'course'];
        const safeData = {};
        allowed.forEach(k => { if (updateData[k] !== undefined) safeData[k] = updateData[k]; });
        await db.collection('students').doc(studentId).update({ data: safeData });
        return { success: true, msg: '学员档案更新成功' };
      }

      // 🛡️ 15. 创建/编辑班级 (BUG-3修复：前端不再直写 classes)
      case 'manageClass': {
        const { subAction: clsSubAction, classId, classData } = payload;
        if (clsSubAction === 'add') {
          classData.createdTimestamp = Date.now();
          const res = await db.collection('classes').add({ data: classData });
          return { success: true, msg: '新班级创建成功', id: res._id };
        } else if (clsSubAction === 'update') {
          if (!classId) return { success: false, msg: '缺少班级ID' };
          await db.collection('classes').doc(classId).update({ data: classData });
          return { success: true, msg: '班级信息已更新' };
        }
        return { success: false, msg: '未知的班级操作' };
      }

      // 🛡️ 16. 更新排课时间 (BUG-3修复：日历拖拽不再直写)
      case 'updateClassSchedule': {
        const { classId: schedClassId, scheduleDay, scheduleTime } = payload;
        if (!schedClassId) return { success: false, msg: '缺少班级ID' };
        await db.collection('classes').doc(schedClassId).update({
          data: { scheduleDay, scheduleTime }
        });
        return { success: true, msg: '排课时间已更新' };
      }

      // 🛡️ 17. 家长提交请假 (BUG-4修复：走云函数而非直写)
      case 'submitLeave': {
        const wxContext = cloud.getWXContext();
        const openid = wxContext.OPENID;
        if (!openid) return { success: false, msg: '未授权' };
        const { studentId: leaveStudentId, studentName: leaveStuName, date: leaveDate, reason } = payload;
        if (!leaveStudentId || !leaveDate || !reason) return { success: false, msg: '缺少必要参数' };
        // 验证该学员属于该家长
        const stuCheck = await db.collection('students').doc(leaveStudentId).get();
        if (!stuCheck.data || stuCheck.data._openid !== openid) {
          return { success: false, msg: '无权为该学员请假' };
        }
        await db.collection('leaves').add({
          data: {
            studentId: leaveStudentId,
            studentName: leaveStuName,
            date: leaveDate,
            reason: reason,
            _openid: openid,
            status: 'pending',
            timestamp: Date.now()
          }
        });
        return { success: true, msg: '请假成功' };
      }

      // 18. 处理请假审批 (绕过前端安全规则直写静默失败Bug)
      case 'manageLeave': {
        const { leaveId, status } = payload;
        if (!leaveId || !status) return { success: false, msg: '缺少必要参数' };
        await db.collection('leaves').doc(leaveId).update({
          data: { status }
        });
        return { success: true, msg: '请假状态已更新' };
      }

      // 19. UGC 文本合规安全检测 (防注入审查必接，返回 true 代表安全，false 代表拒审)
      case 'msgSecCheck': {
        const { content } = payload;
        if (!content) return { success: true, msg: 'empty_pass' }; // 控制空验证
        try {
          // 调用微信底层安全检测引擎 (V1通用版)
          const checkRes = await cloud.openapi.security.msgSecCheck({
            content: content
          });
          if (checkRes.errCode === 0) {
            return { success: true, msg: 'ok' };
          }
          return { success: false, msg: '涉嫌违反安全公约' };
        } catch (err) {
          // errCode: 87014 即为命中违规文本
          console.warn('【安全拦截】', err);
          return { success: false, msg: '包含敏感、违法或不当词汇，已被平台系统拦截。' };
        }
      }

      // 20. 生成家长端入口暗门二维码 (B端无限制码)
      case 'generateVipQrCode': {
        const { role } = payload;
        if (role !== 'admin') return { success: false, msg: '权限不足：仅超管可以提取专属入场二维码' };
        
        try {
          const result = await cloud.openapi.wxacode.getUnlimited({
            scene: 'unlock',
            page: 'pages/index/index',
            width: 430,
            check_path: false // 【关键修复】：关闭路径校验。由于您的小程序这版还没发布，不关它微信底层会报错说找不到页面
          });
          
          // 直接将二进制的图片缓存转为 base64 发给前端网页，无需向云存储存盘
          const base64Str = result.buffer.toString('base64');
          return { success: true, imgDataUrl: `data:image/jpeg;base64,${base64Str}` };
        } catch (err) {
          console.error('【生成暗门二维码失败】', err);
          return { success: false, msg: `微信服务拒绝了生码请求，原因为: ${err.message || err.errMsg || JSON.stringify(err)}。可能是因为您的小程序从未发布过任何正式版本。请至少发布一版后再来生成。` };
        }
      }

      // 21. 家长扫码激活 VIP（云端持久化）
      case 'activateVIP': {
        const wxContext = cloud.getWXContext();
        const openid = wxContext.OPENID;
        if (!openid) return { success: false, msg: '无法获取授权信息' };

        // 幂等写入：如果已存在则跳过
        const existVip = await db.collection('vip_users').where({ _openid: openid }).get();
        if (existVip.data && existVip.data.length > 0) {
          return { success: true, msg: '已激活', alreadyActive: true };
        }

        await db.collection('vip_users').add({
          data: {
            _openid: openid,
            activated: true,
            activatedAt: Date.now()
          }
        });
        return { success: true, msg: 'VIP 激活成功' };
      }

      // 22. 启动时校验 VIP 状态（云端权威源）
      case 'checkVIP': {
        const wxContext = cloud.getWXContext();
        const openid = wxContext.OPENID;
        if (!openid) return { success: false, isVIP: false };

        try {
          const vipRes = await db.collection('vip_users').where({
            _openid: openid,
            activated: true
          }).get();

          return { success: true, isVIP: vipRes.data && vipRes.data.length > 0 };
        } catch (e) {
          // If vip_users collection doesn't exist, it throws. Gracefully handle it instead of crashing.
          return { success: true, isVIP: false };
        }
      }

      // 23. 管理员撤销 VIP（退费踢人）
      case 'revokeVIP': {
        const { targetOpenid, role } = payload;
        if (role !== 'admin') return { success: false, msg: '权限不足：仅管理员可撤销 VIP' };
        if (!targetOpenid) return { success: false, msg: '缺少目标用户 OpenID' };

        const vipRecord = await db.collection('vip_users').where({ _openid: targetOpenid }).get();
        if (!vipRecord.data || vipRecord.data.length === 0) {
          // 旧版用户没有云端记录，直接创建一条"已禁用"记录来阻断云端校验
          await db.collection('vip_users').add({
            data: {
              _openid: targetOpenid,
              activated: false,
              revokedAt: Date.now()
            }
          });
          return { success: true, msg: 'VIP 已撤销（旧版用户），该用户下次打开将回到基础模式' };
        }

        await db.collection('vip_users').doc(vipRecord.data[0]._id).update({
          data: { activated: false, revokedAt: Date.now() }
        });
        return { success: true, msg: 'VIP 已撤销，该用户下次打开将回到基础模式' };
      }

      default:
        return { success: false, msg: '未知的操作类型 (action)' }
    }
  } catch (err) {
    console.error('云函数执行报错:', err)
    // 🛡️ 安全加固：不再向前端泄漏完整的错误对象
    return { success: false, msg: '服务器内部错误，请联系管理员' }
  }
}
