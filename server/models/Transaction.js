// 出入库记录模型
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  material_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: 'materials',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('in', 'out', 'transfer'),
    allowNull: false,
    comment: 'in:入库, out:出库, transfer:调拨'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: '数量必须大于0'
      }
    }
  },
  from_warehouse_id: {
    type: DataTypes.STRING(20),
    references: {
      model: 'warehouses',
      key: 'id'
    }
  },
  to_warehouse_id: {
    type: DataTypes.STRING(20),
    references: {
      model: 'warehouses',
      key: 'id'
    }
  },
  operator_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  purpose: {
    type: DataTypes.STRING(200)
  },
  batch_no: {
    type: DataTypes.STRING(50)
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Transaction;