Component({
  properties: {
    tags: { type: Array, value: [] }
  },
  methods: {
    onTap(e) {
      this.triggerEvent('select', { tag: e.currentTarget.dataset.tag });
    }
  }
});
