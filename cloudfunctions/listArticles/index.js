// 云函数 listArticles —— 管理端列出全部文章（含草稿，按 openid 鉴权）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 调用者是否已在 admins 集合中登记（由 verifyAdmin 写入）
async function isAdmin() {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return false;
  try {
    const res = await db.collection('admins').where({ openid: OPENID }).count();
    return res.total > 0;
  } catch (e) {
    return false;
  }
}

exports.main = async (event) => {
  if (!(await isAdmin())) {
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
