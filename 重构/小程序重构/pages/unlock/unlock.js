// pages/unlock/unlock.js
import { callCloudApi } from '../../utils/cloud-request';

Page({
  data: {},
  
  onLoad: async function (options) {
    // 必须有特定的 scene 参数，否则静默不管
    const scene = options.scene;
    
    if (scene) {
      wx.showLoading({ title: 'System Activating...' });
      try {
        const res = await callCloudApi('activateVIP', { scene });
        wx.hideLoading();
        
        if (res.success) {
          wx.showToast({
            title: 'Welcome, Authorized User.',
            icon: 'none'
          });
          // 写入缓存并重启小程序生命周期
          getApp().globalData.isVip = true;
          
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' });
          }, 1000);
        } else {
          // 激活失败直接踢回大厅
          wx.reLaunch({ url: '/pages/index/index' });
        }
      } catch (e) {
        wx.hideLoading();
        wx.reLaunch({ url: '/pages/index/index' });
      }
    } else {
      // 没有任何参数被随便访问，当无事发生，踢回首页
      wx.reLaunch({ url: '/pages/index/index' });
    }
  }
});
