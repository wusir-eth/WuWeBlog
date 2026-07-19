const auth = require('../../utils/auth.js');

Page({
  data: {
    logged: false,
    code: '',
    error: ''
  },

  onShow() {
    this.setData({ logged: auth.isLoggedIn() });
  },

  onInput(e) {
    this.setData({ code: e.detail.value });
  },

  async onVerify() {
    if (!this.data.code) {
      this.setData({ error: '请输入访问码' });
      return;
    }
    wx.showLoading({ title: '验证中' });
    try {
      const res = await auth.verify(this.data.code);
      if (res.ok) {
        this.setData({ logged: true, error: '', code: '' });
        wx.showToast({ title: '验证成功', icon: 'success' });
      } else {
        this.setData({ error: res.msg || '访问码错误' });
      }
    } catch (e) {
      console.error('验证异常', e);
      this.setData({ error: '验证异常，请检查云函数部署' });
    } finally {
      wx.hideLoading();
    }
  },

  onEnterAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' });
  },

  onLogout() {
    auth.logout();
    this.setData({ logged: false });
  }
});
