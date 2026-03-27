// 备份恢复路由
const express = require('express');
const router = express.Router();
const { 
  getBackups, 
  createBackup, 
  restoreBackup, 
  deleteBackup 
} = require('../controllers/backupController');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');

// 获取备份列表
router.get('/', authMiddleware, permissionMiddleware('system:backup'), getBackups);

// 创建备份
router.post('/', authMiddleware, permissionMiddleware('system:backup'), createBackup);

// 恢复数据
router.post('/:id/restore', authMiddleware, permissionMiddleware('system:restore'), restoreBackup);

// 删除备份
router.delete('/:id', authMiddleware, permissionMiddleware('system:backup'), deleteBackup);

module.exports = router;