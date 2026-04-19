// 浜戝嚱鏁板叆鍙ｆ枃浠?const cloud = require('wx-server-sdk')

// 鍒濆鍖栦簯鐜
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 浜戝嚱鏁板叆鍙ｅ嚱鏁?exports.main = async (event, context) => {
  const action = event.action;
  // Web SDK 鍜?灏忕▼搴忕浼犻€?data 鐨勫眰绾у彲鑳戒笉鍚岋紝鍋氬吋瀹瑰鐞?  const payload = event.data || event;

  const { _callerPhone, _callerPassword } = payload;
  let callerRole = 'guest';

  const parentActions = ['getMyStudents', 'getMyTeachers', 'getMyRecords', 'bindStudent', 'login', 'submitLeave', 'updateStudentAvatar', 'activateVIP', 'checkVIP'];

  if (!parentActions.includes(action)) {
    // It's an admin/teacher action, verify credentials!
    if (!_callerPhone || !_callerPassword) {
      return { success: false, msg: '鏃犳潈璋冪敤锛氭湭鎻愪緵閴存潈鍑瘉' };
    }
    const teacherRes = await db.collection('teachers').where({ phone: _callerPhone, password: _callerPassword }).get()
    if (!teacherRes.data || teacherRes.data.length === 0) {
      return { success: false, msg: '鎿嶄綔琚嫆锛氶潪娉曠殑璋冪敤韬唤鎴栧嚟璇佸凡澶辨晥' };
    }
    callerRole = teacherRes.data[0].role;
    
    // Some sensitive actions explicitly check role 'admin', we inject the *real verified* role into the payload
    // to override any untrusted `role` field sent by the client frontend.
    payload.role = callerRole;
  }

  try {
    switch (action) {
      // 馃洝锔?0. 瀹夊叏鐧诲綍 (鍓嶇涓嶅啀鐩存煡 teachers 琛?
      case 'login': {
        const { phone, password } = payload;
        if (!phone || !password) return { success: false, msg: '璇疯緭鍏ヨ处鍙峰拰瀵嗙爜' };
        const loginRes = await db.collection('teachers').where({ phone, password }).get();
        if (!loginRes.data || loginRes.data.length === 0) {
          return { success: false, msg: '璐﹀彿鎴栧瘑鐮侀敊璇紝璇烽噸璇曪紒' };
        }
        // 馃洝锔?杩斿洖鐢ㄦ埛淇℃伅鏃跺墺绂诲瘑鐮佸瓧娈?        const user = { ...loginRes.data[0] };
        delete user.password;
        return { success: true, user };
      }

      // 1. 鍒犻櫎瀛﹀憳
      case 'deleteStudent': {
        const { studentId } = payload;
        if (!studentId) return { success: false, msg: '缂哄皯瀛︾敓ID' }
        await db.collection('students').doc(studentId).remove()
        return { success: true, msg: '鍒犻櫎鎴愬姛' }
      }

      // 2. 瀛﹀憳缁垂 (BUG-6淇锛氫娇鐢ㄥ師瀛愰€掑浠ｆ浛鍓嶇瑕嗗啓)
      case 'renewStudent': {
        const { studentId, studentName, lastRenewalDate, addHours, money } = payload
        if (!studentId) return { success: false, msg: '缂哄皯瀛︾敓ID' }
        await db.collection('students').doc(studentId).update({
          data: {
            totalHours: _.inc(addHours),
            remain: _.inc(addHours),
            lastRenewalDate: lastRenewalDate
          }
        })
        
        // 璁板綍璐㈠姟娴佹按
        if (money > 0) {
          await db.collection('finance_records').add({
            data: {
              studentId,
              studentName: studentName || '鏈煡瀛﹀憳',
              type: 'renew',
              amount: money,
              hours: addHours,
              date: lastRenewalDate,
              timestamp: Date.now()
            }
          })
        }

        return { success: true, msg: '缁垂鎴愬姛' }
      }

      // 3. 瑙ｆ暎鐝骇
      case 'deleteClass': {
        const { classId } = payload
        if (!classId) return { success: false, msg: '缂哄皯鐝骇ID' }
        await db.collection('classes').doc(classId).remove()
        return { success: true, msg: '鐝骇宸茶В鏁? }
      }

      // 4. 鎵归噺娑堣 (鏂板鍔熻兘鏍稿績)
      case 'batchConsume': {
        const { records, sendNotification, classId } = payload
        if (!records || !Array.isArray(records) || records.length === 0) return { success: false, msg: '娌℃湁闇€瑕佹秷璇剧殑瀛﹀憳' }

        let successCount = 0
        let pushCount = 0
        const consumeDate = records[0]?.date || new Date().toISOString().split('T')[0]

        // 瀵逛簬姣忎竴涓嬀閫夌殑瀛︾敓锛屾墸闄よ鏃讹紝骞跺鍔犱竴鏉℃秷璇捐褰?        for (let i = 0; i < records.length; i++) {
          const record = records[i]
          const hours = Number(record.consumeHours) || 1
          
          try {
            // 鎻掑叆娑堣璁板綍
            await db.collection('class_records').add({
              data: {
                studentId: record.studentId || '鏈煡ID',
                studentName: record.studentName || '鏈煡濮撳悕',
                course: record.course || '鏈垎閰嶈绋?,
                date: record.date || new Date().toISOString().split('T')[0],
                consume: hours,
                teacher: record.teacher || '鏈～鍐?,
                comment: record.comment || '', // 鍧氬喅涓嶄娇鐢ㄩ粯璁ゆ枃鏈薄鏌撶偣璇勫瓧娈?                courseContent: record.courseContent || '', // 纭繚鎺堣鍐呭琚嫭绔嬪瓨鍌?                artwork: record.artwork || '', // 鎺ユ敹鍓嶇缁熶竴涓婁紶鐨勮鍫傞閲囩収鐗?                classId: classId && classId !== 'temp' ? classId : '',
                timestamp: Date.now()
              }
            })

            // 鎵ｅ噺瀵瑰簲瀛︾敓鐨勫墿浣欒鏃?            // 浣跨敤 db.command.inc 鍘熷瓙鎿嶄綔鐩存帴鍦ㄤ簯绔噺鍘昏鏃讹紝鏈€瀹夊叏
            await db.collection('students').doc(record.studentId).update({
              data: {
                remain: _.inc(-hours)
              }
            })
            
            // 濡傛灉寮€鍚簡鍙戦€佸井淇￠€氱煡
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
                      thing1: { value: record.studentName },       // 鍋囪 thing1 鏄鍚?                      thing2: { value: record.course },            // 鍋囪 thing2 鏄绋?                      number3: { value: hours },                   // 鍋囪 number3 鏄墸闄よ鏃?                      number4: { value: stuData.remain - hours }   // 鍋囪 number4 鏄墿浣欒鏃?                    },
                    templateId: 'ab4rDbmy3a5LOR76YVhZVqIGkxocMbZrkrZQXj2r37U' // 闇€瑕佸湪寰俊鍚庡彴鐢宠鏇挎崲
                  })
                  pushCount++
                } catch (pushErr) {
                  console.error(`浜戞帹鎵ｈ閫氱煡缁?${record.studentName} 澶辫触:`, pushErr)
                }
              }
            }

            successCount++
          } catch (itemErr) {
            console.error(`澶勭悊瀛﹀憳 ${record.studentName} 鍒掓墸鏃跺嚭閿?`, itemErr)
            // 缁х画鎵ц涓嬩竴涓紝涓嶄腑鏂暣涓惊鐜?          }
        }
        
        // 鏇存柊鐝骇/鎺掕鐨勬秷璇剧姸鎬?        if (classId && classId !== 'temp') {
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
        
        return { success: true, msg: `鎴愬姛瀹屾垚 ${successCount} 鍚嶅鍛樼殑鍒掓墸鍗曟嵁銆?{sendNotification ? `(骞跺皾璇曞彂鍑轰簡 ${pushCount} 鏉″井淇′笅琛岄€氱煡)` : ''}` }
      }

      // 5. 鏇存柊绯荤粺閰嶇疆閫夐」 (鏂板)
      case 'updateSettings': {
        const { type, contentOpts, remarkOpts, role } = payload
        if (role !== 'admin') return { success: false, msg: '鏉冮檺涓嶈冻锛氫粎绠＄悊鍛樺彲浠ヤ慨鏀瑰簳灞傞厤缃ā鏉? }
        if (!type) return { success: false, msg: '缂哄皯閰嶇疆绫诲瀷' }
        
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
        return { success: true, msg: '閰嶇疆宸叉洿鏂? }
      }

      // 6. 鏁欏笀鏉冮檺妗ｆ绠＄悊 (浜屾湡鏂板)
      case 'manageTeacher': {
        const { subAction, adminPassword, teacherItem, role } = payload
        
        // 1. 瑙掕壊闃绘柇 (浠庝簯绔仛浜屽害鏍￠獙锛岄槻姝㈠墠绔鏀?
        if (role !== 'admin') return { success: false, msg: '瓒婃潈鎿嶄綔锛氫粎瓒呯鍙鐞嗘暀甯堟。妗? }
        
        // 2. 瀵嗙爜浜屾楠岃瘉 (浠庝簯绔?settings 闆嗗悎璇诲彇瓒呯瀵嗙爜)
        const sysSettings = await db.collection('settings').where({ type: 'system_auth' }).get();
        // 馃洝锔?瀹夊叏鍔犲浐锛氫笉鍐嶆彁渚涘厹搴曢粯璁ゅ瘑鐮侊紝濡傛灉鏈厤缃垯鐩存帴鎷掔粷
        if (!sysSettings.data || sysSettings.data.length === 0 || !sysSettings.data[0].adminPassword) {
          return { success: false, msg: '绯荤粺瀹夊叏鎺堟潈鐮佸皻鏈厤缃紒璇峰厛鍦ㄤ簯鏁版嵁搴?settings 闆嗗悎涓坊鍔?system_auth 璁板綍骞惰缃?adminPassword 瀛楁銆? };
        }
        const realAdminPwd = sysSettings.data[0].adminPassword;

        if (adminPassword !== realAdminPwd) return { success: false, msg: '瓒呯鎿嶄綔瀵嗙爜楠岃瘉澶辫触锛? }

        if (subAction === 'add') {
          const itemToSave = { ...teacherItem, role: 'teacher', timestamp: Date.now() }
          delete itemToSave._id // 鏋佸叾鍏抽敭锛氶槻姝㈠墠绔紶鏉ョ殑绌哄瓧绗︿覆 '' 浣滀负鐪熸鐨?ID 鍐欏叆鏁版嵁搴?          const res = await db.collection('teachers').add({ 
            data: itemToSave 
          })
          return { success: true, msg: '鏁欏笀璐﹀彿绛惧彂鎴愬姛', id: res.id }
        } 
        else if (subAction === 'update') {
          const id = teacherItem._id
          delete teacherItem._id
          await db.collection('teachers').doc(id).update({ data: teacherItem })
          return { success: true, msg: '鏁欏笀鍩烘湰妗ｆ宸叉洿鏂? }
        } 
        else if (subAction === 'delete') {
          if (!teacherItem._id) return { success: false, msg: '缂哄け璁板綍ID' }
          await db.collection('teachers').doc(teacherItem._id).remove()
          return { success: true, msg: '鏁欏笀璐﹀彿宸叉敞閿€' }
        } 
        else if (subAction === 'resetPwd') {
          if (!teacherItem._id || !teacherItem.password) return { success: false, msg: '缂哄け楠岃瘉淇℃伅' }
          await db.collection('teachers').doc(teacherItem._id).update({ 
            data: { password: teacherItem.password } 
          })
          return { success: true, msg: '瀵嗙爜閲嶇疆鎴愬姛' }
        }
        return { success: false, msg: '鏈煡鐨勫瓙鎿嶄綔' }
      }

      // 7. 澶嶅埗璇捐〃鑷虫寚瀹氬懆 (浼樺厛鍏嬮殕鏉ユ簮鍛ㄧ殑瀹炰綋璇捐〃锛岃嫢鏉ユ簮鍛ㄤ负绌猴紝鍒欓€€鍖栦娇鐢ㄥ叏灞€妯℃澘)
      case 'copyWeekSchedule': {
        const { role, mondayDateStr, nextWeekMondayTimestamp, sourceMondayStr } = payload
        if (role !== 'admin') return { success: false, msg: '鏉冮檺涓嶈冻锛氫粎绠＄悊鍛樺彲浠ユ墽琛屽鍒惰琛ㄦ搷浣? }
        
        let targetMondayStr = mondayDateStr
        if (!targetMondayStr && nextWeekMondayTimestamp) {
          const d = new Date(nextWeekMondayTimestamp)
          targetMondayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        }
        if (!targetMondayStr) return { success: false, msg: '缂哄皯鐩爣鍛ㄤ竴鏃ユ湡鍙傛暟' }

        // 鐩爣鍛ㄧ殑鏃堕棿杈圭晫瑙ｆ瀽
        const [mY, mM, mD] = targetMondayStr.split('-').map(Number)
        const targetSundayDate = new Date(mY, mM - 1, mD + 6, 12, 0, 0)
        const targetSundayStr = `${targetSundayDate.getFullYear()}-${String(targetSundayDate.getMonth()+1).padStart(2,'0')}-${String(targetSundayDate.getDate()).padStart(2,'0')}`

        // 鏄惁鍏锋湁鏉ユ簮鍛?(鏂扮増鍓嶇浼氫紶鍏?sourceMondayStr)
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

        // 鍏堟竻绌虹洰鏍囧懆(鏂板懆)鍘熸潵鍙兘鏈夌殑鎵€鏈?sessions
        let deletedCount = 0
        const oldSessionsRes = await db.collection('class_sessions').where({
          date: _.gte(targetMondayStr).and(_.lte(targetSundayStr))
        }).limit(500).get()
        for (const old of (oldSessionsRes.data || [])) {
          await db.collection('class_sessions').doc(old._id).remove()
          deletedCount++
        }

        let generatedCount = 0

        // 鏍规嵁鏉ユ簮鏁版嵁鐢熸垚鐩爣鍛?        if (sourceSessions.length > 0) {
          // 绛栫暐 A锛氭潵婧愬懆鏈夌墿鐞嗘帓璇撅紝涓ユ牸鍏嬮殕瀹炲喌锛佸皢鏃ユ湡闂撮殧寤跺悗7澶?          for (let ses of sourceSessions) {
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
          // 绛栫暐 B锛氭潵婧愬懆鏄粷瀵圭┖鑽¤崱鐨勶紝鍥為€€鍒伴檷绾ч€昏緫锛岃鍙栧叏灞€ class 妯℃澘
          const classesRes = await db.collection('classes').get()
          const classes = classesRes.data || []
          const dayMap = { '鍛ㄤ竴': 0, '鍛ㄤ簩': 1, '鍛ㄤ笁': 2, '鍛ㄥ洓': 3, '鍛ㄤ簲': 4, '鍛ㄥ叚': 5, '鍛ㄦ棩': 6 }

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

        return { success: true, msg: `宸叉垚鍔?{sourceSessions.length > 0 ? '鍏嬮殕鏉ユ簮鍛ㄥ疄鍐垫帓璇? : '鐢卞叏灞€鐝骇妯℃澘娲惧彂'}鑷充笅鍛紝鏂拌惤鎴?${generatedCount} 鑺傚疄浣撹${deletedCount > 0 ? '锛堣鐩栧幓闄や簡 ' + deletedCount + ' 鑺傚簾寮冩帓鐝級' : ''}` }
      }

      // 7.5 鏇存柊鍗曡妭瀹炰綋璇剧殑鏃ユ湡/鏃堕棿锛堟棩鍘嗘嫋鎷斤級
      case 'updateSession': {
        const { sessionId, date: sesDate, timeSpan } = payload;
        if (!sessionId) return { success: false, msg: '缂哄皯璇剧▼ID' };
        const sesUpdate = {};
        if (sesDate) sesUpdate.date = sesDate;
        if (timeSpan) sesUpdate.timeSpan = timeSpan;
        await db.collection('class_sessions').doc(sessionId).update({ data: sesUpdate });
        return { success: true, msg: '璇剧▼鏃堕棿宸叉洿鏂? };
      }

      // 澶勭悊妯℃澘鏃ュ巻鍙栨秷鎺掕
      case 'cancelTemplateBlock': {
        const { classId, className, date, timeSpan } = payload;
        if (!classId || !date) return { success: false, msg: '缂哄皯鍏抽敭鍙傛暟' };
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
        return { success: true, msg: '璇捐妭宸插彇娑? };
      }

      // 7.6 鍒犻櫎鍗曡妭瀹炰綋璇?      case 'deleteSession': {
        const { sessionId } = payload;
        if (!sessionId) return { success: false, msg: '缂哄皯璇剧▼ID' };
        await db.collection('class_sessions').doc(sessionId).remove();
        return { success: true, msg: '璇剧▼宸插彇娑? };
      }

      // 7.7 娣诲姞鍗曡妭涓存椂璇?鍔犺 (鐐瑰嚮鏃ュ巻绌虹櫧鏍?
      case 'addSession': {
        const { classId, className, date, timeSpan } = payload;
        if (!classId || !date || !timeSpan) return { success: false, msg: '缂哄皯鎺掕鍏抽敭鍙傛暟' };
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
        return { success: true, msg: '鍗曟璇捐妭宸叉坊鍔? };
      }

      // 8. 澶勭悊瀹堕暱绔姤鍚嶇敵璇?(Approve/Reject)
      case 'manageApplication': {
        const { applicationId, status, studentId, operator } = payload
        if (!applicationId || !status) return { success: false, msg: '缂哄皯蹇呰鍙傛暟' }
        
        const updateData = { status }
        if (status === 'approved') {
          updateData.studentId = studentId
          updateData.operator = operator
          updateData.processTime = Date.now()
        }

        await db.collection('applications').doc(applicationId).update({
          data: updateData
        })
        return { success: true, msg: '鐢宠鐘舵€佹洿鏂版垚鍔? }
      }

      // 8.5 娣诲姞鏂板鍛樺強璐㈠姟娴佹按
      case 'addStudent': {
        const { studentData, moneyNum } = payload
        
        // 1. 鍐欏叆瀛︾敓琛?        const res = await db.collection('students').add({
          data: studentData
        });

        // 2. 濡傛灉瀹炴敹閲戦澶т簬0锛屽啓鍏ヨ储鍔¤〃
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

        return { success: true, msg: '娣诲姞瀛﹀憳鎴愬姛', id: res._id }
      }

      // 10. Epic 7: 瀹堕暱鑾峰彇鍚嶄笅缁戝畾鐨勬墍鏈夊鐢熸。妗?      case 'getMyStudents': {
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID

        if (!openid) return { success: false, msg: '鏃犳硶鑾峰彇寰俊鎺堟潈淇℃伅' }

        const res = await db.collection('students').where({
          _openid: openid
        }).get()
        
        return { success: true, data: res.data }
      }

      // 10.5 Epic 10: 瀹堕暱鑾峰彇涓撳睘璐熻矗鑰佸笀浠殑鑱旂郴鏂瑰紡
      case 'getMyTeachers': {
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID
        console.log('[getMyTeachers] called with openid:', openid)

        if (!openid) return { success: false, msg: '鏈巿鏉? }

        // 1. 鑾峰彇璇ュ闀垮悕涓嬬殑鎵€鏈夊鍛?        const stuRes = await db.collection('students').where({ _openid: openid }).get()
        const stuIds = stuRes.data.map(s => s._id)
        console.log('[getMyTeachers] Found students for openid:', stuIds)
        if (stuIds.length === 0) return { success: true, data: [] }

        // 2. 鏌ユ壘鎵€鏈夌殑鐝骇骞跺湪浠ｇ爜涓仛鏁扮粍姹備氦闆嗚繃婊わ紝閬垮厤浜戝紑鍙戜娇鐢?_.in 澶勭悊鍙屾暟缁勭殑灞€闄愭€?        const classRes = await db.collection('classes').get()
        const myClasses = classRes.data.filter(cls => {
          if (!cls.studentIds || !Array.isArray(cls.studentIds)) return false;
          // 鍙璇ョ彮绾ч噷鍖呭惈瀹堕暱鍚嶄笅鐨勪换浣曚竴涓瀛愶紝璇ヨ礋璐ｈ€佸笀灏卞睘浜庤瀹堕暱
          return cls.studentIds.some(id => stuIds.includes(id));
        });
        
        console.log('[getMyTeachers] Filtered matched classes:', myClasses)

        // 3. 鎻愬彇鑰佸笀鐨勫幓閲嶈仈绯绘柟寮?        const teachers = [];
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

      // 11. Epic 7: 瀹堕暱鑾峰彇鏌愪綅瀛︾敓鐨勫巻鍙叉秷璇?鐐硅瘎璁板綍
      case 'getMyRecords': {
        const { studentId, limit = 20 } = payload
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID
        
        if (!studentId || !openid) return { success: false, msg: '缂哄皯鍙傛暟鎴栨巿鏉冧俊鎭? }

        // 鍋氫竴灞傞壌鏉冿細涓轰簡闃叉鎶撳寘鑴卞簱锛岄獙璇佽姹傜殑杩欎釜 studentId 鏄笉鏄湡鐨勫睘浜庤繖涓?openid
        const stuRes = await db.collection('students').doc(studentId).get()
        if (!stuRes.data || stuRes.data._openid !== openid) {
          return { success: false, msg: '瓒婃潈璁块棶锛氳瀛﹀憳鏈粦瀹氳嚦鎮ㄧ殑寰俊' }
        }

        const res = await db.collection('class_records')
          .where({ studentId })
          .orderBy('timestamp', 'desc')
          .limit(limit)
          .get()

        const records = res.data

        // 鏍稿績閲嶆瀯 13-2: Storage Protocol Normalization
        // 鎶婃墍鏈夌殑 cloud:// 鍗忚鐩存帴鍦ㄤ笂甯濊瑙?浜戝嚱鏁板悗鍙?杞崲涓轰复鏃?https 閾炬帴锛屽交搴曠粫杩囧皬绋嬪簭绔彲鑳藉嚭鐜扮殑浠讳綍鍥剧墖鐧藉悕鍗?娓叉煋鍏煎闂銆?        try {
          const fileIDsToConvert = records
            .filter(r => r.artwork && r.artwork.startsWith('cloud://'))
            .map(r => r.artwork)
            
          if (fileIDsToConvert.length > 0) {
            const urlRes = await cloud.getTempFileURL({ fileList: fileIDsToConvert })
            
            // 灏嗘嬁鍒扮殑鐪熷疄 HTTPS 閾炬帴鍥炲～缁欏搴旂殑 record
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
          console.error('[getMyRecords] 杞崲鍥剧墖閾炬帴澶辫触:', convertErr)
          // 鍝€曟姤閿欎簡锛屼篃鎶婂師濮嬫暟鎹涪鍥炵粰灏忕▼搴忥紙灏忕▼搴忕搴曞眰鍏跺疄涔熸槸鏀寔鐩存帴娓叉煋 cloud:// 鐨勶紝杩欏彧鏄竴灞傚厹搴曚繚闅滐級
        }

        return { success: true, data: records }
      }

      // 12. Epic 8: 鑰佺敓璐﹀彿鎵惧洖涓庡井淇′竴瀵逛竴缁戝畾
      case 'bindStudent': {
        const { studentName, phone } = payload
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID

        if (!studentName || !phone || !openid) return { success: false, msg: '缂哄皯鏍￠獙鍙傛暟' }

        // 鏌ユ壘鏄惁鍖归厤
        const res = await db.collection('students').where({
          name: studentName,
          phone: phone
        }).get()

        if (!res.data || res.data.length === 0) {
          return { success: false, msg: '鏈壘鍒板尮閰嶇殑瀛﹀憳妗ｆ锛岃妫€鏌ュ鍚嶄笌褰撴椂棰勭暀鐨勬墜鏈哄彿' }
        }

        const targetStudent = res.data[0]

        // 濡傛灉璇ュ鍛樺凡缁忚缁戝畾杩囦簡锛堜笖缁戝畾鐨勪笉鏄綋鍓嶅井淇″彿锛?        if (targetStudent._openid && targetStudent._openid !== openid) {
          return { success: false, msg: '璇ュ鍛樺凡琚叾浠栧井淇″彿缁戝畾锛屽闇€瑙ｇ粦璇疯仈绯绘満鏋勮€佸笀' }
        }

        // 鎶婂綋鍓嶅闀跨殑 openid 鍐欒繘鍘?        await db.collection('students').doc(targetStudent._id).update({
          data: {
            _openid: openid
          }
        })

        return { success: true, msg: '璁ら缁戝畾鎴愬姛锛? }
      }

      // 馃洝锔?13. 鏁欏笀绔偣璇勫唴瀹瑰啓鍥?(鍓嶇涓嶅啀鐩村啓 class_records)
      case 'updateReview': {
        const { recordId, comment, artwork } = payload;
        if (!recordId) return { success: false, msg: '缂哄皯娑堣璁板綍ID' };
        const updateData = { reviewTimestamp: Date.now() };
        if (comment !== undefined) updateData.comment = comment;
        if (artwork !== undefined) updateData.artwork = artwork;
        await db.collection('class_records').doc(recordId).update({ data: updateData });
        return { success: true, msg: '鐐硅瘎宸蹭繚瀛? };
      }

      // 13.5 瀹堕暱绔強鏁欏笀绔嚜涓婚噸缃鍛樹釜浜哄ご鍍?      case 'updateStudentAvatar': {
        const { studentId, avatarUrl } = payload;
        const wxContext = cloud.getWXContext();
        const openid = wxContext.OPENID;

        if (!studentId || !avatarUrl || !openid) return { success: false, msg: '缂哄皯鍙傛暟鎴栨巿鏉冧俊鎭己澶? };

        // 閴存潈锛氬彧鏈夌粦瀹氫簡璇ュ闀跨殑瀛︾敓锛屾墠鑳借璇ュ闀夸慨鏀瑰ご鍍?        const stuRes = await db.collection('students').doc(studentId).get();
        if (!stuRes.data || stuRes.data._openid !== openid) {
          return { success: false, msg: '瓒婃潈鎿嶄綔锛氬彧鑳戒慨鏀硅嚜宸卞叧鑱旂粦瀹氱殑瀛﹀憳澶村儚' };
        }

        await db.collection('students').doc(studentId).update({
          data: { avatar: avatarUrl }
        });

        return { success: true, msg: '鏇存崲鎴愬姛' };
      }

      // 13.6 鏁欏笀绔嚜涓婚噸缃釜浜哄ご鍍?(鏁欏笀涓撳睘鏈哄埗)
      case 'updateTeacherAvatar': {
        const { teacherId, avatarUrl, _callerPhone, _callerPassword } = payload;
        if (!teacherId || !avatarUrl) return { success: false, msg: '缂哄皯鍙傛暟' };
        
        // 閴存潈鎶婂叧锛氱‘淇濆綋鍓嶆搷浣滅殑鏁欏笀 _id 纭疄鍖归厤浜庡叾涓婁紶鐨勭櫥褰曞嚟璇?        const tRes = await db.collection('teachers').where({ phone: _callerPhone, password: _callerPassword }).get();
        if(!tRes.data || tRes.data.length === 0 || tRes.data[0]._id !== teacherId) {
          return { success: false, msg: '瓒婃潈鎿嶄綔锛氬彧鑳戒慨鏀瑰睘浜庤嚜宸辫处鍙风殑澶村儚' };
        }

        // 淇敼浜戞暟鎹簱
        await db.collection('teachers').doc(teacherId).update({
          data: { avatar: avatarUrl }
        });

        return { success: true, msg: '鏁欏笀澶村儚鏇存崲鎴愬姛' };
      }

      // 馃洝锔?14. 缂栬緫瀛﹀憳妗ｆ (BUG-3淇锛氬墠绔笉鍐嶇洿鍐?students)
      case 'updateStudent': {
        const { studentId, updateData } = payload;
        if (!studentId) return { success: false, msg: '缂哄皯瀛︾敓ID' };
        // 瀹夊叏杩囨护锛氬彧鍏佽鏇存柊杩欎簺瀛楁
        const allowed = ['name', 'gender', 'age', 'phone', 'address', 'course'];
        const safeData = {};
        allowed.forEach(k => { if (updateData[k] !== undefined) safeData[k] = updateData[k]; });
        await db.collection('students').doc(studentId).update({ data: safeData });
        return { success: true, msg: '瀛﹀憳妗ｆ鏇存柊鎴愬姛' };
      }

      // 馃洝锔?15. 鍒涘缓/缂栬緫鐝骇 (BUG-3淇锛氬墠绔笉鍐嶇洿鍐?classes)
      case 'manageClass': {
        const { subAction: clsSubAction, classId, classData } = payload;
        if (clsSubAction === 'add') {
          classData.createdTimestamp = Date.now();
          const res = await db.collection('classes').add({ data: classData });
          return { success: true, msg: '鏂扮彮绾у垱寤烘垚鍔?, id: res._id };
        } else if (clsSubAction === 'update') {
          if (!classId) return { success: false, msg: '缂哄皯鐝骇ID' };
          await db.collection('classes').doc(classId).update({ data: classData });
          return { success: true, msg: '鐝骇淇℃伅宸叉洿鏂? };
        }
        return { success: false, msg: '鏈煡鐨勭彮绾ф搷浣? };
      }

      // 馃洝锔?16. 鏇存柊鎺掕鏃堕棿 (BUG-3淇锛氭棩鍘嗘嫋鎷戒笉鍐嶇洿鍐?
      case 'updateClassSchedule': {
        const { classId: schedClassId, scheduleDay, scheduleTime } = payload;
        if (!schedClassId) return { success: false, msg: '缂哄皯鐝骇ID' };
        await db.collection('classes').doc(schedClassId).update({
          data: { scheduleDay, scheduleTime }
        });
        return { success: true, msg: '鎺掕鏃堕棿宸叉洿鏂? };
      }

      // 馃洝锔?17. 瀹堕暱鎻愪氦璇峰亣 (BUG-4淇锛氳蛋浜戝嚱鏁拌€岄潪鐩村啓)
      case 'submitLeave': {
        const wxContext = cloud.getWXContext();
        const openid = wxContext.OPENID;
        if (!openid) return { success: false, msg: '鏈巿鏉? };
        const { studentId: leaveStudentId, studentName: leaveStuName, date: leaveDate, reason } = payload;
        if (!leaveStudentId || !leaveDate || !reason) return { success: false, msg: '缂哄皯蹇呰鍙傛暟' };
        // 楠岃瘉璇ュ鍛樺睘浜庤瀹堕暱
        const stuCheck = await db.collection('students').doc(leaveStudentId).get();
        if (!stuCheck.data || stuCheck.data._openid !== openid) {
          return { success: false, msg: '鏃犳潈涓鸿瀛﹀憳璇峰亣' };
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
        return { success: true, msg: '璇峰亣鎴愬姛' };
      }

      // 18. 澶勭悊璇峰亣瀹℃壒 (缁曡繃鍓嶇瀹夊叏瑙勫垯鐩村啓闈欓粯澶辫触Bug)
      case 'manageLeave': {
        const { leaveId, status } = payload;
        if (!leaveId || !status) return { success: false, msg: '缂哄皯蹇呰鍙傛暟' };
        await db.collection('leaves').doc(leaveId).update({
          data: { status }
        });
        return { success: true, msg: '璇峰亣鐘舵€佸凡鏇存柊' };
      }

      // 19. UGC 鏂囨湰鍚堣瀹夊叏妫€娴?(闃叉敞鍏ュ鏌ュ繀鎺ワ紝杩斿洖 true 浠ｈ〃瀹夊叏锛宖alse 浠ｈ〃鎷掑)
      case 'msgSecCheck': {
        const { content } = payload;
        if (!content) return { success: true, msg: 'empty_pass' }; // 鎺у埗绌洪獙璇?        try {
          // 璋冪敤寰俊搴曞眰瀹夊叏妫€娴嬪紩鎿?(V1閫氱敤鐗?
          const checkRes = await cloud.openapi.security.msgSecCheck({
            content: content
          });
          if (checkRes.errCode === 0) {
            return { success: true, msg: 'ok' };
          }
          return { success: false, msg: '娑夊珜杩濆弽瀹夊叏鍏害' };
        } catch (err) {
          // errCode: 87014 鍗充负鍛戒腑杩濊鏂囨湰
          console.warn('銆愬畨鍏ㄦ嫤鎴€?, err);
          return { success: false, msg: '鍖呭惈鏁忔劅銆佽繚娉曟垨涓嶅綋璇嶆眹锛屽凡琚钩鍙扮郴缁熸嫤鎴€? };
        }
      }

      // 20. 鐢熸垚瀹堕暱绔叆鍙ｆ殫闂ㄤ簩缁寸爜 (B绔棤闄愬埗鐮?
      case 'generateVipQrCode': {
        const { role } = payload;
        if (role !== 'admin') return { success: false, msg: '鏉冮檺涓嶈冻锛氫粎瓒呯鍙互鎻愬彇涓撳睘鍏ュ満浜岀淮鐮? };
        
        try {
          const result = await cloud.openapi.wxacode.getUnlimited({
            scene: 'unlock',
            page: 'pages/index/index',
            width: 430,
            check_path: false // 銆愬叧閿慨澶嶃€戯細鍏抽棴璺緞鏍￠獙銆傜敱浜庢偍鐨勫皬绋嬪簭杩欑増杩樻病鍙戝竷锛屼笉鍏冲畠寰俊搴曞眰浼氭姤閿欒鎵句笉鍒伴〉闈?          });
          
          // 鐩存帴灏嗕簩杩涘埗鐨勫浘鐗囩紦瀛樿浆涓?base64 鍙戠粰鍓嶇缃戦〉锛屾棤闇€鍚戜簯瀛樺偍瀛樼洏
          const base64Str = result.buffer.toString('base64');
          return { success: true, imgDataUrl: `data:image/jpeg;base64,${base64Str}` };
        } catch (err) {
          console.error('銆愮敓鎴愭殫闂ㄤ簩缁寸爜澶辫触銆?, err);
          return { success: false, msg: `寰俊鏈嶅姟鎷掔粷浜嗙敓鐮佽姹傦紝鍘熷洜涓? ${err.message || err.errMsg || JSON.stringify(err)}銆傚彲鑳芥槸鍥犱负鎮ㄧ殑灏忕▼搴忎粠鏈彂甯冭繃浠讳綍姝ｅ紡鐗堟湰銆傝鑷冲皯鍙戝竷涓€鐗堝悗鍐嶆潵鐢熸垚銆俙 };
        }
      }

      // 21. 瀹堕暱鎵爜婵€娲?VIP锛堜簯绔寔涔呭寲锛?      case 'activateVIP': {
        const wxContext = cloud.getWXContext();
        const openid = wxContext.OPENID;
        if (!openid) return { success: false, msg: '鏃犳硶鑾峰彇鎺堟潈淇℃伅' };

        // 骞傜瓑鍐欏叆锛氬鏋滃凡瀛樺湪鍒欒烦杩?        const existVip = await db.collection('vip_users').where({ _openid: openid }).get();
        if (existVip.data && existVip.data.length > 0) {
          return { success: true, msg: '宸叉縺娲?, alreadyActive: true };
        }

        await db.collection('vip_users').add({
          data: {
            _openid: openid,
            activated: true,
            activatedAt: Date.now()
          }
        });
        return { success: true, msg: 'VIP 婵€娲绘垚鍔? };
      }

      // 22. 鍚姩鏃舵牎楠?VIP 鐘舵€侊紙浜戠鏉冨▉婧愶級
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

      // 23. 绠＄悊鍛樻挙閿€ VIP锛堥€€璐硅涪浜猴級
      case 'revokeVIP': {
        const { targetOpenid, role } = payload;
        if (role !== 'admin') return { success: false, msg: '鏉冮檺涓嶈冻锛氫粎绠＄悊鍛樺彲鎾ら攢 VIP' };
        if (!targetOpenid) return { success: false, msg: '缂哄皯鐩爣鐢ㄦ埛 OpenID' };

        const vipRecord = await db.collection('vip_users').where({ _openid: targetOpenid }).get();
        if (!vipRecord.data || vipRecord.data.length === 0) {
          // 鏃х増鐢ㄦ埛娌℃湁浜戠璁板綍锛岀洿鎺ュ垱寤轰竴鏉?宸茬鐢?璁板綍鏉ラ樆鏂簯绔牎楠?          await db.collection('vip_users').add({
            data: {
              _openid: targetOpenid,
              activated: false,
              revokedAt: Date.now()
            }
          });
          return { success: true, msg: 'VIP 宸叉挙閿€锛堟棫鐗堢敤鎴凤級锛岃鐢ㄦ埛涓嬫鎵撳紑灏嗗洖鍒板熀纭€妯″紡' };
        }

        await db.collection('vip_users').doc(vipRecord.data[0]._id).update({
          data: { activated: false, revokedAt: Date.now() }
        });
        return { success: true, msg: 'VIP 宸叉挙閿€锛岃鐢ㄦ埛涓嬫鎵撳紑灏嗗洖鍒板熀纭€妯″紡' };
      }

      default:
        return { success: false, msg: '鏈煡鐨勬搷浣滅被鍨?(action)' }
    }
  } catch (err) {
    console.error('浜戝嚱鏁版墽琛屾姤閿?', err)
    // 馃洝锔?瀹夊叏鍔犲浐锛氫笉鍐嶅悜鍓嶇娉勬紡瀹屾暣鐨勯敊璇璞?    return { success: false, msg: '鏈嶅姟鍣ㄥ唴閮ㄩ敊璇紝璇疯仈绯荤鐞嗗憳' }
  }
}
