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
    navHeight: 44,
    
    // HUD & Context
    showHUD: false,
    showNewPopup: false,
    showBindPopup: false,
    genders: ['男', '女', '未知'],
    newStudent: {
      name: '',
      gender: '',
      age: '',
      phone: '',
      address: ''
    },
    bindName: '',
    bindPhone: ''
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    const menuButton = wx.getMenuButtonBoundingClientRect();
    const navBarFullHeight = menuButton.top + menuButton.height + 8;
    this.setData({
      navTop: menuButton.top,
      navHeight: menuButton.height,
      navBarFullHeight: navBarFullHeight
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
    console.log('[DEBUG] 当前学员:', currentStudent.name, currentStudent._id);
    
    try {
      const res = await callCloudApi('getMyRecords', { studentId: currentStudent._id, limit: 20 });
      console.log('[DEBUG] 返回记录数:', res.data ? res.data.length : 0);
      console.log('[DEBUG] 原始数据:', JSON.stringify(res.data));
      
      if (res.success && res.data && res.data.length > 0) {
        const list = res.data.map(rec => {
          if (typeof rec.artwork === 'string' && rec.artwork.length > 0) {
            rec.artwork = [rec.artwork];
          }
          return rec;
        });
        this.setData({ latestRecord: list[0], recordsList: list });
        console.log('[DEBUG] 渲染列表数:', list.length);
      } else {
        this.setData({ latestRecord: null, recordsList: [] });
        console.log('[DEBUG] 无记录数据');
      }
    } catch (e) {
      this.setData({ latestRecord: null, recordsList: [] });
      console.error('[DEBUG] 获取记录失败:', e);
    }
  },

  // ===== HUD 胶囊控制区 =====
  toggleHUD() {
    this.setData({ showHUD: !this.data.showHUD });
  },
  
  closeHUD() {
    this.setData({ showHUD: false });
  },

  // ===== 学员切换 =====
  prevStudent() {
    if (this.data.currentStudentIdx <= 0) return;
    this.setData({ currentStudentIdx: this.data.currentStudentIdx - 1 });
    this.fetchLatestRecord();
  },

  nextStudent() {
    if (this.data.currentStudentIdx >= this.data.students.length - 1) return;
    this.setData({ currentStudentIdx: this.data.currentStudentIdx + 1 });
    this.fetchLatestRecord();
  },

  // ===== 服务中心处理逻辑 =====
  goLeave() {
    this.closeHUD();
    wx.navigateTo({ url: '/pages/leave/leave' });
  },

  contactTeacher() {
    wx.showToast({ title: '已通知主理老师', icon: 'success' });
  },
  
  aboutUs() {
    wx.showToast({ title: '探索青九教育', icon: 'none' });
  },

  // ===== 新生登记表单 =====
  openNewRegistration() {
    this.setData({ showNewPopup: true });
  },

  closeNewPopup() {
    this.setData({ showNewPopup: false });
  },

  bindGenderChange(e) {
    this.setData({
      'newStudent.gender': this.data.genders[e.detail.value]
    });
  },

  handleNewInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`newStudent.${field}`]: e.detail.value
    });
  },

  async submitNew() {
    const { name, gender, age, phone, address } = this.data.newStudent;
    if (!name || !gender || !age || !phone) {
      wx.showToast({ title: '带 * 号项为必填项', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '提交中' });
    try {
      const res = await callCloudApi('submitNewApplication', {
        studentData: {
          name, gender, 
          age: Number(age), 
          phone, address,
          remain: 0, totalHours: 0,
          status: 'pending'
        }
      });
      wx.hideLoading();
      if (res.success) {
        wx.showToast({ title: '档案建档成功，等待审核', icon: 'none', duration: 2000 });
        this.closeNewPopup();
      } else {
        wx.showToast({ title: res.msg || '提交通讯失败', icon: 'none' });
      }
    } catch(e) {
      wx.hideLoading();
      wx.showToast({ title: '网络开小差了', icon: 'none' });
    }
  },

  // ===== 老学员绑定 =====
  openBindPopup() {
    this.setData({ showNewPopup: false, showBindPopup: true, bindName: '', bindPhone: '' });
  },

  closeBindPopup() {
    this.setData({ showBindPopup: false });
  },

  handleBindInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },

  async submitBind() {
    const { bindName, bindPhone } = this.data;
    if (!bindName || !bindPhone) {
      wx.showToast({ title: '请填写姓名和手机号', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '匹配中' });
    try {
      const res = await callCloudApi('bindExistingStudent', {
        name: bindName.trim(),
        phone: bindPhone.trim()
      });
      wx.hideLoading();
      wx.showToast({ title: '绑定成功！', icon: 'success', duration: 2000 });
      this.closeBindPopup();
      // 重新拉取学员列表
      this.fetchMyStudents();
    } catch(e) {
      wx.hideLoading();
      // callCloudApi 已经弹出了错误提示
    }
  }
});
