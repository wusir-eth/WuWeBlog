const cloud = require('../../utils/cloud.js');
const { formatDate } = require('../../utils/format.js');

Page({
  data: {
    article: null,
    categoryName: '',
    date: '',
    showTop: false
  },

  async onLoad(options) {
    const id = options.id;
    if (!id) return;
    try {
      const res = await cloud.getArticleById(id);
      const a = res.data;
      // 让富文本中的图片自适应宽度
      a.content = (a.content || '').replace(
        /<img/g,
        '<img style="max-width:100%;height:auto;display:block;margin:16rpx 0;border-radius:12rpx"'
      );
      let categoryName = '';
      try {
        const c = await cloud.getCategoryById(a.categoryId);
        categoryName = c.data.name;
      } catch (e) { /* 分类可能已删除 */ }

      const views = a.views || 0;
      this.setData({
        article: a,
        categoryName,
        date: formatDate(a.createTime),
        'article.views': views + 1
      });
      // 服务端原子自增阅读量
      cloud.callFunction('incViews', { id });
    } catch (e) {
      console.error('加载文章失败', e);
    }
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag;
    wx.navigateTo({
      url: `/pages/category/category?tag=${encodeURIComponent(tag)}&title=${encodeURIComponent(tag)}`
    });
  },

  onPageScroll(e) {
    this.setData({ showTop: e.scrollTop > 400 });
  },

  onBackTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  }
});
