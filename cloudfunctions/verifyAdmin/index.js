// 云函数 verifyAdmin —— 校验管理端访问码，通过后把调用者 openid 记入 admins 集合
//
// 访问码来源，按优先级：
//   1. 云函数环境变量 ADMIN_CODE（在云开发控制台配置，适合轮换）
//   2. 同目录下的 config.local.json（已 gitignore，随云函数部署上传）
// 两者都没有、或仍是示例占位值时，一律拒绝，不存在弱默认值。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const ADMINS = 'admins';
const PLACEHOLDER = 'PUT-YOUR-CODE-HERE';

function readAdminCode() {
  if (process.env.ADMIN_CODE) return String(process.env.ADMIN_CODE);
  try {
    const local = require('./config.local.json');
    if (local && local.adminCode) return String(local.adminCode);
  } catch (e) {
    // 文件不存在，走下面的拒绝分支
  }
  return '';
}

exports.main = async (event) => {
  const expected = readAdminCode();
  if (!expected) {
    console.error('[verifyAdmin] 未配置访问码：环境变量 ADMIN_CODE 与 config.local.json 均缺失');
    return { ok: false, msg: '服务端未配置访问码' };
  }
  if (expected === PLACEHOLDER) {
    console.error('[verifyAdmin] 访问码仍是示例占位值，请改成你自己的码');
    return { ok: false, msg: '服务端未配置访问码' };
  }
  if (String(event.code || '') !== expected) {
    return { ok: false, msg: '访问码错误' };
  }

  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return { ok: false, msg: '无法识别调用者' };
  }

  // 首次使用时集合尚不存在，已存在会抛错，忽略即可
  try {
    await db.createCollection(ADMINS);
  } catch (e) {
    // 已存在，正常
  }

  const existing = await db.collection(ADMINS).where({ openid: OPENID }).count();
  if (existing.total === 0) {
    await db.collection(ADMINS).add({ data: { openid: OPENID, createTime: new Date() } });
  }
  return { ok: true };
};
