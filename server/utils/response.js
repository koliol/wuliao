// 统一响应工具
const success = (res, message = '操作成功', data = null) => {
  return res.json({
    code: 200,
    message,
    data
  });
};

const error = (res, code = 500, message = '服务器内部错误') => {
  return res.status(code).json({
    code,
    message
  });
};

const badRequest = (res, message = '请求参数错误') => {
  return error(res, 400, message);
};

const unauthorized = (res, message = '未授权，请先登录') => {
  return error(res, 401, message);
};

const forbidden = (res, message = '权限不足，无法执行此操作') => {
  return error(res, 403, message);
};

const notFound = (res, message = '资源不存在') => {
  return error(res, 404, message);
};

module.exports = {
  success,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound
};