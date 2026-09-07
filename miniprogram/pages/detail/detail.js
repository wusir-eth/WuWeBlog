const cloud = require('../../utils/cloud.js');
const { formatDate } = require('../../utils/format.js');

Page({
  data: {
    article: null,
    loading: true,
    categoryName: '',
    date: '',
    showTop: false
  },

  // 防止 onLoad 被真机重复触发导致覆盖
  _loaded: false,

  async onLoad(options) {
    if (this._loaded) return;
    const id = options.id;
    // 拒绝空值和字符串 "undefined"（真机可能传字符串）
    // 不操作 UI，避免在首次异步返回前改 loading 导致闪现空状态
    if (!id || id === 'undefined') {
      this._loaded = true;
      return;
    }
    try {
      const res = await cloud.getArticleDetail(id);
      const a = res.data;
      if (!a) {
        this._loaded = true;
        this.setData({ loading: false });
        return;
      }
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
        loading: false,
        categoryName,
        date: formatDate(a.createTime),
        'article.views': views + 1
      });
      this._loaded = true;
      // 服务端原子自增阅读量（fire-and-forget，吞掉异常避免影响页面）
      cloud.callFunction('incViews', { id }).catch(() => {});
    } catch (e) {
      this._loaded = true;
      this.setData({ loading: false });
      console.error('[detail] 加载文章失败', e);
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
