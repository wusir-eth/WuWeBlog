// 云函数 seedData —— 一次性灌入初始内容（西语课堂·阿根廷）
//
// 存在的理由：云开发控制台的 JSON 导入不接受 {"$date": ...} 这类扩展语法，
// 直接导 ISO 字符串又会让 createTime 变成 string，与 publish 写入的真 Date
// 混在一起，orderBy('createTime','desc') 会按类型分组排序导致顺序错乱。
// 在云函数里写入才能保证是真正的 Date 类型。
//
// 用完即删：控制台 云函数 → seedData → 删除，并从仓库移除本目录。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const seed = require('./data.json');

const CONFIRM = 'SEED-ARGENTINA';

async function ensure(name) {
  try {
    await db.createCollection(name);
  } catch (e) {
    // 已存在，正常
  }
}

exports.main = async (event) => {
  // 只认显式确认串，避免被误触发
  if (event.confirm !== CONFIRM) {
    return { ok: false, msg: `需要传入 { "confirm": "${CONFIRM}" }` };
  }

  await ensure('articles');
  await ensure('categories');

  const report = { categories: { added: 0, skipped: 0 }, articles: { added: 0, skipped: 0 } };

  for (const c of seed.categories) {
    const exists = await db.collection('categories').where({ _id: c._id }).count();
    if (exists.total > 0) { report.categories.skipped++; continue; }
    await db.collection('categories').add({ data: { ...c } });
    report.categories.added++;
  }

  for (const a of seed.articles) {
    const exists = await db.collection('articles').where({ _id: a._id }).count();
    if (exists.total > 0) { report.articles.skipped++; continue; }
    await db.collection('articles').add({
      data: {
        ...a,
        // ★ 关键：字符串转成真正的 Date，与 publish 写入的类型保持一致
        createTime: new Date(a.createTime),
        updateTime: new Date(a.updateTime)
      }
    });
    report.articles.added++;
  }

  // 回报实际类型，便于确认没写成字符串
  const sample = await db.collection('articles').limit(1).get();
  const t = sample.data[0] && sample.data[0].createTime;
  report.createTimeType = t instanceof Date ? 'Date ✓' : typeof t;

  return { ok: true, report };
};
