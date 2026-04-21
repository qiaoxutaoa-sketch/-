// app.js
App({
  onLaunch: async function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-1gh9yp0ib85d4b4b',
        traceUser: true
      });
      // 静默探测用户VIP权限
      this.checkVIPStatus();
    }
  },

  checkVIPStatus: async function() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'adminOperate',
        data: { action: 'checkVIP' }
      });
      
      if (res.result && res.result.success && res.result.isVIP === true) {
        this.globalData.isVip = true;
        // 如果当前处在首页，触发重新渲染
        if (this.vipCallback) {
          this.vipCallback(true);
        }
      } else {
        this.globalData.isVip = false;
      }
    } catch (e) {
      console.error('VIP探测由于网络等原因失败，默认关闭展厅隔离状态', e);
      this.globalData.isVip = false;
    }
  },

  globalData: {
    isVip: false
  }
});
