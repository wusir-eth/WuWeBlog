const cloud = require('../../utils/cloud.js');

Page({
  data: {
    categories: [],
    hotTags: []
  },

  async onLoad() {
    await this.loadCategories();
    await this.loadTags();
  },

  async loadCategories() {
    try {
      const res = await cloud.getCategories();
      this.setData({ categories: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  // 聚合已发布文章的标签作为热门标签
  async loadTags() {
    try {
      const res = await cloud.getArticles({ page: 0, pageSize: 50 });
      const set = {};
      res.data.forEach((a) => (a.tags || []).forEach((t) => { set[t] = true; }));
      this.setData({ hotTags: Object.keys(set).slice(0, 20) });
    } catch (e) {
      console.error(e);
    }
  },

  onCategoryTap(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/category/category?categoryId=${id}&title=${encodeURIComponent(name)}`
    });
  },

  onTagSelect(e) {
    const tag = e.detail.tag;
    wx.navigateTo({
      url: `/pages/category/category?tag=${encodeURIComponent(tag)}&title=${encodeURIComponent(tag)}`
    });
  }
});
