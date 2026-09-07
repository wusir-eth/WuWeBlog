Component({
  properties: {
    articleId: String,
    title: String,
    summary: String,
    coverImage: String,
    categoryName: String,
    tags: { type: Array, value: [] },
    views: { type: Number, value: 0 }
  },
  methods: {
    onTap() {
      // 真机 hover-class 可能导致 bindtap 触发两次，加节流
      if (this._tapping) return;
      this._tapping = true;
      this.triggerEvent('tap', { id: this.data.articleId });
      setTimeout(() => { this._tapping = false; }, 500);
    }
  }
});
