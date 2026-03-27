// 库存管理路由
const express = require('express');
const router = express.Router();
const { 
  getInventory, 
  adjustInventory, 
  getInventoryWarnings 
} = require('../controllers/inventoryController');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');

// 获取库存列表
router.get('/', authMiddleware, permissionMiddleware('inventory:view'), getInventory);

// 调整库存
router.post('/:id/adjust', authMiddleware, permissionMiddleware('inventory:adjust'), adjustInventory);

// 获取库存预警
router.get('/warnings', authMiddleware, permissionMiddleware('inventory:view'), getInventoryWarnings);

module.exports = router;