// 云函数 listArticles —— 管理端列出全部文章（含草稿，需 token 鉴权）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const ADMIN_TOKEN = 'wwb-admin-token-2026';

exports.main = async (event) => {
  if (event.token !== ADMIN_TOKEN) {
    return { ok: false, msg: '无权限' };
  }
  const cond = {};
  if (event.status) cond.status = event.status;
  const res = await db
    .collection('articles')
    .where(cond)
    .orderBy('createTime', 'desc')
    .limit(100)
    .get();
  return { ok: true, list: res.data };
};
