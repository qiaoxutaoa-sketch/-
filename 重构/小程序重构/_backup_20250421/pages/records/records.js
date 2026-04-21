// pages/records/records.js
import { callCloudApi } from '../../utils/cloud-request';

const app = getApp();

Page({
  data: {
    isVip: false,
    loading: true,
    records: [],
    studentId: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ studentId: options.id });
    }
  },

  onShow() {
    const vip = app.globalData.isVip;
    this.setData({ isVip: vip });
    if (vip) {
      this.fetchRecords();
    } else {
      this.setData({ loading: false });
    }
  },

  onPullDownRefresh() {
    if (this.data.isVip) {
      this.fetchRecords().then(() => wx.stopPullDownRefresh());
    } else {
      wx.stopPullDownRefresh();
    }
  },

  async fetchRecords() {
    if (!this.data.studentId) {
       this.setData({ loading: false });
       return;
    }
    this.setData({ loading: true });
    try {
      const res = await callCloudApi('getMyRecords', { studentId: this.data.studentId });
      if (res.success) {
        const normalized = (res.data || []).map(r => {
          if (typeof r.artwork === 'string' && r.artwork.length > 0) {
            r.artwork = [r.artwork];
          }
          return r;
        });
        this.setData({
          records: normalized,
          loading: false
        });
      } else {
        this.setData({ loading: false });
      }
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  previewImage(e) {
    const { url, urls } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: urls
    });
  }
});
