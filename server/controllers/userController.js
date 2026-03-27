// 用户管理控制器
const { User } = require('../models');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// 获取用户列表
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '', role = '' } = req.query;
    
    // 构建查询条件
    const where = {};
    
    if (keyword) {
      where[Sequelize.Op.or] = [
        { username: { [Sequelize.Op.like]: `%${keyword}%` } },
        { name: { [Sequelize.Op.like]: `%${keyword}%` } },
        { email: { [Sequelize.Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    // 查询用户列表
    const { count, rows } = await User.findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
      attributes: {
        exclude: ['password']
      }
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        total: count,
        items: rows
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 创建用户
const createUser = async (req, res) => {
  try {
    const { username, password, name, email, role, phone } = req.body;
    
    // 参数验证
    if (!username || !password || !name) {
      return res.status(400).json({
        code: 400,
        message: '用户名、密码和姓名不能为空'
      });
    }
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      where: {
        username
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      });
    }
    
    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await User.findOne({
        where: {
          email
        }
      });
      
      if (existingEmail) {
        return res.status(400).json({
          code: 400,
          message: '邮箱已存在'
        });
      }
    }
    
    // 创建用户
    const user = await User.create({
      username,
      password,
      name,
      email,
      role,
      phone,
      created_by: req.userId,
      updated_by: req.userId
    });
    
    // 不返回密码
    const userData = user.toJSON();
    delete userData.password;
    
    return res.json({
      code: 200,
      message: '创建成功',
      data: userData
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 更新用户
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, status } = req.body;
    
    // 查找用户
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    
    // 检查邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({
        where: {
          email,
          id: { [Sequelize.Op.ne]: id }
        }
      });
      
      if (existingEmail) {
        return res.status(400).json({
          code: 400,
          message: '邮箱已被其他用户使用'
        });
      }
    }
    
    // 更新用户信息
    await user.update({
      name,
      email,
      role,
      phone,
      status,
      updated_by: req.userId
    });
    
    // 不返回密码
    const userData = user.toJSON();
    delete userData.password;
    
    return res.json({
      code: 200,
      message: '更新成功',
      data: userData
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 删除用户
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找用户
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    
    // 不允许删除自己
    if (user.id === req.userId) {
      return res.status(400).json({
        code: 400,
        message: '不能删除当前登录用户'
      });
    }
    
    // 不允许删除系统管理员
    if (user.role === 'admin') {
      return res.status(400).json({
        code: 400,
        message: '不能删除系统管理员'
      });
    }
    
    // 删除用户
    await user.destroy();
    
    return res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 重置密码
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    // 参数验证
    if (!newPassword) {
      return res.status(400).json({
        code: 400,
        message: '新密码不能为空'
      });
    }
    
    // 查找用户
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    return res.json({
      code: 200,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword
};