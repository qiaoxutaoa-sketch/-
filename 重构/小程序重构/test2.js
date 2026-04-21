const content = require('fs').readFileSync('E:/青九教务系统-三端（重构）/重构/小程序重构/cloudfunctions/adminOperate/index.js', 'utf8'); console.log(content.match(/parentActions.*?;/s)[0]);
