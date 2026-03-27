// 出入库操作路由
const express = require('express');
const router = express.Router();
const { 
  getTransactions, 
  inbound, 
  outbound, 
  transfer 
} = require('../controllers/transactionController');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');

// 获取出入库记录
router.get('/', authMiddleware, permissionMiddleware('transaction:view'), getTransactions);

// 入库操作
router.post('/inbound', authMiddleware, permissionMiddleware('transaction:inbound'), inbound);

// 出库操作
router.post('/outbound', authMiddleware, permissionMiddleware('transaction:outbound'), outbound);

// 调拨操作
router.post('/transfer', authMiddleware, permissionMiddleware('transaction:transfer'), transfer);

module.exports = router;