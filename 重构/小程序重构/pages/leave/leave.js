// pages/leave/leave.js
import { callCloudApi } from '../../utils/cloud-request';

const app = getApp();

Page({
  data: {
    isVip: false,
    students: [],
    studentIdx: 0,
    date: '',
    reason: '',
    navTop: 0,
    navHeight: 44,
    navBarFullHeight: 88,
    L: {}
  },

  onLoad() {
    const menuButton = wx.getMenuButtonBoundingClientRect();
    const navBarFullHeight = menuButton.top + menuButton.height + 8;
    const vip = app.globalData.isVip;
    
    this.setData({ 
      date: new Date().toISOString().split('T')[0],
      navTop: menuButton.top,
      navHeight: menuButton.height,
      navBarFullHeight,
      isVip: vip
    });

    if (vip) {
      this.setData({
        L: {
          tag: 'LEAVE',
          title: '\u63d0\u524d\u62a5\u5907',
          subtitle: '\u8ba9\u8001\u5e08\u53ca\u65f6\u8c03\u6574\u8ba1\u5212',
          fieldStudent: 'STUDENT *',
          fieldDate: 'DATE *',
          fieldReason: 'REASON *',
          phReason: '\u4f8b\u5982\uff1a\u53d1\u70e7\u8bf7\u5047\uff0c\u4e0b\u5468\u4e00\u6765\u8865'
        }
      });
      this.fetchStudents();
    }
  },

  goBack() {
    wx.navigateBack();
  },

  async fetchStudents() {
    try {
      const res = await callCloudApi('getMyStudents');
      if (res.success && res.data.length > 0) {
        this.setData({ students: res.data });
      } else {
        wx.showToast({ title: '没有可请假的学员', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch(e) {}
  },

  bindStudentChange(e) {
    this.setData({ studentIdx: e.detail.value });
  },

  bindDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  handleReason(e) {
    this.setData({ reason: e.detail.value });
  },

  async submitLeave() {
    const { students, studentIdx, date, reason } = this.data;
    if (students.length === 0) return;
    if (!reason.trim()) {
      wx.showToast({ title: '请填写请假事由', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '安全校验中', mask: true });

    try {
      // 1. 内容合规性安全检测
      const secRes = await callCloudApi('msgSecCheck', { content: reason });
      if (!secRes.success) {
        wx.hideLoading();
        wx.showModal({
          title: '内容包含敏感词',
          content: '您的请假事由未通过微信安全检测，请修改后重试。',
          showCancel: false
        });
        return;
      }

      // 2. 提交请假申请
      wx.showLoading({ title: '提交申请' });
      const currentStu = students[studentIdx];
      const res = await callCloudApi('submitLeave', {
        studentId: currentStu._id,
        studentName: currentStu.name,
        date: date,
        reason: reason
      });

      wx.hideLoading();
      if (res.success) {
        wx.showToast({ title: '提交成功，待审批', icon: 'success' });
        setTimeout(() => { wx.navigateBack(); }, 1500);
      }
    } catch (e) {
      wx.hideLoading();
    }
  }
});
