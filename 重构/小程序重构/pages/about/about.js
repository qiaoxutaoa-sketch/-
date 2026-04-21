// pages/about/about.js
Page({
  callPhone() {
    wx.makePhoneCall({
      phoneNumber: '16678702390'
    });
  },

  openLocation() {
    wx.openLocation({
      latitude: 36.3037,
      longitude: 120.3956,
      name: '青九艺术',
      address: '城阳实验二小东50米',
      scale: 18
    });
  }
});
