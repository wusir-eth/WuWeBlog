const cloud = require('../../utils/cloud.js');
const auth = require('../../utils/auth.js');

Page({
  data: {
    tab: 'articles',
    articles: [],
    categories: [],
    catIndex: -1,
    showEditor: false,
    editingId: '',
    form: { title: '', tagsText: '', coverImage: '', content: '' },
    showCatEditor: false,
    editingCatId: '',
    catForm: { name: '', order: '0' }
  },

  onShow() {
    if (!auth.isLoggedIn()) {
      wx.showToast({ title: '请先在「我的」验证访问码', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1200);
      return;
    }
    this.loadArticles();
    this.loadCategories();
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  async loadArticles() {
    const res = await cloud.callFunction('listArticles', {});
    if (res.result && res.result.ok) {
      this.setData({ articles: res.result.list });
    }
  },

  onNewArticle() {
    this.setData({
      showEditor: true,
      editingId: '',
      catIndex: -1,
      form: { title: '', tagsText: '', coverImage: '', content: '' }
    });
  },

  onEditArticle(e) {
    const id = e.currentTarget.dataset.id;
    const a = this.data.articles.find((x) => x._id === id);
    if (!a) return;
    const catIndex = this.data.categories.findIndex((c) => c._id === a.categoryId);
    this.setData({
      showEditor: true,
      editingId: id,
      catIndex,
      form: {
        title: a.title,
        tagsText: (a.tags || []).join(','),
        coverImage: a.coverImage || '',
        content: a.content || ''
      }
    });
  },

  closeEditor() {
    this.setData({ showEditor: false });
  },

  onFormInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  onCatChange(e) {
    this.setData({ catIndex: Number(e.detail.value) });
  },

  async onChooseCover() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      });
      const file = res.tempFiles[0].tempFilePath;
      const m = file.match(/\.(\w+)$/);
      const ext = m ? m[1] : 'png';
      const cloudPath = 'cover/' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.' + ext;
      wx.showLoading({ title: '上传中' });
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: file });
      wx.hideLoading();
      if (up.fileID) {
        this.setData({ 'form.coverImage': up.fileID });
        wx.showToast({ title: '封面上传成功', icon: 'success' });
      } else {
        wx.showToast({ title: '上传失败：未返回 fileID', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('封面上传失败', e);
      wx.showToast({ title: '上传失败：' + (e.errMsg || '未知错误'), icon: 'none' });
    }
  },

  async submit(status) {
    const form = this.data.form;
    const catIndex = this.data.catIndex;
    const categories = this.data.categories;
    const editingId = this.data.editingId;
    if (!form.title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' });
      return;
    }
    const categoryId = catIndex >= 0 ? categories[catIndex]._id : '';
    const tags = form.tagsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const article = {
      title: form.title.trim(),
      content: form.content,
      categoryId,
      tags,
      coverImage: form.coverImage,
      status
    };
    if (editingId) article._id = editingId;
    wx.showLoading({ title: '发布中…首次稍慢' });
    try {
      const res = await cloud.callFunction('publish', { article });
      wx.hideLoading();
      if (res.result && res.result.ok) {
        wx.showToast({ title: '已保存', icon: 'success' });
        this.setData({ showEditor: false });
        this.loadArticles();
      } else {
        wx.showToast({ title: (res.result && res.result.msg) || '失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('发布失败', e);
      wx.showToast({ title: '发布异常：' + (e.errMsg || '云函数错误'), icon: 'none' });
    }
  },

  onSaveDraft() {
    this.submit('draft');
  },

  onPublish() {
    this.submit('published');
  },

  onDeleteArticle(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: async (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: '删除中' });
        const res = await cloud.callFunction('removeArticle', { id });
        wx.hideLoading();
        if (res.result && res.result.ok) {
          wx.showToast({ title: '已删除', icon: 'success' });
          this.loadArticles();
        } else {
          wx.showToast({ title: '失败', icon: 'none' });
        }
      }
    });
  },

  async loadCategories() {
    const res = await cloud.callFunction('manageCategory', { action: 'list' });
    if (res.result && res.result.ok) {
      this.setData({ categories: res.result.list });
    }
  },

  onNewCategory() {
    this.setData({
      showCatEditor: true,
      editingCatId: '',
      catForm: { name: '', order: '0' }
    });
  },

  onEditCategory(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    const order = e.currentTarget.dataset.order;
    this.setData({
      showCatEditor: true,
      editingCatId: id,
      catForm: { name, order: String(order || 0) }
    });
  },

  closeCatEditor() {
    this.setData({ showCatEditor: false });
  },

  onCatInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['catForm.' + field]: e.detail.value });
  },

  async onSaveCategory() {
    const catForm = this.data.catForm;
    const editingCatId = this.data.editingCatId;
    if (!catForm.name.trim()) {
      wx.showToast({ title: '请填写名称', icon: 'none' });
      return;
    }
    const category = { name: catForm.name.trim(), order: Number(catForm.order) || 0 };
    if (editingCatId) category._id = editingCatId;
    wx.showLoading({ title: '保存中' });
    const res = await cloud.callFunction('manageCategory', {
      action: editingCatId ? 'update' : 'add',
      category
    });
    wx.hideLoading();
    if (res.result && res.result.ok) {
      wx.showToast({ title: '已保存', icon: 'success' });
      this.setData({ showCatEditor: false });
      this.loadCategories();
    } else {
      wx.showToast({ title: '失败', icon: 'none' });
    }
  },

  onDeleteCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除分类不会删除文章',
      success: async (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: '删除中' });
        const res = await cloud.callFunction('manageCategory', {
          action: 'delete',
          category: { _id: id }
        });
        wx.hideLoading();
        if (res.result && res.result.ok) {
          wx.showToast({ title: '已删除', icon: 'success' });
          this.loadCategories();
        } else {
          wx.showToast({ title: '失败', icon: 'none' });
        }
      }
    });
  }
});
