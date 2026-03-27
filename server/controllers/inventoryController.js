// 库存管理控制器
const { Inventory, Material, Warehouse, Transaction } = require('../models');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/db');

// 获取库存列表
const getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '', warehouse_id = '', status = '' } = req.query;
    
    // 构建查询条件
    const where = {};
    
    if (warehouse_id) {
      where.warehouse_id = warehouse_id;
    }
    
    // 查询库存列表
    const { count, rows } = await Inventory.findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      order: [['updated_at', 'DESC']],
      include: [
        {
          model: Material,
          where: keyword ? {
            [Sequelize.Op.or]: [
              { name: { [Sequelize.Op.like]: `%${keyword}%` } },
              { specification: { [Sequelize.Op.like]: `%${keyword}%` } },
              { id: { [Sequelize.Op.like]: `%${keyword}%` } }
            ]
          } : {},
          attributes: ['id', 'name', 'specification', 'unit', 'min_stock']
        },
        {
          model: Warehouse,
          attributes: ['id', 'name']
        }
      ]
    });
    
    // 处理库存状态
    const inventoryList = rows.map(item => {
      const inventory = item.toJSON();
      let inventoryStatus = 'normal';
      
      if (inventory.quantity <= 0) {
        inventoryStatus = 'out';
      } else if (inventory.quantity <= inventory.Material.min_stock) {
        inventoryStatus = 'warning';
      }
      
      if (status && inventoryStatus !== status) {
        return null;
      }
      
      return {
        ...inventory,
        material_name: inventory.Material.name,
        material_id: inventory.Material.id,
        specification: inventory.Material.specification,
        unit: inventory.Material.unit,
        min_stock: inventory.Material.min_stock,
        warehouse_name: inventory.Warehouse.name,
        status: inventoryStatus,
        Material: undefined,
        Warehouse: undefined
      };
    }).filter(Boolean);
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        total: status ? inventoryList.length : count,
        items: inventoryList
      }
    });
  } catch (error) {
    console.error('获取库存列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 调整库存
const adjustInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;
    
    // 参数验证
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        code: 400,
        message: '调整数量不能为空'
      });
    }
    
    // 查找库存记录
    const inventory = await Inventory.findByPk(id, {
      include: [Material, Warehouse]
    });
    
    if (!inventory) {
      return res.status(404).json({
        code: 404,
        message: '库存记录不存在'
      });
    }
    
    // 计算新的库存数量
    const newQuantity = inventory.quantity + quantity;
    
    if (newQuantity < 0) {
      return res.status(400).json({
        code: 400,
        message: '库存不足，无法调整'
      });
    }
    
    // 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      // 更新库存
      await inventory.update({
        quantity: newQuantity,
        updated_by: req.userId
      }, { transaction });
      
      // 创建出入库记录
      const transactionType = quantity > 0 ? 'in' : 'out';
      const absQuantity = Math.abs(quantity);
      
      await Transaction.create({
        id: generateTransactionId(),
        material_id: inventory.material_id,
        type: transactionType,
        quantity: absQuantity,
        from_warehouse_id: transactionType === 'out' ? inventory.warehouse_id : null,
        to_warehouse_id: transactionType === 'in' ? inventory.warehouse_id : null,
        operator_id: req.userId,
        purpose: `库存调整: ${reason || ''}`,
        batch_no: `ADJ${Date.now()}`
      }, { transaction });
      
      // 提交事务
      await transaction.commit();
      
      return res.json({
        code: 200,
        message: '库存调整成功',
        data: {
          id: inventory.id,
          material_id: inventory.material_id,
          material_name: inventory.Material.name,
          warehouse_id: inventory.warehouse_id,
          warehouse_name: inventory.Warehouse.name,
          old_quantity: inventory.quantity,
          new_quantity: newQuantity,
          adjust_quantity: quantity,
          reason
        }
      });
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('调整库存错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取库存预警列表
const getInventoryWarnings = async (req, res) => {
  try {
    // 查询库存预警
    const warnings = await Inventory.findAll({
      include: [
        {
          model: Material,
          attributes: ['id', 'name', 'specification', 'unit', 'min_stock']
        },
        {
          model: Warehouse,
          attributes: ['id', 'name']
        }
      ],
      where: {
        [Sequelize.Op.or]: [
          { quantity: 0 },
          Sequelize.where(
            Sequelize.col('quantity'),
            '<=',
            Sequelize.col('Material.min_stock')
          )
        ]
      }
    });
    
    const warningList = warnings.map(item => {
      const inventory = item.toJSON();
      let status = 'warning';
      
      if (inventory.quantity <= 0) {
        status = 'out';
      }
      
      return {
        id: inventory.id,
        material_id: inventory.Material.id,
        material_name: inventory.Material.name,
        specification: inventory.Material.specification,
        warehouse_id: inventory.Warehouse.id,
        warehouse_name: inventory.Warehouse.name,
        quantity: inventory.quantity,
        unit: inventory.Material.unit,
        min_stock: inventory.Material.min_stock,
        shortage: Math.max(0, inventory.Material.min_stock - inventory.quantity),
        status
      };
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: warningList
    });
  } catch (error) {
    console.error('获取库存预警错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 生成事务ID
function generateTransactionId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `T${year}${month}${day}${random}`;
}