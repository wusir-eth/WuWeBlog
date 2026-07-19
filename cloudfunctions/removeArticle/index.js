// 云函数 removeArticle —— 删除文章（需 token 鉴权）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const ADMIN_TOKEN = 'wwb-admin-token-2026';

exports.main = async (event) => {
  if (event.token !== ADMIN_TOKEN) {
    return { ok: false, msg: '无权限' };
  }
  const { id } = event;
  if (!id) return { ok: false, msg: '缺少 id' };
  await db.collection('articles').doc(id).remove();
  return { ok: true };
};
