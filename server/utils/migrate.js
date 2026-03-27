// 数据库迁移脚本
const { sequelize } = require('../config/db');
const {
  User,
  Category,
  Material,
  Warehouse,
  Inventory,
  Transaction,
  Backup
} = require('../models');

async function migrate() {
  try {
    console.log('开始数据库迁移...');
    
    // 自动创建表
    await sequelize.sync({ force: false }); // force: false 不会删除现有表
    
    console.log('数据库迁移完成！');
    console.log('创建的表:');
    console.log('- users (用户表)');
    console.log('- categories (物料分类表)');
    console.log('- materials (物料表)');
    console.log('- warehouses (仓库表)');
    console.log('- inventories (库存表)');
    console.log('- transactions (出入库记录表)');
    console.log('- backups (备份表)');
    
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();