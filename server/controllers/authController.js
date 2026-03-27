// 认证控制器
const { User } = require('../models');
const { generateToken } = require('../middleware/auth');

// 用户登录
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 参数验证
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }
    
    // 查找用户
    const user = await User.findOne({
      where: {
        username
      }
    });
    
    // 用户不存在
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }
    
    // 用户被禁用
    if (user.status === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户已被禁用，请联系管理员'
      });
    }
    
    // 验证密码
    if (!user.validPassword(password)) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }
    
    // 更新最后登录时间
    await user.update({
      last_login_at: new Date()
    });
    
    // 生成token
    const token = generateToken(user);
    
    // 获取用户权限
    const permissions = await user.getPermissions();
    
    // 返回用户信息和token
    return res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          phone: user.phone,
          permissions
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 用户登出
const logout = async (req, res) => {
  try {
    // 在实际应用中，可能需要将token加入黑名单
    // 这里简单返回成功消息
    return res.json({
      code: 200,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    
    // 获取用户权限
    const permissions = await user.getPermissions();
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
        permissions
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser
};