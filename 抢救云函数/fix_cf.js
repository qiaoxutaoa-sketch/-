const fs = require('fs');
let c = fs.readFileSync('cloudfunctions/adminOperate/index.js', 'utf8');

const adminCheck = "if (callerRole !== 'admin') return { success: false, msg: '越权操作：仅管理员可用' };\n        ";

// 1. updateSession
c = c.replace(
  /case 'updateSession': \{\s+const \{ sessionId/,
  `case 'updateSession': {\n        ${adminCheck}const { sessionId`
);

// 2. deleteSession
c = c.replace(
  /case 'deleteSession': \{\s+const \{ sessionId/,
  `case 'deleteSession': {\n        ${adminCheck}const { sessionId`
);

// 3. addSession
c = c.replace(
  /case 'addSession': \{\s+const \{ classId/,
  `case 'addSession': {\n        ${adminCheck}const { classId`
);

// 4. cancelTemplateBlock
c = c.replace(
  /case 'cancelTemplateBlock': \{\s+const \{ classId/,
  `case 'cancelTemplateBlock': {\n        ${adminCheck}const { classId`
);

// 5. updateReview
c = c.replace(
  /case 'updateReview': \{\s+const \{ recordId/,
  `case 'updateReview': {\n        ${adminCheck}const { recordId`
);

// 6. manageLeave
c = c.replace(
  /case 'manageLeave': \{\s+const \{ leaveId/,
  `case 'manageLeave': {\n        ${adminCheck}const { leaveId`
);

// 7. addClass
c = c.replace(
  /case 'addClass': \{\s+const \{ classData/,
  `case 'addClass': {\n        ${adminCheck}const { classData`
);

// 8. updateClass
c = c.replace(
  /case 'updateClass': \{\s+const \{ classId: updClsId/,
  `case 'updateClass': {\n        ${adminCheck}const { classId: updClsId`
);

// 9. manageClass
c = c.replace(
  /case 'manageClass': \{\s+const \{ subAction: clsSubAction/,
  `case 'manageClass': {\n        ${adminCheck}const { subAction: clsSubAction`
);

// 10. Fix updateStudent whitelist
c = c.replace(
  /const allowed = \['name', 'gender', 'age', 'phone', 'address', 'course'\];/,
  "const allowed = ['name', 'gender', 'age', 'phone', 'address', 'course', 'remain', 'totalHours', 'lastRenewalDate'];"
);

// 11. Fix batchConsume remain check
// Find:         // 瀵逛簬姣忎竴涓嬀閫夌殑瀛︾敓锛屾墸闄よ鏃讹紝骞跺鍔犱竴鏉℃秷璇捐褰曗
// Need to add check before processing
const batchConsumeFix = `
          try {
            // 安全性检查：确认课时是否足够
            const stuDataRes = await db.collection('students').doc(record.studentId).get()
            if (!stuDataRes.data || stuDataRes.data.remain < hours) {
              console.warn(\`学员 \${record.studentName} 课时不足，跳过消课\`)
              continue // 余额不足，直接跳过这位学生
            }
            
            // 鎻掑叆娑堣`;
c = c.replace(/try \{\s*\/\/\s*鎻掑叆娑堣/g, batchConsumeFix);

fs.writeFileSync('cloudfunctions/adminOperate/index.js', c);
console.log('Done mapping cloud function security fixes');
