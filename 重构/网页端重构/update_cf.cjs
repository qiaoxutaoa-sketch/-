const fs = require('fs');

const path = 'e:/青九教务系统-三端（重构）/抢救云函数/cloudfunctions/adminOperate/index.js';
let c = fs.readFileSync(path, 'utf8');

const regex = /case 'updateReview': \{[\s\S]*?return \{ success: true, msg: '点评已保存' \};\r?\n      \}/;
const replaceWith = `case 'updateReview': {
        if (callerRole !== 'admin') return { success: false, msg: '越权操作：仅管理员可用' };
        const { recordId, comment, artwork } = payload;
        if (!recordId) return { success: false, msg: '缺少消课记录ID' };
        let finalArtwork = [];
        if (Array.isArray(artwork)) {
          for (let i = 0; i < artwork.length; i++) {
            const item = artwork[i];
            if (typeof item === 'string' && item.startsWith('data:image/')) {
              try {
                const b64Data = item.replace(/^data:image\\/\\w+;base64,/, '');
                const buffer = Buffer.from(b64Data, 'base64');
                const ext = item.match(/^data:image\\/(\\w+);base64,/)?.[1] || 'jpg';
                const cloudPath = 'reviews/' + Date.now() + '_' + Math.floor(Math.random()*1000) + '.' + ext;
                const uploadRes = await cloud.uploadFile({ cloudPath, fileContent: buffer });
                const urlRes = await cloud.getTempFileURL({ fileList: [uploadRes.fileID] });
                if (urlRes.fileList && urlRes.fileList.length > 0 && urlRes.fileList[0].tempFileURL) {
                  finalArtwork.push(urlRes.fileList[0].tempFileURL);
                } else {
                  finalArtwork.push(uploadRes.fileID);
                }
              } catch(e) { console.error(e) }
            } else if (item) { finalArtwork.push(item); }
          }
        } else if (typeof artwork === 'string' && artwork.startsWith('data:image/')) {
           try {
             const b64Data = artwork.replace(/^data:image\\/\\w+;base64,/, '');
             const buffer = Buffer.from(b64Data, 'base64');
             const ext = artwork.match(/^data:image\\/(\\w+);base64,/)?.[1] || 'jpg';
             const uploadRes = await cloud.uploadFile({ cloudPath: 'reviews/' + Date.now() + '_' + Math.floor(Math.random()*1000) + '.' + ext, fileContent: buffer });
             const urlRes = await cloud.getTempFileURL({ fileList: [uploadRes.fileID] });
             if (urlRes.fileList && urlRes.fileList.length > 0 && urlRes.fileList[0].tempFileURL) {
               finalArtwork = [urlRes.fileList[0].tempFileURL];
             } else {
               finalArtwork = [uploadRes.fileID];
             }
           } catch(e) { console.error(e) }
        } else if (artwork !== undefined) {
          finalArtwork = artwork;
        }
        const updateData = { reviewTimestamp: Date.now() };
        if (comment !== undefined) updateData.comment = comment;
        if (artwork !== undefined) updateData.artwork = finalArtwork;
        await db.collection('class_records').doc(recordId).update({ data: updateData });
        return { success: true, msg: '点评已保存' };
      }`;

if(regex.test(c)) {
  fs.writeFileSync(path, c.replace(regex, replaceWith), 'utf8');
  console.log('REPLACED');
} else {
  console.log('NOT FOUND');
}
