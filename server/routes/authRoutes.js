// 认证路由
const express = require('express');
const router = express.Router();
const { login, logout, getCurrentUser } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// 登录
router.post('/login', login);

// 登出
router.post('/logout', authMiddleware, logout);

// 获取当前用户信息
router.get('/current', authMiddleware, getCurrentUser);

module.exports = router;