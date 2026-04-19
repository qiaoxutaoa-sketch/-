const fs = require('fs');
let code = fs.readFileSync('src/views/DashboardView.vue', 'utf8');
const start = code.indexOf('/* iOS 风格分段控件');
const end = code.indexOf('/* 课程事件块 */');
if (start !== -1 && end !== -1) {
  const newCss = `/* iOS 风格分段控件：完全用 CSS :has() 接管 Month / Week 切换器 */
:deep(.fc-button-group) {
  background-color: var(--gray-100) !important;
  border-radius: 8px !important;
  padding: 3px !important;
  display: inline-flex !important;
  gap: 0 !important;
  position: relative !important;
  z-index: 1 !important;
  border: none !important;
}

:deep(.fc-button-group::before) {
  content: '';
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  background-color: #ffffff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  z-index: -1;
  pointer-events: none;
}

:deep(.fc-button-group:has(.fc-button:last-child.fc-button-active)::before) {
  transform: translateX(100%);
}

:deep(.fc-button-group > .fc-button) {
  background: transparent !important;
  border: none !important;
  color: var(--gray-500) !important;
  margin: 0 !important;
  padding: 4px 16px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-radius: 6px !important;
  box-shadow: none !important;
  flex: 1 1 0% !important;
  width: 70px !important;
  transition: color 0.3s ease !important;
  position: relative !important;
  z-index: 1 !important;
}

:deep(.fc-button-group > .fc-button.fc-button-active) {
  color: var(--gray-900) !important;
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.fc-button-group > .fc-button:not(:first-child)) {
  margin-left: 0 !important;
}

`;
  code = code.substring(0, start) + newCss + code.substring(end);
  fs.writeFileSync('src/views/DashboardView.vue', code);
  console.log('Successfully replaced CSS');
} else {
  console.log('Fail: ', start, end);
}
