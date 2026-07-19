// 云函数 verifyAdmin —— 校验管理端访问码
// 注意：访问码在服务端比对，不会暴露在前端代码中被篡改。
const ADMIN_CODE = '123456'; // TODO: 请修改为你的专属访问码
const ADMIN_TOKEN = 'wwb-admin-token-2026';

exports.main = async (event) => {
  const { code } = event;
  if (code === ADMIN_CODE) {
    return { ok: true, token: ADMIN_TOKEN };
  }
  return { ok: false, msg: '访问码错误' };
};
