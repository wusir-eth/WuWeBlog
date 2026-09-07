// 云函数 manageCategory —— 分类增删改查（按 openid 鉴权）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const CATEGORIES = 'categories';

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
  const { action, category } = event;

  if (action === 'list') {
    const res = await db.collection(CATEGORIES).orderBy('order', 'asc').get();
    return { ok: true, list: res.data };
  }
  if (action === 'add') {
    const res = await db.collection(CATEGORIES).add({
      data: { name: category.name, order: category.order || 0 }
    });
    return { ok: true, _id: res._id };
  }
  if (action === 'update') {
    await db.collection(CATEGORIES).doc(category._id).update({
      data: { name: category.name, order: category.order || 0 }
    });
    return { ok: true };
  }
  if (action === 'delete') {
    await db.collection(CATEGORIES).doc(category._id).remove();
    return { ok: true };
  }
  return { ok: false, msg: '未知操作' };
};
