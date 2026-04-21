// pages/bind/bind.js
import { callCloudApi } from '../../utils/cloud-request';

const app = getApp();

Page({
  data: {
    isVip: false,
    navTop: 0,
    navHeight: 44,
    showNewPopup: false,
    showOldPopup: false,
    studentAssigned: false, // 是否已经绑定了老生手机号（通过检测全局或后续更新）
    genders: ['男', '女', '未知'],
    newStudent: {
      name: '',
      gender: '',
      age: '',
      phone: '',
      address: ''
    },
    oldStudent: {
      name: '',
      phone: ''
    }
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    const menuButton = wx.getMenuButtonBoundingClientRect();
    this.setData({
      navTop: menuButton.top,
      navHeight: menuButton.height
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
    
    const updates = { isVip: app.globalData.isVip };
    if (app.globalData.targetBindTab) {
      if (app.globalData.targetBindTab === 'new') updates.showNewPopup = true;
      if (app.globalData.targetBindTab === 'old') updates.showOldPopup = true;
      delete app.globalData.targetBindTab;
    }
    
    this.setData(updates);
  },

  // 展开新生登记
  openNewRegistration() {
    this.setData({ showNewPopup: true });
  },

  // 关闭新生登记
  closeNewPopup() {
    this.setData({ showNewPopup: false });
  },

  // 点击未获取手机号 -> 展开老生接驳
  openOldVerification() {
    this.setData({ showOldPopup: true });
  },

  closeOldPopup() {
    this.setData({ showOldPopup: false });
  },

  // 通用表单处理
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

  handleOldInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`oldStudent.${field}`]: e.detail.value
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
        wx.showToast({ title: '已提交，待审核', icon: 'none', duration: 2000 });
        this.closeNewPopup();
      } else {
        wx.showToast({ title: res.msg || '提交失败', icon: 'none' });
      }
    } catch(e) {
      wx.hideLoading();
      wx.showToast({ title: '网络开小差了', icon: 'none' });
    }
  },

  async submitOld() {
    const { name, phone } = this.data.oldStudent;
    if (!name || phone.length < 11) {
      wx.showToast({ title: '请输入完整姓名且手机号不少于11位', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '验证并绑定中' });
    try {
      const res = await callCloudApi('bindExistingStudent', { name, phone });
      wx.hideLoading();
      if (res.success) {
        wx.showToast({ title: '绑定成功！', icon: 'success' });
        this.setData({ studentAssigned: true });
        this.closeOldPopup();
        if (app.vipCallback) app.vipCallback(true); // 让首页刷新
      } else {
        wx.showToast({ title: res.msg || '手机号与姓名不匹配', icon: 'none' });
      }
    } catch(e) {
      wx.hideLoading();
      wx.showToast({ title: '未部署云函数或网络超时', icon: 'none' });
    }
  },
  
  // 简易路由
  goLeave() {
    wx.navigateTo({ url: '/pages/leave/leave' });
  },
  
  alertWIP() {
    wx.showToast({ title: '系统暂未开放此功能', icon: 'none' });
  }
});
