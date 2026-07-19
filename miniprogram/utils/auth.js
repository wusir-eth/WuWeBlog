// utils/auth.js —— 管理端访问码校验与本地登录态
const TOKEN_KEY = 'wwb_admin_token';

// 调用云函数校验访问码，成功后缓存 token
function verify(code) {
  return wx.cloud.callFunction({ name: 'verifyAdmin', data: { code } })
    .then((res) => {
      const result = res.result || {};
      if (result.ok && result.token) {
        wx.setStorageSync(TOKEN_KEY, result.token);
      }
      return result;
    })
    .catch((err) => {
      console.error('verifyAdmin 调用失败', err);
      return { ok: false, msg: '云函数调用失败，请确认 verifyAdmin 已上传部署' };
    });
}

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || '';
}

function isLoggedIn() {
  return !!getToken();
}

function logout() {
  wx.removeStorageSync(TOKEN_KEY);
}

module.exports = { verify, getToken, isLoggedIn, logout };
