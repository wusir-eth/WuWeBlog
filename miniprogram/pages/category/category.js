const cloud = require('../../utils/cloud.js');

Page({
  data: {
    title: '',
    categoryId: '',
    tag: '',
    articles: [],
    categories: [],
    categoryMap: {},
    page: 0,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  async onLoad(options) {
    const title = options.title ? decodeURIComponent(options.title) : '文章';
    wx.setNavigationBarTitle({ title });
    this.setData({
      title,
      categoryId: options.categoryId || '',
      tag: options.tag ? decodeURIComponent(options.tag) : ''
    });
    await this.loadCategories();
    await this.loadArticles(true);
  },

  async loadCategories() {
    try {
      const res = await cloud.getCategories();
      const map = {};
      res.data.forEach((c) => { map[c._id] = c.name; });
      this.setData({ categories: res.data, categoryMap: map });
    } catch (e) {
      console.error(e);
    }
  },

  async loadArticles(reset) {
    if (this.data.loading) return;
    if (reset) this.setData({ page: 0, hasMore: true, articles: [] });
    this.setData({ loading: true });
    try {
      const res = await cloud.getArticles({
        categoryId: this.data.categoryId,
        tag: this.data.tag,
        page: this.data.page,
        pageSize: this.data.pageSize
      });
      const list = res.data.map((a) => ({
        ...a,
        categoryName: this.data.categoryMap[a.categoryId] || ''
      }));
      const articles = reset ? list : this.data.articles.concat(list);
      this.setData({
        articles,
        page: this.data.page + 1,
        hasMore: list.length === this.data.pageSize,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onArticleTap(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.detail.id}` });
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadArticles(false);
  }
});
