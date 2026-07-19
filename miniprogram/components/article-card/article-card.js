Component({
  properties: {
    id: String,
    title: String,
    summary: String,
    coverImage: String,
    categoryName: String,
    tags: { type: Array, value: [] },
    views: { type: Number, value: 0 }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.data.id });
    }
  }
});
