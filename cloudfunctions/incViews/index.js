// 云函数 incViews —— 阅读量原子自增（防并发覆盖）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { id } = event;
  if (!id) return { ok: false, msg: '缺少 id' };
  await db.collection('articles').doc(id).update({
    data: { views: _.inc(1) }
  });
  return { ok: true };
};
