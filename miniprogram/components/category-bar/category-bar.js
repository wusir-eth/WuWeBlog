Component({
  properties: {
    list: { type: Array, value: [] },
    active: { type: String, value: '' }
  },
  methods: {
    onSelect(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('change', { id });
    }
  }
});
