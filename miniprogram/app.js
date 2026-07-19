// app.js
App({
  globalData: {
    // 请将此处替换为你在「云开发控制台」获取的环境 ID（形如 cloud1-xxxx）
    cloudEnv: 'cloud1-d5gy6021b6ac347c2',
    // 分类缓存，减少重复查询
    categories: []
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库不支持云开发，请使用 2.2.3 或以上的基础库');
      return;
    }
    wx.cloud.init({
      env: this.globalData.cloudEnv,
      traceUser: true
    });
  }
});
