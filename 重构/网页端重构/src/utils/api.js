import axios from 'axios';

// 拦截并注入全局鉴权
const createPayload = (action, params = {}) => {
  const _callerPhone = localStorage.getItem('_callerPhone') || '';
  const _callerPassword = localStorage.getItem('_callerPassword') || '';
  
  return {
    action,
    _callerPhone,
    _callerPassword,
    ...params
  };
};

/**
 * 模拟调用微信云环境的 tcb.app.callFunction
 * 将来可以直接替换为 tcb-js-sdk 调用
 */
export async function callAdminOperate(action, params = {}) {
  const payload = createPayload(action, params);
  
  // 真实环境中：
  // return await tcb.app.callFunction({ name: 'adminOperate', data: payload })

  // 由于处于本地重构阶段，可以临时使用 axios 访问本地起的 node wrapper 
  // 或者在此根据 action 前端 mock 响应，等待对接。
  console.log(`[RPC] Calling adminOperate -> ${action}`, payload);
  
  try {
    // 假设有一个本地调试服务桥接到了云函数
    const response = await axios.post('http://127.0.0.1:3001/adminOperate', payload);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
