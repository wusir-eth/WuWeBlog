const cloud = require('../../utils/cloud.js');
const { excerpt } = require('../../utils/format.js');

Page({
  data: {
    articles: [],
    categories: [],
    categoryMap: {},
    activeCategory: '',
    hotTags: [],
    page: 0,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  async onLoad() {
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
      console.error('加载分类失败', e);
    }
  },

  async loadArticles(reset) {
    if (this.data.loading) return;
    if (reset) {
      this.setData({ page: 0, hasMore: true, articles: [] });
    }
    this.setData({ loading: true });
    try {
      const res = await cloud.getArticles({
        categoryId: this.data.activeCategory,
        page: this.data.page,
        pageSize: this.data.pageSize
      });
      const list = res.data.map((a) => ({
        ...a,
        categoryName: this.data.categoryMap[a.categoryId] || '',
        summary: a.summary || excerpt(a.content, 60)
      }));
      const articles = reset ? list : this.data.articles.concat(list);
      this.setData({
        articles,
        page: this.data.page + 1,
        hasMore: list.length === this.data.pageSize,
        loading: false
      });
      if (reset) this.refreshHotTags();
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  refreshHotTags() {
    const tagSet = {};
    this.data.articles.forEach((a) => (a.tags || []).forEach((t) => { tagSet[t] = true; }));
    this.setData({ hotTags: Object.keys(tagSet).slice(0, 12) });
  },

  onCategoryChange(e) {
    this.setData({ activeCategory: e.detail.id });
    this.loadArticles(true);
  },

  onTagSelect(e) {
    const tag = e.detail.tag;
    wx.navigateTo({
      url: `/pages/category/category?tag=${encodeURIComponent(tag)}&title=${encodeURIComponent(tag)}`
    });
  },

  onArticleTap(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.detail.id}` });
  },

  onPullDownRefresh() {
    Promise.all([this.loadCategories(), this.loadArticles(true)]).then(() =>
      wx.stopPullDownRefresh()
    );
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadArticles(false);
  }
});
