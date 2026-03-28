// 出入库操作控制器
const { Transaction, Material, Warehouse, Inventory, User } = require('../models');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/db');

// 获取出入库记录
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '', type = '', start_date = '', end_date = '' } = req.query;
    
    // 构建查询条件
    const where = {};
    
    if (type) {
      where.type = type;
    }
    
    if (start_date) {
      where.created_at = {
        [Sequelize.Op.gte]: new Date(start_date)
      };
    }
    
    if (end_date) {
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      where.created_at = {
        ...where.created_at,
        [Sequelize.Op.lte]: endDate
      };
    }
    
    // 查询出入库记录
    const { count, rows } = await Transaction.findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
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
          attributes: ['id', 'name', 'specification', 'unit']
        },
        {
          model: Warehouse,
          as: 'fromWarehouse',
          attributes: ['id', 'name']
        },
        {
          model: Warehouse,
          as: 'toWarehouse',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'operator',
          attributes: ['id', 'name']
        }
      ]
    });
    
    // 处理数据格式
    const transactions = rows.map(item => {
      const transaction = item.toJSON();
      return {
        ...transaction,
        material_name: transaction.Material?.name || '',
        specification: transaction.Material?.specification || '',
        unit: transaction.Material?.unit || '',
        from_warehouse_name: transaction.fromWarehouse?.name || '',
        to_warehouse_name: transaction.toWarehouse?.name || '',
        operator_name: transaction.operator?.name || '',
        Material: undefined,
        fromWarehouse: undefined,
        toWarehouse: undefined,
        operator: undefined
      };
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        total: count,
        items: transactions
      }
    });
  } catch (error) {
    console.error('获取出入库记录错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 入库操作
const inbound = async (req, res) => {
  try {
    const { material_id, warehouse_id, quantity, batch_no, purpose } = req.body;
    
    // 参数验证
    if (!material_id || !warehouse_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        code: 400,
        message: '物料、仓库和数量不能为空，且数量必须大于0'
      });
    }
    
    // 查找物料和仓库
    const material = await Material.findByPk(material_id);
    const warehouse = await Warehouse.findByPk(warehouse_id);
    
    if (!material) {
      return res.status(404).json({
        code: 404,
        message: '物料不存在'
      });
    }
    
    if (!warehouse || warehouse.status === 0) {
      return res.status(404).json({
        code: 404,
        message: '仓库不存在或已禁用'
      });
    }
    
    // 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      // 查找或创建库存记录
      let inventory = await Inventory.findOne({
        where: {
          material_id,
          warehouse_id
        },
        transaction
      });
      
      if (!inventory) {
        inventory = await Inventory.create({
          material_id,
          warehouse_id,
          quantity: 0,
          updated_by: req.userId
        }, { transaction });
      }
      
      // 更新库存
      await inventory.update({
        quantity: inventory.quantity + quantity,
        updated_by: req.userId
      }, { transaction });
      
      // 创建入库记录
      const transactionRecord = await Transaction.create({
        id: generateTransactionId(),
        material_id,
        type: 'in',
        quantity,
        to_warehouse_id: warehouse_id,
        operator_id: req.userId,
        purpose: purpose || '采购入库',
        batch_no
      }, { transaction });
      
      // 提交事务
      await transaction.commit();
      
      return res.json({
        code: 200,
        message: '入库成功',
        data: {
          ...transactionRecord.toJSON(),
          material_name: material.name,
          specification: material.specification,
          unit: material.unit,
          warehouse_name: warehouse.name,
          new_quantity: inventory.quantity + quantity
        }
      });
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('入库操作错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 出库操作
const outbound = async (req, res) => {
  try {
    const { material_id, warehouse_id, quantity, purpose } = req.body;
    
    // 参数验证
    if (!material_id || !warehouse_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        code: 400,
        message: '物料、仓库和数量不能为空，且数量必须大于0'
      });
    }
    
    // 查找物料、仓库和库存
    const material = await Material.findByPk(material_id);
    const warehouse = await Warehouse.findByPk(warehouse_id);
    const inventory = await Inventory.findOne({
      where: {
        material_id,
        warehouse_id
      }
    });
    
    if (!material) {
      return res.status(404).json({
        code: 404,
        message: '物料不存在'
      });
    }
    
    if (!warehouse || warehouse.status === 0) {
      return res.status(404).json({
        code: 404,
        message: '仓库不存在或已禁用'
      });
    }
    
    if (!inventory || inventory.quantity < quantity) {
      return res.status(400).json({
        code: 400,
        message: '库存不足'
      });
    }
    
    // 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      // 更新库存
      await inventory.update({
        quantity: inventory.quantity - quantity,
        updated_by: req.userId
      }, { transaction });
      
      // 创建出库记录
      const transactionRecord = await Transaction.create({
        id: generateTransactionId(),
        material_id,
        type: 'out',
        quantity,
        from_warehouse_id: warehouse_id,
        operator_id: req.userId,
        purpose: purpose || '生产领用'
      }, { transaction });
      
      // 提交事务
      await transaction.commit();
      
      return res.json({
        code: 200,
        message: '出库成功',
        data: {
          ...transactionRecord.toJSON(),
          material_name: material.name,
          specification: material.specification,
          unit: material.unit,
          warehouse_name: warehouse.name,
          new_quantity: inventory.quantity - quantity
        }
      });
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('出库操作错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 调拨操作
const transfer = async (req, res) => {
  try {
    const { material_id, from_warehouse_id, to_warehouse_id, quantity, purpose } = req.body;
    
    // 参数验证
    if (!material_id || !from_warehouse_id || !to_warehouse_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        code: 400,
        message: '物料、仓库和数量不能为空，且数量必须大于0'
      });
    }
    
    if (from_warehouse_id === to_warehouse_id) {
      return res.status(400).json({
        code: 400,
        message: '转出仓库和转入仓库不能相同'
      });
    }
    
    // 查找物料和仓库
    const material = await Material.findByPk(material_id);
    const fromWarehouse = await Warehouse.findByPk(from_warehouse_id);
    const toWarehouse = await Warehouse.findByPk(to_warehouse_id);
    
    if (!material) {
      return res.status(404).json({
        code: 404,
        message: '物料不存在'
      });
    }
    
    if (!fromWarehouse || fromWarehouse.status === 0) {
      return res.status(404).json({
        code: 404,
        message: '转出仓库不存在或已禁用'
      });
    }
    
    if (!toWarehouse || toWarehouse.status === 0) {
      return res.status(404).json({
        code: 404,
        message: '转入仓库不存在或已禁用'
      });
    }
    
    // 查找转出仓库的库存
    const fromInventory = await Inventory.findOne({
      where: {
        material_id,
        warehouse_id: from_warehouse_id
      }
    });
    
    if (!fromInventory || fromInventory.quantity < quantity) {
      return res.status(400).json({
        code: 400,
        message: '转出仓库库存不足'
      });
    }
    
    // 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      // 更新转出仓库库存
      await fromInventory.update({
        quantity: fromInventory.quantity - quantity,
        updated_by: req.userId
      }, { transaction });
      
      // 查找或创建转入仓库库存记录
      let toInventory = await Inventory.findOne({
        where: {
          material_id,
          warehouse_id: to_warehouse_id
        },
        transaction
      });
      
      if (!toInventory) {
        toInventory = await Inventory.create({
          material_id,
          warehouse_id: to_warehouse_id,
          quantity: 0,
          updated_by: req.userId
        }, { transaction });
      }
      
      // 更新转入仓库库存
      await toInventory.update({
        quantity: toInventory.quantity + quantity,
        updated_by: req.userId
      }, { transaction });
      
      // 创建调拨记录
      const transactionRecord = await Transaction.create({
        id: generateTransactionId(),
        material_id,
        type: 'transfer',
        quantity,
        from_warehouse_id,
        to_warehouse_id,
        operator_id: req.userId,
        purpose: purpose || '仓库调拨'
      }, { transaction });
      
      // 提交事务
      await transaction.commit();
      
      return res.json({
        code: 200,
        message: '调拨成功',
        data: {
          ...transactionRecord.toJSON(),
          material_name: material.name,
          specification: material.specification,
          unit: material.unit,
          from_warehouse_name: fromWarehouse.name,
          to_warehouse_name: toWarehouse.name,
          from_warehouse_remaining: fromInventory.quantity - quantity,
          to_warehouse_remaining: toInventory.quantity + quantity
        }
      });
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('调拨操作错误:', error);
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

module.exports = {
  getTransactions,
  inbound,
  outbound,
  transfer
};