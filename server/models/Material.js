// 物料模型
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Material = sequelize.define('Material', {
  id: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '物料名称不能为空'
      }
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: '物料分类不能为空'
      }
    }
  },
  specification: {
    type: DataTypes.STRING(100)
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '计量单位不能为空'
      }
    }
  },
  sku: {
    type: DataTypes.STRING(50),
    unique: true,
    comment: '货号'
  },
  sn: {
    type: DataTypes.STRING(50),
    unique: true,
    comment: '序列号'
  },
  manufacturer: {
    type: DataTypes.STRING(100)
  },
  barcode: {
    type: DataTypes.STRING(50),
    unique: true
  },
  min_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '最小库存量(预警线)'
  },
  remark: {
    type: DataTypes.TEXT
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'materials',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Material;