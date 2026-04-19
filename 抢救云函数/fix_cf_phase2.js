const fs = require('fs');
let c = fs.readFileSync('cloudfunctions/adminOperate/index.js', 'utf8');

const newCases = `
      // ----- Phase 2 Proxy Fetches -----
      case 'fetchTeachers': {
        const { skip = 0, limit = 50 } = payload;
        const res = await db.collection('teachers').orderBy('_id', 'desc').skip(skip).limit(limit).get();
        const data = (res.data || []).map(t => {
          delete t.password;
          return t;
        });
        return { success: true, data };
      }
      
      case 'fetchStudents': {
        const { skip = 0, limit = 50 } = payload;
        const res = await db.collection('students').orderBy('enrollDate', 'desc').skip(skip).limit(limit).get();
        return { success: true, data: res.data || [] };
      }
      
      case 'fetchApplications': {
        const res = await db.collection('applications').where({ status: 'pending' }).orderBy('timestamp', 'desc').get();
        return { success: true, data: res.data || [] };
      }
      
      case 'fetchClasses': {
        const { skip = 0, limit = 100 } = payload;
        const res = await db.collection('classes').orderBy('createdTimestamp', 'desc').skip(skip).limit(limit).get();
        return { success: true, data: res.data || [] };
      }
      
      case 'fetchClassSessions': {
        const { startDateStr, endDateStr, classId } = payload;
        let query = { date: _.gte(startDateStr).and(_.lte(endDateStr)) };
        if (classId) {
          query.classId = classId;
        }
        const res = await db.collection('class_sessions').where(query).limit(500).get();
        return { success: true, data: res.data || [] };
      }
      
      case 'fetchRecords': {
        const { skip = 0, limit = 200 } = payload;
        const res = await db.collection('class_records').orderBy('timestamp', 'desc').skip(skip).limit(limit).get();
        return { success: true, data: res.data || [] };
      }
      
      case 'fetchRemarkOptions': {
        const res = await db.collection('settings').where({ type: 'consume_opts' }).get();
        if (res.data && res.data.length > 0 && res.data[0].remarkOpts) {
          return { success: true, data: res.data[0].remarkOpts };
        }
        return { success: true, data: ['日常课程', '比赛指导', '考级集训', '体验课', '寒暑假集训'] };
      }
      // ---------------------------------
`;

if (!c.includes('fetchTeachers')) {
  c = c.replace(/default:\s*return \{ success: false, msg: '未知的操作类型\(action\)' \}/, newCases + "\n      default:\n        return { success: false, msg: '未知的操作类型(action)' }");
  fs.writeFileSync('cloudfunctions/adminOperate/index.js', c);
  console.log('Phase 2 cases added successfully.');
} else {
  console.log('Phase 2 cases already exist.');
}
