// utils/auth.js —— 管理端访问码校验与本地登录态
// 真正的鉴权在云函数侧按 openid 判定，这里的标记仅用于控制界面显示，伪造它拿不到任何权限。
const FLAG_KEY = 'wwb_admin_logged';

// 调用云函数校验访问码，通过后云端登记 openid
function verify(code) {
  return wx.cloud.callFunction({ name: 'verifyAdmin', data: { code } })
    .then((res) => {
      const result = res.result || {};
      if (result.ok) {
        wx.setStorageSync(FLAG_KEY, 1);
      }
      return result;
    })
    .catch((err) => {
      console.error('verifyAdmin 调用失败', err);
      return { ok: false, msg: '云函数调用失败，请确认 verifyAdmin 已上传部署' };
    });
}

function isLoggedIn() {
  return !!wx.getStorageSync(FLAG_KEY);
}

function logout() {
  wx.removeStorageSync(FLAG_KEY);
}

module.exports = { verify, isLoggedIn, logout };
