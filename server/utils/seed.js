// 数据库种子脚本 - 初始化基础数据
const { sequelize } = require('../config/db');
const {
  User,
  Category,
  Material,
  Warehouse,
  Inventory
} = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('开始初始化数据...');
    
    // 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      // 1. 创建默认管理员用户
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = await User.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        role: 'admin',
        status: 1,
        last_login: new Date()
      }, { transaction });
      
      console.log('✓ 创建默认管理员用户成功');
      console.log('  用户名: admin');
      console.log('  密码: admin123');
      console.log('  邮箱: admin@example.com');
      
      // 2. 创建默认仓库
      const defaultWarehouse = await Warehouse.create({
        name: '主仓库',
        code: 'MAIN',
        address: '公司总部',
        contact: '仓库管理员',
        phone: '13800138000',
        status: 1,
        created_by: admin.id
      }, { transaction });
      
      console.log('✓ 创建默认仓库成功');
      
      // 3. 创建默认物料分类
      const categories = [
        { name: '电子元件', description: '各类电子元器件', status: 1, sort_order: 1, created_by: admin.id },
        { name: '实验耗材', description: '实验用耗材', status: 1, sort_order: 2, created_by: admin.id },
        { name: '办公用品', description: '日常办公用品', status: 1, sort_order: 3, created_by: admin.id },
        { name: '工具设备', description: '工具和设备', status: 1, sort_order: 4, created_by: admin.id }
      ];
      
      const createdCategories = await Category.bulkCreate(categories, { transaction });
      console.log('✓ 创建默认物料分类成功');
      
      // 4. 创建一些示例物料
      const materials = [
        {
          id: 'MAT001',
          name: '电阻',
          category_id: createdCategories[0].id,
          specification: '100Ω 1/4W',
          unit: '个',
          sku: 'RES-100-025',
          manufacturer: '国产品牌',
          min_stock: 100,
          created_by: admin.id,
          updated_by: admin.id
        },
        {
          id: 'MAT002',
          name: '电容',
          category_id: createdCategories[0].id,
          specification: '10μF 16V',
          unit: '个',
          sku: 'CAP-10UF-16V',
          manufacturer: '国产品牌',
          min_stock: 50,
          created_by: admin.id,
          updated_by: admin.id
        },
        {
          id: 'MAT003',
          name: '打印纸',
          category_id: createdCategories[2].id,
          specification: 'A4 80g',
          unit: '包',
          sku: 'PAPER-A4-80G',
          manufacturer: '得力',
          min_stock: 10,
          created_by: admin.id,
          updated_by: admin.id
        }
      ];
      
      const createdMaterials = await Material.bulkCreate(materials, { transaction });
      console.log('✓ 创建示例物料成功');
      
      // 5. 为示例物料创建初始库存
      const inventories = [
        {
          material_id: createdMaterials[0].id,
          warehouse_id: defaultWarehouse.id,
          quantity: 500,
          created_by: admin.id
        },
        {
          material_id: createdMaterials[1].id,
          warehouse_id: defaultWarehouse.id,
          quantity: 300,
          created_by: admin.id
        },
        {
          material_id: createdMaterials[2].id,
          warehouse_id: defaultWarehouse.id,
          quantity: 50,
          created_by: admin.id
        }
      ];
      
      await Inventory.bulkCreate(inventories, { transaction });
      console.log('✓ 创建初始库存成功');
      
      // 提交事务
      await transaction.commit();
      console.log('\n🎉 数据初始化完成！');
      console.log('\n系统已准备就绪，可以开始使用了！');
      console.log('\n访问地址: http://localhost:3000');
      console.log('登录账号: admin');
      console.log('登录密码: admin123');
      
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('数据初始化失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();