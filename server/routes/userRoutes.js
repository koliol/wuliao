// 用户管理路由
const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  resetPassword 
} = require('../controllers/userController');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');

// 获取用户列表
router.get('/', authMiddleware, permissionMiddleware('user:view'), getUsers);

// 创建用户
router.post('/', authMiddleware, permissionMiddleware('user:create'), createUser);

// 更新用户
router.put('/:id', authMiddleware, permissionMiddleware('user:edit'), updateUser);

// 删除用户
router.delete('/:id', authMiddleware, permissionMiddleware('user:delete'), deleteUser);

// 重置密码
router.post('/:id/reset-password', authMiddleware, permissionMiddleware('user:reset_password'), resetPassword);

module.exports = router;