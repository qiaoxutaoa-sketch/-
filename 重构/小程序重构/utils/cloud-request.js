// utils/cloud-request.js

/**
 * 封装前端发起对 adminOperate 的 RPC 请求
 */
export async function callCloudApi(action, params = {}) {
  try {
    console.log(`[RPC] calling ${action}`, params);
    const res = await wx.cloud.callFunction({
      name: 'adminOperate',
      data: {
        action,
        ...params
      }
    });

    console.log(`[RPC] ${action} result:`, res.result);

    // res.result { success: boolean, msg: string, ... }
    if (res.result && res.result.success) {
      return res.result;
    } else {
      let msgStr = '云端返回异常';
      if (res.result) {
        msgStr = res.result.msg || ('Result is completely missing msg: ' + JSON.stringify(res.result));
      } else {
        msgStr = '完全未收到 res.result: ' + JSON.stringify(res);
      }
      return Promise.reject(new Error(msgStr));
    }
  } catch (error) {
    wx.showToast({
      title: '网络或云服务异常',
      icon: 'none'
    });
    console.error(`[RPC Error] ${action}: `, error);
    return Promise.reject(error);
  }
}
