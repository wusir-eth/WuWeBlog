// 云函数 getArticleDetail —— 绕过安全规则获取文章详情
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const id = event.id;
  if (!id) {
    return { ok: false, msg: '缺少文章 ID' };
  }

  try {
    const res = await db.collection('articles').doc(String(id)).get();
    if (!res.data) {
      return { ok: false, msg: '文章不存在' };
    }
    return { ok: true, data: res.data };
  } catch (e) {
    console.error('[getArticleDetail] db error:', e);
    return { ok: false, msg: e.message || '查询失败' };
  }
};
