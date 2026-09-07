// utils/cloud.js —— 云数据库 / 云函数调用封装
const db = wx.cloud.database();
const ARTICLES = 'articles';
const CATEGORIES = 'categories';

// 读取已发布文章（分页，列表不返回正文 content 以减小体积）
function getArticles({ categoryId = '', tag = '', page = 0, pageSize = 10 } = {}) {
  const cond = { status: 'published' };
  if (categoryId) cond.categoryId = categoryId;
  if (tag) cond.tags = tag; // 数组字段单值查询 = 包含该值
  return db.collection(ARTICLES)
    .where(cond)
    .field({ content: false })
    .orderBy('createTime', 'desc')
    .skip(page * pageSize)
    .limit(pageSize)
    .get();
}

function getArticleById(id) {
  return db.collection(ARTICLES).doc(id).get();
}

function getCategories() {
  return db.collection(CATEGORIES).orderBy('order', 'asc').get();
}

function getCategoryById(id) {
  return db.collection(CATEGORIES).doc(id).get();
}

// 云函数获取文章详情（绕过安全规则，真机兼容）
async function getArticleDetail(id) {
  const res = await wx.cloud.callFunction({
    name: 'getArticleDetail',
    data: { id }
  });
  if (!res.result.ok) {
    throw new Error(res.result.msg || '文章不存在或已下架');
  }
  return { data: res.result.data };
}

// 通用云函数调用
function callFunction(name, data = {}) {
  return wx.cloud.callFunction({ name, data });
}

module.exports = {
  db,
  ARTICLES,
  CATEGORIES,
  getArticles,
  getArticleById,
  getArticleDetail,
  getCategories,
  getCategoryById,
  callFunction
};
