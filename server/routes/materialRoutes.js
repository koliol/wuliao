// 物料管理路由
const express = require('express');
const router = express.Router();
const { 
  getMaterials, 
  createMaterial, 
  updateMaterial, 
  deleteMaterial,
  getMaterialCategories
} = require('../controllers/materialController');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');

// 获取物料列表
router.get('/', authMiddleware, permissionMiddleware('material:view'), getMaterials);

// 创建物料
router.post('/', authMiddleware, permissionMiddleware('material:create'), createMaterial);

// 更新物料
router.put('/:id', authMiddleware, permissionMiddleware('material:edit'), updateMaterial);

// 删除物料
router.delete('/:id', authMiddleware, permissionMiddleware('material:delete'), deleteMaterial);

// 获取物料分类
router.get('/categories', authMiddleware, permissionMiddleware('material:view'), getMaterialCategories);

module.exports = router;