// 云函数 publish —— 新增 / 更新文章（按 openid 鉴权）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const ARTICLES = 'articles';

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

// 未填写摘要时，从正文中去除 HTML 标签截取前 60 字
function buildSummary(article) {
  if (article.summary) return article.summary;
  const plain = String(article.content || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > 60 ? plain.slice(0, 60) + '…' : plain;
}

exports.main = async (event) => {
  if (!(await isAdmin())) {
    return { ok: false, msg: '无权限' };
  }
  const { article } = event;
  if (!article || !article.title) {
    return { ok: false, msg: '标题不能为空' };
  }
  const now = new Date();

  if (article._id) {
    const updateData = {
      title: article.title,
      content: article.content || '',
      summary: buildSummary(article),
      categoryId: article.categoryId || '',
      tags: article.tags || [],
      coverImage: article.coverImage || '',
      status: article.status || 'published',
      updateTime: now
    };
    await db.collection(ARTICLES).doc(article._id).update({ data: updateData });
    return { ok: true, _id: article._id };
  }

  const data = {
    title: article.title,
    content: article.content || '',
    summary: article.summary || '',
    categoryId: article.categoryId || '',
    tags: article.tags || [],
    coverImage: article.coverImage || '',
    status: article.status || 'published',
    views: 0,
    createTime: now,
    updateTime: now
  };
  const res = await db.collection(ARTICLES).add({ data });
  return { ok: true, _id: res._id };
};
