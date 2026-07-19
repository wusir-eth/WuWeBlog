// utils/format.js —— 格式化工具
function formatDate(ts) {
  if (!ts) return '';
  const d = ts instanceof Date ? ts : new Date(ts);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 去除 HTML 标签并截取摘要
function excerpt(html, len = 60) {
  if (!html) return '';
  const plain = String(html)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > len ? plain.slice(0, len) + '…' : plain;
}

function joinTags(tags) {
  if (!tags || !tags.length) return '';
  return tags.join(' · ');
}

module.exports = { formatDate, excerpt, joinTags };
