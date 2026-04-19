import cloudbase from '@cloudbase/js-sdk';

// Initialize the TCB app with the production environment
export const app = cloudbase.init({
  env: 'cloud1-1gh9yp0ib85d4b4b' 
});

// Configure auth
const auth = app.auth({ persistence: 'local' });

// Ensure anonymous login before calling functions to avoid permission errors
async function ensureAuth() {
  if (!auth.hasLoginState()) {
    try {
      await auth.anonymousAuthProvider().signIn();
    } catch(err) {
      console.warn('TCB Anonymous Auth Failed (may need domain whitelist config):', err);
    }
  }
}

// 提取公共权限判断，增加绝对容错（防止缓存导致超管被锁）
export function checkIsAdmin() {
  const role = localStorage.getItem('_userRole');
  if (role === 'admin' || role === '"admin"') return true;
  return false;
}

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
 * 真实调用微信云环境的 tcb.app.callFunction
 */
export async function callAdminOperate(action, params = {}) {
  const payload = createPayload(action, params);
  
  console.log(`[RPC] Calling adminOperate -> ${action}`);
  await ensureAuth();
  
  try {
    const response = await app.callFunction({
      name: 'adminOperate',
      data: payload
    });
    return response.result;
  } catch (error) {
    console.error(`[RPC] ERROR in ${action}:`, error);
    throw error;
  }
}
