// JWT认证中间件
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// 生成JWT token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// JWT认证中间件
const authMiddleware = async (req, res, next) => {
  try {
    // 获取Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未授权，请先登录'
      });
    }
    
    // 提取token
    const token = authHeader.split(' ')[1];
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 获取用户信息
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }
    
    if (user.status === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户已被禁用'
      });
    }
    
    // 将用户信息存储到请求对象中
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: 'token已过期'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: 'token无效'
      });
    } else {
      console.error('认证错误:', error);
      return res.status(500).json({
        code: 500,
        message: '服务器内部错误'
      });
    }
  }
};

// 权限控制中间件
const permissionMiddleware = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      // 获取用户权限
      const permissions = await user.getPermissions();
      
      // 检查用户是否有权限
      if (!permissions.includes(requiredPermission)) {
        return res.status(403).json({
          code: 403,
          message: '权限不足，无法执行此操作'
        });
      }
      
      next();
    } catch (error) {
      console.error('权限检查错误:', error);
      return res.status(500).json({
        code: 500,
        message: '服务器内部错误'
      });
    }
  };
};

module.exports = {
  generateToken,
  authMiddleware,
  permissionMiddleware
};