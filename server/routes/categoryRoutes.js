// 分类管理路由
const express = require('express');
const router = express.Router();
const { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  getCategoryTree 
} = require('../controllers/categoryController');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');

// 获取分类列表
router.get('/', authMiddleware, permissionMiddleware('category:view'), getCategories);

// 创建分类
router.post('/', authMiddleware, permissionMiddleware('category:create'), createCategory);

// 更新分类
router.put('/:id', authMiddleware, permissionMiddleware('category:edit'), updateCategory);

// 删除分类
router.delete('/:id', authMiddleware, permissionMiddleware('category:delete'), deleteCategory);

// 获取分类树
router.get('/tree', authMiddleware, getCategoryTree);

module.exports = router;