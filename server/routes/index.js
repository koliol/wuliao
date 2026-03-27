// 路由索引文件
const express = require('express');
const router = express.Router();

// 导入路由
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const categoryRoutes = require('./categoryRoutes');
const materialRoutes = require('./materialRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const transactionRoutes = require('./transactionRoutes');
const backupRoutes = require('./backupRoutes');

// 注册路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/materials', materialRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/backups', backupRoutes);

module.exports = router;