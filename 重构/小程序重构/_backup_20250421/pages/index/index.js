// pages/index/index.js
import { callCloudApi } from '../../utils/cloud-request';

const app = getApp();

Page({
  data: {
    isVip: false,
    loading: true,
    students: [],
    currentStudentIdx: 0,
    latestRecord: null,
    recordsList: [],
    navTop: 0,
    navHeight: 44
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    const menuButton = wx.getMenuButtonBoundingClientRect();
    this.setData({
      navTop: menuButton.top,
      navHeight: menuButton.height
    });
    // Listen to global auth state resolves
    app.vipCallback = (vipStatus) => {
      this.setData({ isVip: vipStatus });
      if (vipStatus) {
        this.fetchMyStudents();
      } else {
        this.setData({ loading: false });
      }
    };
    
    // Check if already resolved
    if (app.globalData.isVip !== undefined && app.globalData.isVip) {
      this.setData({ isVip: true });
      this.fetchMyStudents();
    } else if (app.globalData.isVip === false) {
      this.setData({ isVip: false, loading: false });
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
    if (this.data.isVip) {
      this.fetchMyStudents();
    }
  },

  onPullDownRefresh() {
    if (this.data.isVip) {
      this.fetchMyStudents().then(() => {
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  },

  async fetchMyStudents() {
    this.setData({ loading: true });
    try {
      const res = await callCloudApi('getMyStudents');
      if (res.success) {
        this.setData({ 
          students: res.data || [],
          loading: false
        });
        await this.fetchLatestRecord();
      } else {
        this.setData({ loading: false });
      }
    } catch(e) {
      this.setData({ loading: false });
    }
  },

  async fetchLatestRecord() {
    const students = this.data.students || [];
    if (students.length === 0) return;
    const currentStudent = students[this.data.currentStudentIdx];
    
    try {
      const res = await callCloudApi('getMyRecords', { studentId: currentStudent._id, limit: 20 });
      if (res.success && res.data && res.data.length > 0) {
        const list = res.data.map(rec => {
          if (typeof rec.artwork === 'string' && rec.artwork.length > 0) {
            rec.artwork = [rec.artwork];
          }
          return rec;
        });
        this.setData({ latestRecord: list[0], recordsList: list });
      } else {
        this.setData({ latestRecord: null, recordsList: [] });
      }
    } catch (e) {
      this.setData({ latestRecord: null, recordsList: [] });
      console.error(e);
    }
  },

  switchStudent(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ currentStudentIdx: idx });
    this.fetchLatestRecord();
  },

  goToBind(e) {
    const tab = e.currentTarget.dataset.tab || 'new';
    app.globalData.targetBindTab = tab;
    wx.switchTab({ url: '/pages/bind/bind' });
  },
  
  goToRecords() {
    const students = this.data.students || [];
    if (students.length === 0) return;
    const currentStudent = students[this.data.currentStudentIdx];
    wx.navigateTo({ url: `/pages/records/records?id=${currentStudent._id}` });
  },
  
  goLeave() {
    wx.navigateTo({ url: '/pages/leave/leave' });
  }
});
